import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { analyses } from '../data/content'
import type { StockAnalysis } from '../types/stock'
import Layout from '../components/Layout'

function CompanyLogo({ domain, ticker }: { domain: string; ticker: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-semibold text-sm shrink-0">
        {ticker.slice(0, 2)}
      </div>
    )
  }

  return (
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={ticker}
      onError={() => setFailed(true)}
      className="w-10 h-10 rounded-xl object-contain bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1 shrink-0"
    />
  )
}

function CompanyCard({ stock }: { stock: StockAnalysis }) {
  return (
    <Link
      to={`/company/${stock.id}`}
      className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-3">
        <CompanyLogo domain={stock.logoDomain} ticker={stock.ticker} />
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {stock.ticker}
        </span>
      </div>

      <div>
        <p className="text-slate-900 dark:text-white font-semibold text-base leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {stock.title}
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-snug">
          {stock.subtitle}
        </p>
      </div>
    </Link>
  )
}

export default function Home() {
  const [search, setSearch] = useState('')

  const publicAnalyses = useMemo(() => analyses.filter((s) => s.visibility === 'public'), [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return publicAnalyses
    return publicAnalyses.filter(
      (s) =>
        s.ticker.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q),
    )
  }, [search, publicAnalyses])

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-10 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">All Companies</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {publicAnalyses.length} analyses
          </p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search any company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-600 text-sm">
            No companies match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((stock) => (
              <CompanyCard key={stock.id} stock={stock} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
