import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { analyses } from '../data/content'
import type { StockAnalysis } from '../types/stock'
import Layout from '../components/Layout'

const stocksWithMetrics = analyses.filter((s) => s.metrics && s.metrics.length > 0)

function StockCard({ stock }: { stock: StockAnalysis }) {
  const latest = useMemo(() => {
    if (!stock.metrics) return []
    const latestYear = Math.max(
      ...stock.metrics.flatMap((m) => m.data.map((d) => d.year ?? 0)),
    )
    return stock.metrics.map((m) => ({
      label: m.label,
      unit: m.unit,
      value: m.data.find((d) => d.year === latestYear)?.value,
    }))
  }, [stock])

  return (
    <Link
      to={`/metrics/${stock.id}`}
      className="flex flex-col gap-3 p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
            {stock.ticker}
          </p>
          <p className="text-xs text-slate-400 truncate mt-0.5">{stock.companyName}</p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5 whitespace-nowrap shrink-0">
          {stock.sector}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {latest.slice(0, 4).map((m) => (
          <div key={m.label}>
            <p className="text-xs text-slate-400 truncate">{m.label}</p>
            <p className="text-sm font-semibold text-slate-900 tabular-nums">
              {m.value !== undefined ? `${m.value}${m.unit}` : '—'}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 mt-auto pt-1">
        {stock.metrics!.length} metrics →
      </p>
    </Link>
  )
}

export default function Metrics() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return stocksWithMetrics
    return stocksWithMetrics.filter(
      (s) =>
        s.ticker.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q),
    )
  }, [search])

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-10 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Key Metrics</h1>
          <p className="text-slate-500 text-sm mt-1">
            {stocksWithMetrics.length} stocks · click any card to see its data
          </p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by ticker, company or sector…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">No stocks match your search.</div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((stock) => (
              <StockCard key={stock.id} stock={stock} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
