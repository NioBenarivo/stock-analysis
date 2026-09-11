import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCompact, formatRupiah } from '../lib/format'

export type Unit = 'month' | 'year'

export interface GrowthPoint {
  /** Month index from the start — the engine's own clock. */
  month: number
  /** What the axis shows: the month number, or the year number. */
  step: number
  value: number
  /** Starting equity plus every deposit made so far. */
  contributed: number
  /** value − contributed. Negative at a negative return. */
  gain: number
  /** What this step added beyond its own deposits. */
  stepGain: number
}

interface TooltipProps {
  active?: boolean
  payload?: { payload: GrowthPoint }[]
  unit?: Unit
}

function GrowthTooltip({ active, payload, unit }: TooltipProps) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null

  const noun = unit === 'month' ? 'month' : 'year'

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1.5 font-medium text-slate-900 dark:text-white">
        {row.step === 0 ? 'Start' : `After ${row.step} ${noun}${row.step === 1 ? '' : 's'}`}
      </p>
      <dl className="space-y-1">
        <Reading color="var(--viz-series-1)" label="Value" value={formatRupiah(row.value)} strong />
        <Reading
          color="var(--viz-series-2)"
          label="Put in"
          value={formatRupiah(row.contributed)}
        />
        <Reading label="Gain" value={formatRupiah(row.gain)} />
        {row.step > 0 && (
          <Reading label={`Gain that ${noun}`} value={formatRupiah(row.stepGain)} />
        )}
      </dl>
    </div>
  )
}

function Reading({
  color,
  label,
  value,
  strong,
}: {
  color?: string
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
        {color ? (
          <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: color }} />
        ) : (
          <span aria-hidden className="w-3" />
        )}
        {label}
      </dt>
      <dd
        className={`tabular-nums ${strong ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
      >
        {value}
      </dd>
    </div>
  )
}

export default function GrowthChart({ rows, unit }: { rows: GrowthPoint[]; unit: Unit }) {
  if (rows.length === 0) return null

  return (
    <figure className="mt-6">
      {/* A legend rather than labels on the marks: the two series cross
          wherever the return turns negative, so nothing inline stays put. */}
      <figcaption className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: 'var(--viz-series-1)' }}
          />
          Value
        </span>
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span
            aria-hidden
            className="h-0.5 w-4 rounded-full"
            style={{ background: 'var(--viz-series-2)' }}
          />
          Put in
        </span>
        <span className="text-slate-400 dark:text-slate-500">
          The gap between them is what the market did
        </span>
      </figcaption>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
            <CartesianGrid stroke="var(--viz-grid)" strokeWidth={1} vertical={false} />
            <XAxis
              dataKey="step"
              tick={{ fill: 'var(--viz-ink-muted)', fontSize: 11 }}
              stroke="var(--viz-axis)"
              tickLine={false}
              minTickGap={4}
              height={38}
              label={{
                value: unit === 'month' ? 'Month' : 'Year',
                position: 'insideBottom',
                fill: 'var(--viz-ink-muted)',
                fontSize: 11,
              }}
            />
            {/* Bar length is the reading, so this axis starts at zero — the one
                place the portfolio's framed axis would be a lie. */}
            <YAxis
              domain={[0, 'auto']}
              width={64}
              tickFormatter={(value: number) => formatCompact(value)}
              tick={{ fill: 'var(--viz-ink-muted)', fontSize: 11 }}
              stroke="var(--viz-axis)"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<GrowthTooltip unit={unit} />}
              cursor={{ fill: 'var(--viz-grid)', fillOpacity: 0.4 }}
              isAnimationActive={false}
            />
            <Bar
              dataKey="value"
              fill="var(--viz-series-1)"
              radius={[2, 2, 0, 0]}
              maxBarSize={28}
              isAnimationActive={false}
            />
            {/* After the bars, so the line stays readable on top of them. */}
            <Line
              type="linear"
              dataKey="contributed"
              stroke="var(--viz-series-2)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: 'var(--viz-surface)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
