import { useState } from 'react'
import { BarChart2, Table, Maximize2 } from 'lucide-react'
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
  LabelList,
} from 'recharts'
import type { Metric } from '../types/stock'
import { useIsDark } from '../hooks/useIsDark'
import { fmtValue, fmtTick } from '../utils/format'
import { METRIC_COLOR_LIST, resolveColor } from '../utils/colors'
import FullscreenModal from './FullscreenModal'

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
    <div
      className={`rounded-lg px-3 py-2 shadow-lg text-xs space-y-1 border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}
    >
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
  title?: string
}

export default function ComboChart({ leftMetrics, rightMetrics, title }: Props) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [freq, setFreq] = useState<'annual' | 'periodic'>('annual')
  const [fullscreen, setFullscreen] = useState(false)
  const isDark = useIsDark()

  const tick = isDark ? '#64748b' : '#94a3b8'
  const grid = isDark ? '#1e293b' : '#f1f5f9'

  const allMetrics = [...leftMetrics, ...rightMetrics]
  const hasAnnual = allMetrics.some((m) => m.data.some((d) => d.year !== undefined && !d.period))
  const hasPeriodic = allMetrics.some((m) => m.data.some((d) => d.period !== undefined))
  const showFreqToggle = hasAnnual && hasPeriodic

  const effectiveFreq =
    freq === 'periodic' && !hasPeriodic
      ? 'annual'
      : freq === 'annual' && !hasAnnual
        ? 'periodic'
        : freq

  const labels = [
    ...new Set(
      allMetrics.flatMap((m) =>
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

  const data = labels.map((label) => {
    const point: Record<string, number | string> = { label }
    allMetrics.forEach((m) => {
      const d =
        effectiveFreq === 'annual'
          ? m.data.find((p) => String(p.year) === label && !p.period)
          : m.data.find((p) => p.period === label)
      if (d !== undefined) point[m.id] = d.value
    })
    return point
  })

  const leftUnit = leftMetrics[0]?.unit ?? ''
  const rightUnit = rightMetrics[0]?.unit ?? ''
  const leftIds = leftMetrics.map((m) => m.id)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-3 shadow-md shadow-slate-200/60 dark:shadow-none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          {title
            ? <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{title}</span>
            : <>
                {leftMetrics.length > 0 && <span>Left: {leftUnit}</span>}
                {rightMetrics.length > 0 && <span>Right: {rightUnit}</span>}
              </>
          }
        </div>
        <div className="flex items-center gap-1.5">
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
                {allMetrics.map((m) => (
                  <th key={m.id} className="text-right text-slate-400 font-medium pb-2">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label) => (
                <tr
                  key={label}
                  className="border-b border-slate-50 dark:border-slate-800 last:border-0"
                >
                  <td className="py-1.5 text-slate-600 dark:text-slate-400">{label}</td>
                  {allMetrics.map((m) => {
                    const val = data.find((d) => d.label === label)?.[m.id]
                    return (
                      <td
                        key={m.id}
                        className="py-1.5 text-right font-medium text-slate-900 dark:text-white"
                      >
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
        renderChart(260)
      )}

      {fullscreen && (
        <FullscreenModal
          title={[...leftMetrics, ...rightMetrics].map((m) => m.label).join(' + ')}
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
        <ComposedChart data={data} margin={{ top: 24, right: 48, bottom: 48, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: tick, fontStyle: 'italic' }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: tick }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => fmtTick(v, leftUnit === '%' ? '%' : '')}
            width={40}
            domain={['auto', 'auto']}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: tick }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => fmtTick(v, rightUnit === '%' ? '%' : '')}
            width={40}
            domain={['auto', 'auto']}
          />
          <Tooltip
            content={
              <CustomTooltip
                leftUnit={leftUnit}
                rightUnit={rightUnit}
                leftIds={leftIds}
                isDark={isDark}
              />
            }
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 12, color: isDark ? '#94a3b8' : '#64748b' }}
          />
          {leftMetrics.map((m, i) => {
            const color = resolveColor(m.color, METRIC_COLOR_LIST[i % METRIC_COLOR_LIST.length])
            if (m.type === 'line' || m.type === 'area') {
              return (
                <Line
                  key={m.id}
                  yAxisId="left"
                  type="monotone"
                  dataKey={m.id}
                  name={m.label}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: color, strokeWidth: 0 }}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  animationDuration={450} animationEasing="ease-out"
                >
                  <LabelList
                    dataKey={m.id}
                    position="top"
                    offset={8}
                    formatter={(v) => fmtTick(Number(v), leftUnit === '%' ? '%' : '')}
                    style={{ fontSize: 10, fill: color, fontWeight: 500 }}
                  />
                </Line>
              )
            }
            return (
              <Bar
                key={m.id}
                yAxisId="left"
                dataKey={m.id}
                name={m.label}
                fill={color}
                radius={[3, 3, 0, 0]}
                animationDuration={450} animationEasing="ease-out"
              >
                <LabelList
                  dataKey={m.id}
                  position="top"
                  offset={6}
                  formatter={(v) => fmtTick(Number(v), leftUnit === '%' ? '%' : '')}
                  style={{ fontSize: 10, fill: tick, fontWeight: 500 }}
                />
              </Bar>
            )
          })}
          {rightMetrics.map((m, i) => {
            const color = resolveColor(
              m.color,
              METRIC_COLOR_LIST[(leftMetrics.length + i) % METRIC_COLOR_LIST.length],
            )
            return (
              <Line
                key={m.id}
                yAxisId="right"
                type="monotone"
                dataKey={m.id}
                name={m.label}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                activeDot={{ r: 4, strokeWidth: 0 }}
                animationDuration={450} animationEasing="ease-out"
              >
                <LabelList
                  dataKey={m.id}
                  position="top"
                  offset={8}
                  formatter={(v) => fmtTick(Number(v), rightUnit === '%' ? '%' : '')}
                  style={{ fontSize: 10, fill: color, fontWeight: 500 }}
                />
              </Line>
            )
          })}
        </ComposedChart>
      </ResponsiveContainer>
    )
  }
}
