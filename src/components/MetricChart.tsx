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

interface Props {
  metric: Metric
  color?: string
}

function CustomTooltip({ active, payload, unit }: { active?: boolean; payload?: { value: number; payload: { year?: number; period?: string } }[]; unit: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-slate-500">{d.period ?? d.year}</p>
      <p className="font-semibold text-slate-900">{payload[0].value}{unit}</p>
    </div>
  )
}

const xKey = (d: Metric['data'][number]) => d.period ?? String(d.year)

export default function MetricChart({ metric, color = '#3b82f6' }: Props) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const data = metric.data.map((d) => ({ ...d, label: xKey(d) }))

  const shared = {
    data,
    margin: { top: 4, right: 4, bottom: 0, left: 0 },
  }

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
      <XAxis
        dataKey="label"
        tick={{ fontSize: 11, fill: '#94a3b8' }}
        tickLine={false}
        axisLine={false}
      />
      <YAxis
        tick={{ fontSize: 11, fill: '#94a3b8' }}
        tickLine={false}
        axisLine={false}
        tickFormatter={(v) => `${v}${metric.unit}`}
        width={48}
        domain={['auto', 'auto']}
      />
      <Tooltip content={<CustomTooltip unit={metric.unit} />} />
    </>
  )

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-md shadow-slate-200/60">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">{metric.label}</p>
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
                <th className="text-right text-slate-400 font-medium pb-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.label} className="border-b border-slate-50 last:border-0">
                  <td className="py-1.5 text-slate-600">{d.label}</td>
                  <td className="py-1.5 text-right font-medium text-slate-900">{d.value}{metric.unit}</td>
                </tr>
              ))}
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
              <linearGradient id={`grad-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            {axes}
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${metric.id})`} dot={false} activeDot={{ r: 4, fill: color, strokeWidth: 0 }} />
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
