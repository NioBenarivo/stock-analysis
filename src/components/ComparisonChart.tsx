import { useState } from 'react'
import { BarChart2, Table, Maximize2 } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LabelList,
} from 'recharts'
import { useIsDark } from '../hooks/useIsDark'
import { fmtValue, fmtTick } from '../utils/format'
import FullscreenModal from './FullscreenModal'

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
  const [fullscreen, setFullscreen] = useState(false)
  const isDark = useIsDark()

  const tick = isDark ? '#64748b' : '#94a3b8'
  const grid = isDark ? '#1e293b' : '#f1f5f9'

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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-3 shadow-md shadow-slate-200/60 dark:shadow-none">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label} — Peer Comparison</p>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            <button onClick={() => setView('chart')} className={`p-1.5 rounded-md transition-colors ${view === 'chart' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}><BarChart2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => setView('table')} className={`p-1.5 rounded-md transition-colors ${view === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}><Table className="w-3.5 h-3.5" /></button>
          </div>
          <button onClick={() => setFullscreen(true)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left text-slate-400 font-medium pb-2">Year</th>
                {series.map((s) => (
                  <th key={s.ticker} className="text-right text-slate-400 font-medium pb-2">{s.ticker}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {years.map((year) => (
                <tr key={year} className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <td className="py-1.5 text-slate-600 dark:text-slate-400">{year}</td>
                  {series.map((s) => {
                    const val = data.find((d) => d.year === year)?.[s.ticker]
                    return (
                      <td key={s.ticker} className="py-1.5 text-right font-medium text-slate-900 dark:text-white">
                        {val !== undefined ? fmtValue(val, unit) : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        renderChart(220)
      )}

      {fullscreen && (
        <FullscreenModal title={`${label} — Peer Comparison`} onClose={() => setFullscreen(false)}>
          {renderChart(480)}
        </FullscreenModal>
      )}
    </div>
  )

  function renderChart(h: number) {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <LineChart data={data} margin={{ top: 24, right: 28, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} tickFormatter={(v) => fmtTick(v, unit === '%' ? '%' : '')} width={40} domain={['auto', 'auto']} />
          <Tooltip formatter={(v, name) => [fmtValue(Number(v), unit), name]} contentStyle={{ background: isDark ? '#1e293b' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 8, fontSize: 12, color: isDark ? '#f8fafc' : '#0f172a' }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12, color: isDark ? '#94a3b8' : '#64748b' }} />
          {series.map((s, i) => (
            <Line key={s.ticker} type="monotone" dataKey={s.ticker} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3, fill: COLORS[i % COLORS.length], strokeWidth: 0 }} activeDot={{ r: 4, strokeWidth: 0 }}>
              <LabelList dataKey={s.ticker} position="top" offset={10} formatter={(v) => fmtTick(Number(v), unit === '%' ? '%' : '')} style={{ fontSize: 10, fill: tick, fontWeight: 500 }} />
            </Line>
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  }
}
