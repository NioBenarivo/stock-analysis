import { load as parseYaml } from 'js-yaml'
import type { Metric, StockAnalysis, StockFrontmatter } from '../types/stock'
import { SECTOR_TEMPLATES } from '../config/sectorTemplates'

const modules = import.meta.glob('../content/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function parseMd(raw: string): { data: StockFrontmatter; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {} as StockFrontmatter, content: raw }
  const data = parseYaml(match[1]) as StockFrontmatter
  return { data, content: match[2].trim() }
}

function filenameToId(path: string): string {
  return path.split('/').pop()!.replace('.md', '').toLowerCase()
}

function extractNote(lines: string[]): string | undefined {
  const noteLines = lines.filter((l) => l.startsWith('note:'))
  return noteLines.length ? noteLines.map((l) => l.replace(/^note:\s*/, '')).join(' ') : undefined
}

function patchNote(result: Metric[], id: string, note: string) {
  const idx = result.findIndex((m) => m.id === id)
  if (idx !== -1) result[idx] = { ...result[idx], note }
}

// Scans all chart blocks in the body for `note:` lines and attaches them to
// the relevant metric so both the company page and key metrics page can render them.
function attachBlockNotes(body: string, metrics: Metric[]): Metric[] {
  const result = [...metrics]
  const blockRe = /```(\w+)\n([\s\S]*?)```/g
  let match
  while ((match = blockRe.exec(body)) !== null) {
    const [, lang, raw] = match
    const lines = raw.split('\n').map((s) => s.trim()).filter(Boolean)
    const note = extractNote(lines)
    if (!note) continue
    const data = lines.filter((l) => !l.startsWith('note:'))

    if (lang === 'chart' || lang === 'compare') {
      if (data[0]) patchNote(result, data[0], note)
    } else if (lang === 'dual') {
      const id = data.find((l) => l.startsWith('percent:'))?.replace('percent:', '').trim()
      if (id) patchNote(result, id, note)
    } else if (lang === 'combo') {
      const id = data.find((l) => l.startsWith('left:'))?.replace('left:', '').split(',')[0].trim()
      if (id) patchNote(result, id, note)
    } else if (lang === 'stack') {
      const parentIdx = result.findIndex(
        (m) => m.stackWith?.length === data.length && data.every((id) => m.stackWith!.includes(id)),
      )
      if (parentIdx !== -1) result[parentIdx] = { ...result[parentIdx], note }
    }
  }
  return result
}

export const analyses: StockAnalysis[] = Object.entries(modules)
  .map(([path, raw]) => {
    const { data, content } = parseMd(raw)
    const base = data.metrics ?? SECTOR_TEMPLATES[data.sector] ?? undefined
    const metrics = base ? attachBlockNotes(content, base) : undefined
    return { id: filenameToId(path), body: content, ...data, metrics }
  })
  .sort((a, b) => new Date(b.dateAnalyzed).getTime() - new Date(a.dateAnalyzed).getTime())

export function getAnalysis(id: string): StockAnalysis | undefined {
  return analyses.find((a) => a.id === id)
}
