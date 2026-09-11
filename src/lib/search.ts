import { docs, type Doc } from './docs'

// Ranking and snippet extraction over the build-time index. The index itself is
// ~3MB of prose, so it is never part of the initial graph — `loadSearchIndex`
// pulls it in as its own chunk on the first keystroke, and until it resolves
// searching still works against frontmatter alone (see `searchDocs`).

export interface IndexedSection {
  h: string
  id: string
  d: number
  t: string
}

interface IndexEntry {
  slug: string
  sections: IndexedSection[]
}

// A section plus the lowercased copy the scanner actually reads. Lowercasing
// 3MB on every keystroke would be the slowest thing in the loop, so it happens
// once, here, when the index lands.
interface PreparedSection extends IndexedSection {
  lower: string
  headingLower: string
}

export interface PreparedIndex {
  bySlug: Map<string, PreparedSection[]>
}

export type SnippetPart = { text: string; match: boolean }

export interface SearchResult {
  doc: Doc
  score: number
  /** Heading of the best-matching section, when the hit came from the body. */
  heading?: string
  /** `/slug#id` — the deepest link the match supports. */
  href: string
  /** Matched prose with the query terms marked, for display under the title. */
  snippet?: SnippetPart[]
}

let pending: Promise<PreparedIndex> | null = null

export function loadSearchIndex(): Promise<PreparedIndex> {
  // Cached as the promise rather than the value so concurrent callers — the
  // palette and the library filter can both be alive — share one fetch.
  pending ??= import('virtual:search-index').then(({ index }) => prepare(index))
  return pending
}

function prepare(index: IndexEntry[]): PreparedIndex {
  const bySlug = new Map<string, PreparedSection[]>()
  for (const entry of index) {
    bySlug.set(
      entry.slug,
      entry.sections.map((section) => ({
        ...section,
        lower: section.t.toLowerCase(),
        headingLower: section.h.toLowerCase(),
      })),
    )
  }
  return { bySlug }
}

export function parseQuery(query: string): string[] {
  return [...new Set(query.toLowerCase().split(/\s+/).filter(Boolean))]
}

const WORD_CHAR = /[\p{L}\p{N}]/u

// Terms match at the start of a word, never inside one: typing "ratio" should
// find "ratios" and "ratio analysis" but not "concentration" or "exploration".
// Matching a prefix rather than a whole word is deliberate — results update on
// every keystroke, so a half-typed word still has to find something.
export function findWordHit(haystack: string, needle: string, from = 0): number {
  let at = haystack.indexOf(needle, from)
  while (at !== -1) {
    if (at === 0 || !WORD_CHAR.test(haystack[at - 1])) return at
    at = haystack.indexOf(needle, at + 1)
  }
  return -1
}

function hasWord(haystack: string, needle: string): boolean {
  return findWordHit(haystack, needle) !== -1
}

function countWordHits(haystack: string, needle: string, limit: number): number {
  let count = 0
  let at = findWordHit(haystack, needle)
  while (at !== -1 && count < limit) {
    count++
    at = findWordHit(haystack, needle, at + needle.length)
  }
  return count
}

// Weights are per field, not per hit, because a term in a title says far more
// about a document than the same term buried in its twentieth table. Body hits
// are counted but capped, so a long document can't outrank a direct title match
// by sheer repetition.
const TITLE_PHRASE = 120
const TITLE_TERM = 45
const TAG_TERM = 30
const DESCRIPTION_TERM = 18
const HEADING_TERM = 12
const BODY_TERM = 3
const BODY_TERM_CAP = 5
const ALL_TERMS_BONUS = 4

export function searchDocs(
  query: string,
  index: PreparedIndex | null,
  limit = 20,
): SearchResult[] {
  const terms = parseQuery(query)
  if (terms.length === 0) return []

  const phrase = query.trim().toLowerCase()
  const results: SearchResult[] = []

  for (const doc of docs) {
    const title = doc.title.toLowerCase()
    const description = doc.description?.toLowerCase() ?? ''
    const tags = doc.tags?.map((tag) => tag.toLowerCase()) ?? []
    const sections = index?.bySlug.get(doc.slug) ?? []

    let score = 0
    let best: { section: PreparedSection; score: number } | null = null
    // Terms accounted for by frontmatter alone. When that covers the whole
    // query the result links to the top of the document rather than diving
    // into whatever section happens to repeat the word.
    const inMetadata = new Set<string>()
    const found = new Set<string>()

    for (const term of terms) {
      if (hasWord(title, term)) {
        score += TITLE_TERM
        inMetadata.add(term)
      }
      // The slug carries the ticker for documents whose title spells the
      // company out, so "aali" finds it either way.
      if (hasWord(doc.slug, term)) {
        score += TITLE_TERM / 2
        inMetadata.add(term)
      }
      if (tags.some((tag) => hasWord(tag, term))) {
        score += TAG_TERM
        inMetadata.add(term)
      }
      if (hasWord(description, term)) {
        score += DESCRIPTION_TERM
        inMetadata.add(term)
      }
      if (inMetadata.has(term)) found.add(term)
    }

    for (const section of sections) {
      let sectionScore = 0
      let termsHere = 0

      for (const term of terms) {
        const inHeading = hasWord(section.headingLower, term)
        const bodyHits = countWordHits(section.lower, term, BODY_TERM_CAP)
        if (!inHeading && bodyHits === 0) continue

        found.add(term)
        termsHere++
        sectionScore += (inHeading ? HEADING_TERM : 0) + bodyHits * BODY_TERM
      }

      if (sectionScore === 0) continue
      // Scoring a section as a whole, rather than each term separately, is what
      // makes "stripping ratio" surface the passage discussing both instead of
      // the table that repeats "ratio" twelve times.
      if (termsHere === terms.length && terms.length > 1) sectionScore *= ALL_TERMS_BONUS
      score += sectionScore
      if (!best || sectionScore > best.score) best = { section, score: sectionScore }
    }

    // Every term has to land somewhere in the document — searching two words
    // should narrow the list, not widen it.
    if (found.size !== terms.length) continue

    if (terms.length > 1) {
      if (hasWord(title, phrase)) score += TITLE_PHRASE
      else if (hasWord(description, phrase)) score += DESCRIPTION_TERM
      else if (best && hasWord(best.section.lower, phrase)) score += TITLE_PHRASE / 2
    } else if (hasWord(title, phrase)) {
      score += TITLE_PHRASE / 2
    }

    const metadataExplainsQuery = inMetadata.size === terms.length

    const body = metadataExplainsQuery ? null : best
    results.push({
      doc,
      score,
      heading: body?.section.h || undefined,
      href: body?.section.id ? `/${doc.slug}#${body.section.id}` : `/${doc.slug}`,
      snippet: body ? buildSnippet(body.section.t, terms) : undefined,
    })
  }

  return results
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
    .slice(0, limit)
}

const SNIPPET_RADIUS = 90

export function buildSnippet(text: string, terms: string[]): SnippetPart[] | undefined {
  const lower = text.toLowerCase()
  let at = -1
  let hit = ''
  for (const term of terms) {
    const found = findWordHit(lower, term)
    if (found !== -1 && (at === -1 || found < at)) {
      at = found
      hit = term
    }
  }
  if (at === -1) return undefined

  // Widen to whole words so the snippet never starts mid-token.
  let start = Math.max(0, at - SNIPPET_RADIUS)
  let end = Math.min(text.length, at + hit.length + SNIPPET_RADIUS)
  if (start > 0) {
    const space = text.indexOf(' ', start)
    if (space !== -1 && space < at) start = space + 1
  }
  if (end < text.length) {
    const space = text.lastIndexOf(' ', end)
    if (space > at + hit.length) end = space
  }

  const excerpt = `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
  return markTerms(excerpt, terms)
}

function escapeForRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function markTerms(text: string, terms: string[]): SnippetPart[] {
  if (terms.length === 0) return [{ text, match: false }]

  // The lookbehind keeps the mark on word starts, matching how `findWordHit`
  // scores them — otherwise "ratio" would highlight inside "concentration".
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(${terms.map(escapeForRegExp).join('|')})`,
    'giu',
  )
  // `split` on a capturing pattern returns the matched separators as their own
  // parts, so a part is a hit exactly when it is one of the terms.
  return text
    .split(pattern)
    .filter(Boolean)
    .map((part) => ({ text: part, match: terms.includes(part.toLowerCase()) }))
}
