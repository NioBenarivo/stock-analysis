import { useState } from 'react'
import { BarChart2, Table } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface Series {
  ticker: string
  data: { year: number; value: number }[]
}

interface Props {
  label: string
  unit: string
  series: Series[]
}

export default function ComparisonChart({ label, unit, series }: Props) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const years = [...new Set(series.flatMap((s) => s.data.map((d) => d.year)))].sort((a, b) => a - b)

  const data = years.map((year) => {
    const point: Record<string, number> = { year }
    series.forEach((s) => {
      const match = s.data.find((d) => d.year === year)
      if (match) point[s.ticker] = match.value
    })
    return point
  })

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-md shadow-slate-200/60">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">{label} — Peer Comparison</p>
        <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setView('chart')}
            className={`p-1.5 rounded-md transition-colors ${view === 'chart' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setView('table')}
            className={`p-1.5 rounded-md transition-colors ${view === 'table' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Table className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-slate-400 font-medium pb-2">Year</th>
                {series.map((s) => (
                  <th key={s.ticker} className="text-right text-slate-400 font-medium pb-2">{s.ticker}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {years.map((year) => (
                <tr key={year} className="border-b border-slate-50 last:border-0">
                  <td className="py-1.5 text-slate-600">{year}</td>
                  {series.map((s) => {
                    const val = data.find((d) => d.year === year)?.[s.ticker]
                    return (
                      <td key={s.ticker} className="py-1.5 text-right font-medium text-slate-900">
                        {val !== undefined ? `${val}${unit}` : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}${unit}`}
              width={48}
              domain={['auto', 'auto']}
            />
            <Tooltip
              formatter={(v: number, name: string) => [`${v}${unit}`, name]}
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            {series.map((s, i) => (
              <Line
                key={s.ticker}
                type="monotone"
                dataKey={s.ticker}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
