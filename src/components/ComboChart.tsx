import { useState } from 'react'
import { BarChart2, Table } from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import type { Metric } from '../types/stock'
import { useIsDark } from '../hooks/useIsDark'
import { fmtValue, fmtTick } from '../utils/format'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function CustomTooltip({
  active,
  payload,
  leftUnit,
  rightUnit,
  leftIds,
  isDark,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string; dataKey: string }[]
  leftUnit: string
  rightUnit: string
  leftIds: string[]
  isDark: boolean
}) {
  if (!active || !payload?.length) return null
  return (
    <div className={`rounded-lg px-3 py-2 shadow-lg text-xs space-y-1 border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{p.name}</span>
          <span className="font-semibold ml-auto pl-4">
            {fmtValue(p.value, leftIds.includes(p.dataKey) ? leftUnit : rightUnit)}
          </span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  leftMetrics: Metric[]
  rightMetrics: Metric[]
}

export default function ComboChart({ leftMetrics, rightMetrics }: Props) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const isDark = useIsDark()

  const tick = isDark ? '#64748b' : '#94a3b8'
  const grid = isDark ? '#1e293b' : '#f1f5f9'

  const allMetrics = [...leftMetrics, ...rightMetrics]
  const years = [...new Set(allMetrics.flatMap((m) => m.data.map((d) => d.year ?? 0)))].sort(
    (a, b) => a - b,
  )
  const data = years.map((year) => {
    const point: Record<string, number | string> = { year }
    allMetrics.forEach((m) => {
      const d = m.data.find((p) => p.year === year)
      if (d !== undefined) point[m.id] = d.value
    })
    return point
  })

  const leftUnit = leftMetrics[0]?.unit ?? ''
  const rightUnit = rightMetrics[0]?.unit ?? ''
  const leftIds = leftMetrics.map((m) => m.id)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-md shadow-slate-200/60 dark:shadow-none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
          {leftMetrics.length > 0 && <span>Left: {leftUnit}</span>}
          {rightMetrics.length > 0 && <span>Right: {rightUnit}</span>}
        </div>
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setView('chart')}
            className={`p-1.5 rounded-md transition-colors ${view === 'chart' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setView('table')}
            className={`p-1.5 rounded-md transition-colors ${view === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Table className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left text-slate-400 font-medium pb-2">Year</th>
                {allMetrics.map((m) => (
                  <th key={m.id} className="text-right text-slate-400 font-medium pb-2">{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {years.map((year) => (
                <tr key={year} className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <td className="py-1.5 text-slate-600 dark:text-slate-400">{year}</td>
                  {allMetrics.map((m) => {
                    const val = data.find((d) => d.year === year)?.[m.id]
                    return (
                      <td key={m.id} className="py-1.5 text-right font-medium text-slate-900 dark:text-white">
                        {val !== undefined ? fmtValue(val as number, m.unit) : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: tick }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: tick }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => fmtTick(v, leftUnit)}
              width={60}
              domain={['auto', 'auto']}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: tick }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => fmtTick(v, rightUnit)}
              width={60}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip leftUnit={leftUnit} rightUnit={rightUnit} leftIds={leftIds} isDark={isDark} />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12, color: isDark ? '#94a3b8' : '#64748b' }} />
            {leftMetrics.map((m, i) => (
              <Bar key={m.id} yAxisId="left" dataKey={m.id} name={m.label} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
            ))}
            {rightMetrics.map((m, i) => (
              <Line key={m.id} yAxisId="right" type="monotone" dataKey={m.id} name={m.label} stroke={COLORS[(leftMetrics.length + i) % COLORS.length]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
