import { useState } from 'react'
import { BarChart2, Table, Maximize2 } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from 'recharts'
import type { Metric } from '../types/stock'
import { useIsDark } from '../hooks/useIsDark'
import { fmtValue, fmtTick } from '../utils/format'
import { METRIC_COLOR_LIST, resolveColor } from '../utils/colors'
import FullscreenModal from './FullscreenModal'

interface Props {
  metrics: Metric[]
}

export default function StackedBarChart({ metrics }: Props) {
  const isDark = useIsDark()

  const hasAnnual = metrics.some((m) => m.data.some((d) => d.year !== undefined && !d.period))
  const hasPeriodic = metrics.some((m) => m.data.some((d) => d.period !== undefined))
  const showFreqToggle = hasAnnual && hasPeriodic

  const [freq, setFreq] = useState<'annual' | 'periodic'>('annual')
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [fullscreen, setFullscreen] = useState(false)

  const effectiveFreq =
    freq === 'periodic' && !hasPeriodic
      ? 'annual'
      : freq === 'annual' && !hasAnnual
        ? 'periodic'
        : freq

  const allLabels = [
    ...new Set(
      metrics.flatMap((m) =>
        effectiveFreq === 'annual'
          ? m.data.filter((d) => d.year !== undefined && !d.period).map((d) => String(d.year))
          : m.data.filter((d) => d.period !== undefined).map((d) => d.period!),
      ),
    ),
  ].sort((a, b) => {
    if (effectiveFreq === 'annual') return Number(a) - Number(b)
    const [qa, ya] = a.split(' ')
    const [qb, yb] = b.split(' ')
    return Number(ya) - Number(yb) || qa.localeCompare(qb)
  })

  const data = allLabels.map((label) => {
    const row: Record<string, string | number> = { label }
    let total = 0
    for (const m of metrics) {
      const point =
        effectiveFreq === 'annual'
          ? m.data.find((d) => String(d.year) === label && !d.period)
          : m.data.find((d) => d.period === label)
      const val = point?.value ?? 0
      row[m.id] = val
      total += val
    }
    row.__total = total
    return row
  })

  const unit = metrics[0]?.unit ?? ''
  const tick = isDark ? '#64748b' : '#94a3b8'
  const grid = isDark ? '#1e293b' : '#f1f5f9'
  const colors = metrics.map((m, i) =>
    resolveColor(m.color, METRIC_COLOR_LIST[i % METRIC_COLOR_LIST.length]),
  )

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-3 shadow-md shadow-slate-200/60 dark:shadow-none">
      <div className="flex items-center justify-between mb-4 gap-2">
        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          {metrics.map((m, i) => (
            <div key={m.id} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: colors[i] }} />
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{m.label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
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
          <button
            onClick={() => setFullscreen(true)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left text-slate-400 font-medium pb-2">Period</th>
                {metrics.map((m) => (
                  <th key={m.id} className="text-right text-slate-400 font-medium pb-2">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.label as string}
                  className="border-b border-slate-50 dark:border-slate-800 last:border-0"
                >
                  <td className="py-1.5 text-slate-600 dark:text-slate-400">
                    {row.label as string}
                  </td>
                  {metrics.map((m) => (
                    <td
                      key={m.id}
                      className="py-1.5 text-right font-medium text-slate-900 dark:text-white tabular-nums"
                    >
                      {fmtValue(row[m.id] as number, m.unit)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        renderChart(220)
      )}

      {fullscreen && (
        <FullscreenModal
          title={metrics.map((m) => m.label).join(' + ')}
          onClose={() => setFullscreen(false)}
        >
          {renderChart(480)}
        </FullscreenModal>
      )}
    </div>
  )

  function renderChart(h: number) {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={data} margin={{ top: 20, right: 28, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: tick }}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: tick }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => fmtTick(v, unit === '%' ? '%' : '')}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: isDark ? '#1e293b' : 'white',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              borderRadius: 8,
              fontSize: 12,
              color: isDark ? '#f8fafc' : '#0f172a',
            }}
            formatter={(v, name) => {
              const m = metrics.find((x) => x.id === name)
              return [fmtValue(Number(v), m?.unit ?? ''), m?.label ?? String(name)]
            }}
          />
          {metrics.map((m, i) => (
            <Bar
              key={m.id}
              dataKey={m.id}
              stackId="stack"
              fill={colors[i]}
              radius={i === metrics.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              animationDuration={450} animationEasing="ease-out"
            >
              {i === metrics.length - 1 && (
                <LabelList
                  dataKey="__total"
                  position="top"
                  offset={8}
                  formatter={(v) => fmtTick(Number(v), unit === '%' ? '%' : '')}
                  style={{ fontSize: 10, fill: tick, fontWeight: 500 }}
                />
              )}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  }
}
