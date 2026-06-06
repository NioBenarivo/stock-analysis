import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getAnalysis } from '../data/content'
import Layout from '../components/Layout'
import MetricChart from '../components/MetricChart'

const METRIC_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444']

export default function MetricsDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const stock = getAnalysis(id ?? '')

  if (!stock || !stock.metrics?.length) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-slate-400">No metrics found.</div>
      </Layout>
    )
  }

  const { metrics } = stock

  const years = [...new Set(metrics.flatMap((m) => m.data.map((d) => d.year ?? 0)))]
    .filter(Boolean)
    .sort((a, b) => b - a)

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-10 py-10">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">{stock.ticker}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{stock.companyName} · {stock.sector}</p>
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {metrics.map((metric, i) => (
            <MetricChart
              key={metric.id}
              metric={metric}
              color={METRIC_COLORS[i % METRIC_COLORS.length]}
            />
          ))}
        </div>

        {/* Summary table — all metrics side by side at a glance */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">All Metrics</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-slate-400 font-medium px-6 py-3 w-20">Year</th>
                  {metrics.map((m) => (
                    <th key={m.id} className="text-right text-slate-500 font-medium px-5 py-3 whitespace-nowrap">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {years.map((year, i) => (
                  <tr
                    key={year}
                    className={`border-b border-slate-50 last:border-0 ${i === 0 ? 'bg-blue-50/40' : 'hover:bg-slate-50'}`}
                  >
                    <td className={`px-6 py-3 font-medium ${i === 0 ? 'text-blue-600' : 'text-slate-500'}`}>
                      {year}
                    </td>
                    {metrics.map((m) => {
                      const point = m.data.find((d) => d.year === year)
                      return (
                        <td key={m.id} className="px-5 py-3 text-right font-medium text-slate-900 tabular-nums">
                          {point !== undefined ? `${point.value}${m.unit}` : '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
