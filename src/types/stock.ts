export type Sector = string
export type ChartType = 'line' | 'bar' | 'area'

export interface MetricDataPoint {
  year?: number
  period?: string  // e.g. "Q1 2024" for quarterly
  value: number
}

export interface Metric {
  id: string
  label: string
  type: ChartType
  unit: string     // '%', 'IDR T', 'x', etc.
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
}

export interface StockAnalysis extends StockFrontmatter {
  id: string    // derived from filename
  body: string  // raw markdown
}
