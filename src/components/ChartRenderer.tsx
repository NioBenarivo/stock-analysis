import type { Metric } from '../types/stock'
import MetricChart from './MetricChart'
import DualMetricChart from './DualMetricChart'
import StackedBarChart from './StackedBarChart'
import ComboChart from './ComboChart'

interface Props {
  metric: Metric
  metrics: Metric[]
  color?: string
}

export default function ChartRenderer({ metric, metrics, color }: Props) {
  const noteEl = metric.note ? (
    <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500 italic px-1">{metric.note}</p>
  ) : null

  if (metric.dualWith) {
    const paired = metrics.find((m) => m.id === metric.dualWith)
    if (paired) return <><DualMetricChart percentMetric={metric} nominalMetric={paired} />{noteEl}</>
  }

  if (metric.stackWith?.length) {
    const stackMetrics = metric.stackWith
      .map((id) => metrics.find((m) => m.id === id))
      .filter((m): m is Metric => m !== undefined)
    if (stackMetrics.length) return <><StackedBarChart metrics={stackMetrics} />{noteEl}</>
  }

  if (metric.comboWith) {
    const lineMetric = metrics.find((m) => m.id === metric.comboWith)
    if (lineMetric) return <><ComboChart leftMetrics={[metric]} rightMetrics={[lineMetric]} />{noteEl}</>
  }

  return <><MetricChart metric={metric} color={color} />{noteEl}</>
}
