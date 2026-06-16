export type Sector = string
export type ChartType = 'line' | 'bar' | 'area'

export interface MetricDataPoint {
  year?: number
  period?: string // e.g. "Q1 2024" for quarterly
  value: number

}

export interface Metric {
  id: string
  label: string
  type: ChartType
  compareType?: ChartType
  unit: string // '%', 'Rp(B)', 'x', etc.
  color?: string
  dualWith?: string
  stackWith?: string[]
  comboWith?: string
  note?: string
  data: MetricDataPoint[]
}

export interface StockFrontmatter {
  ticker: string
  companyName: string
  logoDomain: string
  sector: Sector
  dateAnalyzed: string
  title: string
  subtitle: string
  visibility?: 'public' | 'private'
  metrics?: Metric[]
  /** Merged on top of the sector template: same id = replace, new id = append */
  metricOverrides?: Metric[]
}

export interface StockAnalysis extends StockFrontmatter {
  id: string // derived from filename
  body: string // raw markdown
}
