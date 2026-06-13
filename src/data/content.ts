import { load as parseYaml } from 'js-yaml'
import type { StockAnalysis, StockFrontmatter } from '../types/stock'
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

export const analyses: StockAnalysis[] = Object.entries(modules)
  .map(([path, raw]) => {
    const { data, content } = parseMd(raw)
    const metrics = data.metrics ?? SECTOR_TEMPLATES[data.sector] ?? undefined
    return { id: filenameToId(path), body: content, ...data, metrics }
  })
  .sort((a, b) => new Date(b.dateAnalyzed).getTime() - new Date(a.dateAnalyzed).getTime())

export function getAnalysis(id: string): StockAnalysis | undefined {
  return analyses.find((a) => a.id === id)
}
