import { load as parseYaml } from 'js-yaml'
import type { StockAnalysis, StockFrontmatter, Metric, MetricDataPoint } from '../types/stock'

// Load all .md files from src/content/ at build time
const modules = import.meta.glob('../content/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function parseMd(raw: string): { data: StockFrontmatter; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {} as StockFrontmatter, content: raw }
  const data = parseYaml(match[1]) as StockFrontmatter
  return { data, content: match[2].trim() }
}

function filenameToId(path: string): string {
  return path.split('/').pop()!.replace('.md', '').toLowerCase()
}

// Parses "Q1 2023" → sortable number like 2023.1
function periodSortKey(period: string): number {
  const [q, y] = period.split(' ')
  return Number(y) + Number(q.replace('Q', '')) * 0.1
}

// Evaluates left-to-right: "casa / dpk * 100", "a + b", "a * 0.01", etc.
// Also supports: "yoy(metric_id)" for year-over-year % growth
function resolveFormulas(metrics: Metric[]): Metric[] {
  return metrics.map((m) => {
    if (!m.formula) return { ...m, data: m.data ?? [] }

    // yoy(metric_id) — computes (current / previous - 1) * 100
    const yoyMatch = m.formula.trim().match(/^yoy\((\w+)\)$/)
    if (yoyMatch) {
      const source = metrics.find((x) => x.id === yoyMatch[1])
      if (!source) return { ...m, data: [] }

      const annualPts = source.data
        .filter((d) => d.year !== undefined && !d.period)
        .sort((a, b) => (a.year ?? 0) - (b.year ?? 0))

      const periodicPts = source.data
        .filter((d) => d.period !== undefined)
        .sort((a, b) => periodSortKey(a.period!) - periodSortKey(b.period!))

      const points: MetricDataPoint[] = []

      for (let i = 1; i < annualPts.length; i++) {
        const prev = annualPts[i - 1].value
        if (prev !== 0)
          points.push({ year: annualPts[i].year, value: Math.round(((annualPts[i].value / prev - 1) * 100) * 100) / 100 })
      }

      // For periodic: compare same quarter previous year (e.g. Q1 2024 vs Q1 2023)
      for (const pt of periodicPts) {
        const [q, y] = pt.period!.split(' ')
        const prevPeriod = `${q} ${Number(y) - 1}`
        const prev = periodicPts.find((d) => d.period === prevPeriod)?.value
        if (prev !== undefined && prev !== 0)
          points.push({ period: pt.period, value: Math.round(((pt.value / prev - 1) * 100) * 100) / 100 })
      }

      return { ...m, data: points }
    }

    // Tokenize into alternating [operand, op, operand, op, ...]
    const tokens = m.formula.trim().split(/\s*([-+*/])\s*/).map((s) => s.trim()).filter(Boolean)
    if (tokens.length < 3 || tokens.length % 2 === 0) return { ...m, data: [] }

    const baseMetric = metrics.find((x) => x.id === tokens[0])
    if (!baseMetric) return { ...m, data: [] }

    const points: MetricDataPoint[] = []
    for (const pt of baseMetric.data) {
      let result = pt.value

      for (let i = 1; i < tokens.length; i += 2) {
        const op = tokens[i]
        const rightToken = tokens[i + 1]
        const rightMetric = metrics.find((x) => x.id === rightToken)
        const rightVal = rightMetric
          ? (rightMetric.data.find((d) =>
              pt.year !== undefined ? d.year === pt.year : d.period === pt.period
            )?.value ?? NaN)
          : parseFloat(rightToken)

        if (isNaN(rightVal)) { result = NaN; break }
        switch (op) {
          case '+': result += rightVal; break
          case '-': result -= rightVal; break
          case '*': result *= rightVal; break
          case '/': result = rightVal !== 0 ? result / rightVal : NaN; break
        }
      }

      if (!isNaN(result)) points.push({ ...pt, value: Math.round(result * 100) / 100 })
    }

    return { ...m, data: points }
  })
}

export const analyses: StockAnalysis[] = Object.entries(modules)
  .map(([path, raw]) => {
    const { data, content } = parseMd(raw)
    const metrics = data.metrics ? resolveFormulas(data.metrics) : undefined
    return { id: filenameToId(path), body: content, ...data, metrics }
  })
  .sort((a, b) => new Date(b.dateAnalyzed).getTime() - new Date(a.dateAnalyzed).getTime())

export function getAnalysis(id: string): StockAnalysis | undefined {
  return analyses.find((a) => a.id === id)
}
