import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import GithubSlugger from 'github-slugger'
import { parse as parseYaml } from 'yaml'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import rehypeSlug from 'rehype-slug'

const CONTENT_DIR = fileURLToPath(new URL('./src/content', import.meta.url))

// Exposes every document's frontmatter as `virtual:content-manifest` by reading
// the files directly at build time.
//
// Why this exists: the library page needs every title up front, but importing
// the .mdx modules to get them — even with `import: 'frontmatter'` — makes them
// static imports, and a module that is both statically and dynamically imported
// cannot be code-split (rolldown warns INEFFECTIVE_DYNAMIC_IMPORT). Reading the
// YAML off disk keeps the .mdx files purely dynamic, so each one becomes its own
// lazily-fetched chunk.
function contentManifest(): Plugin {
  const VIRTUAL_ID = 'virtual:content-manifest'
  const RESOLVED_ID = '\0' + VIRTUAL_ID

  function readManifest() {
    if (!existsSync(CONTENT_DIR)) return []
    return readdirSync(CONTENT_DIR)
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => {
        const raw = readFileSync(join(CONTENT_DIR, file), 'utf8')
        const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
        const data = match ? ((parseYaml(match[1]) as object) ?? {}) : {}
        return { slug: file.replace(/\.mdx$/, ''), ...data }
      })
  }

  return {
    name: 'content-manifest',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      return `export const manifest = ${JSON.stringify(readManifest())}`
    },
    configureServer(server) {
      server.watcher.add(CONTENT_DIR)
      const refresh = (file: string) => {
        if (!file.endsWith('.mdx')) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
      server.watcher.on('change', refresh)
    },
  }
}

// Everything below turns the .mdx sources into searchable plain text at build
// time, exposed as `virtual:search-index`.
//
// Only src/lib/search.ts imports it, and only with a dynamic `import()`, so the
// index lands in its own chunk that is fetched the first time someone searches
// rather than on first paint. Same constraint as the manifest above: never
// import this module statically from anything in the initial graph.

// Inline markdown → plain text. Runs per line, after block-level syntax is off.
function stripInline(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images → alt text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → label
    .replace(/[*`~]+/g, '') // bold / italic / inline code / strikethrough
    .replace(/\\([<>{}[\]\\&*_])/g, '$1') // MDX escapes back to the literal
    .replace(/\s+/g, ' ')
    .trim()
}

export interface IndexedSection {
  /** Heading text, empty for the lead-in before a document's first heading. */
  h: string
  /** rehype-slug's id for that heading, so results can deep-link to it. */
  id: string
  /** Heading depth (1–6), 0 for the lead-in. */
  d: number
  /** The section's prose, flattened. */
  t: string
}

// Splits one document into sections at its headings. The slugger is per
// document and sees every heading in order, which is what makes its ids —
// including the `-1`, `-2` suffixes on repeated headings — line up with the
// ones rehype-slug puts in the rendered page.
export function toSections(raw: string): IndexedSection[] {
  const body = raw
    .replace(/^---\r?\n[\s\S]*?\r?\n---/, '') // frontmatter, already in the manifest
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '') // {/* MDX comments */}
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ') // JSX/HTML tags, keeping their children

  const slugger = new GithubSlugger()
  const sections: IndexedSection[] = [{ h: '', id: '', d: 0, t: '' }]
  const lines: string[] = []
  let inFence = false

  function flush() {
    sections[sections.length - 1].t = lines.join(' ').replace(/\s+/g, ' ').trim()
    lines.length = 0
  }

  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue // keep the code itself, drop the fence markers
    }

    const heading = !inFence && /^(#{1,6})\s+(.+)$/.exec(line)
    if (heading) {
      flush()
      const text = stripInline(heading[2]).replace(/\s*#+\s*$/, '')
      sections.push({ h: text, id: slugger.slug(text), d: heading[1].length, t: '' })
      continue
    }

    if (inFence) {
      // Several documents draw ownership charts as box-art inside fences. The
      // rules and arrows are pure noise in a snippet and a real share of the
      // index's weight, so keep only lines that are mostly words.
      const trimmed = line.trim()
      const words = trimmed.replace(/[^\p{L}\p{N}]/gu, '').length
      if (trimmed && words >= trimmed.length * 0.4) lines.push(trimmed)
      continue
    }

    if (/^\s*\|?[\s:|-]*-[\s:|-]*\|[\s:|-]*$/.test(line)) continue // table rule
    if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(line)) continue // thematic break

    const cleaned = stripInline(
      line
        .replace(/^\s*>+\s?/, '') // blockquote marker
        .replace(/^\s*([-+*]|\d+[.)])\s+/, '') // list marker
        .replace(/\|/g, ' '), // table cell walls
    )
    if (cleaned) lines.push(cleaned)
  }

  flush()
  return sections.filter((section) => section.h || section.t)
}

function searchIndex(): Plugin {
  const VIRTUAL_ID = 'virtual:search-index'
  const RESOLVED_ID = '\0' + VIRTUAL_ID

  function readIndex() {
    if (!existsSync(CONTENT_DIR)) return []
    return readdirSync(CONTENT_DIR)
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => ({
        slug: file.replace(/\.mdx$/, ''),
        sections: toSections(readFileSync(join(CONTENT_DIR, file), 'utf8')),
      }))
  }

  return {
    name: 'search-index',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      // Wrapped in JSON.parse of a string literal rather than emitted as a bare
      // object literal: at ~3MB the engine parses the string form several times
      // faster, and this chunk is parsed while someone waits on a keystroke.
      return `export const index = JSON.parse(${JSON.stringify(JSON.stringify(readIndex()))})`
    },
    configureServer(server) {
      // The content watcher is already registered by contentManifest; this only
      // needs to drop its own cached module so the next search re-reads disk.
      const refresh = (file: string) => {
        if (!file.endsWith('.mdx')) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
      server.watcher.on('change', refresh)
    },
  }
}

export default defineConfig({
  plugins: [
    contentManifest(),
    searchIndex(),
    // Must run before the React plugin so it receives compiled JSX, not raw MDX.
    {
      enforce: 'pre',
      ...mdx({
        // Lets MDXProvider inject the component registry, so .mdx files can use
        // <Callout>, <Counter>, etc. without importing them.
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [
          remarkGfm,
          remarkFrontmatter,
          // Turns the YAML block into `export const frontmatter = {...}`.
          [remarkMdxFrontmatter, { name: 'frontmatter' }],
        ],
        rehypePlugins: [rehypeSlug],
      }),
    },
    // `include` is widened so Fast Refresh also covers .mdx files.
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
  ],
})
