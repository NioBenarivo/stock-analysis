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
  unit: string        // '%', 'Rp(B)', 'x', etc.
  color?: string      // hex color, e.g. '#3b82f6'
  dualWith?: string    // id of a paired metric for the % ↔ nominal toggle
  stackWith?: string[] // ids of metrics to stack together in a stacked bar chart
  comboWith?: string   // id of a metric to show as line on right axis alongside this bar chart
  formula?: string    // e.g. "casa / dpk * 100" — computed from other metric ids
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
