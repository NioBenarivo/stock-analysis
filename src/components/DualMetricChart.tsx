import { useState } from 'react'
import { BarChart2, Table } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import type { Metric } from '../types/stock'
import { useIsDark } from '../hooks/useIsDark'
import { fmtValue, fmtTick } from '../utils/format'

const COLORS = ['#3b82f6', '#10b981']

interface Props {
  percentMetric: Metric
  nominalMetric: Metric
}

function getAnnual(m: Metric) {
  return m.data.filter((d) => d.year !== undefined && !d.period)
}
function getPeriodic(m: Metric) {
  return m.data.filter((d) => d.period !== undefined)
}

export default function DualMetricChart({ percentMetric, nominalMetric }: Props) {
  const isDark = useIsDark()

  // Determine which frequency options are available across EITHER metric
  const hasAnnual = getAnnual(percentMetric).length > 0 || getAnnual(nominalMetric).length > 0
  const hasPeriodic = getPeriodic(percentMetric).length > 0 || getPeriodic(nominalMetric).length > 0
  const showFreqToggle = hasAnnual && hasPeriodic

  const [unit, setUnit] = useState<'percent' | 'nominal'>('percent')
  const [freq, setFreq] = useState<'annual' | 'periodic'>('annual')
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const metric = unit === 'percent' ? percentMetric : nominalMetric
  const color = unit === 'percent' ? COLORS[0] : COLORS[1]

  // If the selected metric has no data for the chosen freq, fall back silently
  // (preserves freq state so switching back to the other unit restores it)
  const effectiveFreq =
    freq === 'periodic' && getPeriodic(metric).length === 0 ? 'annual'
    : freq === 'annual' && getAnnual(metric).length === 0 ? 'periodic'
    : freq

  const activeData = effectiveFreq === 'annual' ? getAnnual(metric) : getPeriodic(metric)
  const data = activeData.map((d) => ({
    ...d,
    label: d.period ?? String(d.year),
  }))

  const tick = isDark ? '#64748b' : '#94a3b8'
  const grid = isDark ? '#1e293b' : '#f1f5f9'
  const shared = { data, margin: { top: 4, right: 4, bottom: 0, left: 0 } }

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
      <XAxis dataKey="label" tick={{ fontSize: 11, fill: tick }} tickLine={false} axisLine={false} />
      <YAxis
        tick={{ fontSize: 11, fill: tick }}
        tickLine={false}
        axisLine={false}
        tickFormatter={(v) => fmtTick(v, metric.unit)}
        width={56}
        domain={['auto', 'auto']}
      />
      <Tooltip
        contentStyle={{
          background: isDark ? '#1e293b' : 'white',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          borderRadius: 8,
          fontSize: 12,
          color: isDark ? '#f8fafc' : '#0f172a',
        }}
        formatter={(v: number) => [fmtValue(v, metric.unit), metric.label]}
      />
    </>
  )

  // For the table: show both metrics side by side
  const tableRows =
    effectiveFreq === 'annual'
      ? [...new Set([...getAnnual(percentMetric), ...getAnnual(nominalMetric)].map((d) => String(d.year)))].sort((a, b) => Number(b) - Number(a))
      : [...new Set([...getPeriodic(percentMetric), ...getPeriodic(nominalMetric)].map((d) => d.period!))].sort((a, b) => {
          const [qa, ya] = a.split(' ')
          const [qb, yb] = b.split(' ')
          return Number(yb) - Number(ya) || qa.localeCompare(qb) * -1
        })

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-md shadow-slate-200/60 dark:shadow-none">
      <div className="flex items-center justify-between mb-4 gap-2">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-0 truncate">
          {metric.label}
        </p>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Annual / Quarterly — only when both exist */}
          {showFreqToggle && (
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setFreq('annual')}
                className={`px-2 py-1 rounded-md transition-colors ${freq === 'annual' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-white font-medium' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                Annual
              </button>
              <button
                onClick={() => setFreq('periodic')}
                className={`px-2 py-1 rounded-md transition-colors ${freq === 'periodic' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-white font-medium' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                Quarterly
              </button>
            </div>
          )}

          {/* % / Rp(B) unit toggle */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setUnit('percent')}
              className={`px-2 py-1 rounded-md transition-colors font-medium ${unit === 'percent' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              {percentMetric.unit}
            </button>
            <button
              onClick={() => setUnit('nominal')}
              className={`px-2 py-1 rounded-md transition-colors font-medium ${unit === 'nominal' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              {nominalMetric.unit}
            </button>
          </div>

          {/* Chart / Table toggle */}
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
      </div>

      {view === 'table' ? (
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left text-slate-400 font-medium pb-2">Period</th>
                <th className="text-right text-slate-400 font-medium pb-2">{percentMetric.label}</th>
                <th className="text-right text-slate-400 font-medium pb-2">{nominalMetric.label}</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => {
                const pPoint = effectiveFreq === 'annual'
                  ? getAnnual(percentMetric).find((d) => String(d.year) === row)
                  : getPeriodic(percentMetric).find((d) => d.period === row)
                const nPoint = effectiveFreq === 'annual'
                  ? getAnnual(nominalMetric).find((d) => String(d.year) === row)
                  : getPeriodic(nominalMetric).find((d) => d.period === row)
                return (
                  <tr key={row} className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <td className="py-1.5 text-slate-600 dark:text-slate-400">{row}</td>
                    <td className={`py-1.5 text-right font-medium tabular-nums ${unit === 'percent' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                      {pPoint ? fmtValue(pPoint.value, percentMetric.unit) : '—'}
                    </td>
                    <td className={`py-1.5 text-right font-medium tabular-nums ${unit === 'nominal' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {nPoint ? fmtValue(nPoint.value, nominalMetric.unit) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          {metric.type === 'bar' ? (
            <BarChart {...shared}>
              {axes}
              <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : metric.type === 'area' ? (
            <AreaChart {...shared}>
              <defs>
                <linearGradient id={`dual-grad-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              {axes}
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#dual-grad-${metric.id})`} dot={false} activeDot={{ r: 4, fill: color, strokeWidth: 0 }} />
            </AreaChart>
          ) : (
            <LineChart {...shared}>
              {axes}
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: color, strokeWidth: 0 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  )
}
