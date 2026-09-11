import { useMemo } from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  formatCompact,
  formatDay,
  formatMonth,
  formatNumber,
  formatRupiah,
  type EventType,
  type MonthSnapshot,
  type PortfolioEvent,
} from '../data/portfolio'

// Two panels sharing one time axis.
//
// The top panel is the portfolio itself: two lines, eight month-end points,
// nothing else on it. The bottom is a rug — one lane per kind of activity, one
// tick per day it happened. Trades used to be pinned onto the market-value
// line, which put eighty-odd markers on an interpolated position the portfolio
// never actually held; they buried the line and the height under them meant
// nothing.
//
// The rug deliberately does not encode amount. Tried as bars, one rebalancing
// day (185 jt) flattened the median day (21 jt) into a 4px stub, and by month
// the spread is worse still — 9 jt against 286 jt. Height would have been a
// scale, not a reading. Dates are what the rug is for; the amounts are exact
// in the tooltip and in the Activity table below.

const PANEL_MARGIN = { top: 8, right: 12, bottom: 4, left: 4 }
const AXIS_WIDTH = 64
const LANE_HEIGHT = 30

const EVENT_LABEL: Record<EventType, string> = {
  dividend: 'Dividend',
  buy: 'Buy',
  sell: 'Sell',
}

function timestamp(date: string): number {
  return new Date(`${date}T00:00:00`).getTime()
}

interface MonthRow {
  t: number
  marketValue: number
  costBasis: number
}

// Lanes run top to bottom in this order, matching the filter buttons above the
// chart. A lane with nothing in it is dropped rather than left empty, so the
// panel shrinks as the filters narrow.
const LANES: { type: EventType; label: string }[] = [
  { type: 'dividend', label: 'Dividends' },
  { type: 'sell', label: 'Sells' },
  { type: 'buy', label: 'Buys' },
]

// One row per day something happened. Each lane key holds that lane's y, or
// null where the day has no event of that kind.
type ActivityRow = {
  t: number
  events: PortfolioEvent[]
} & Partial<Record<EventType, number | null>>

function buildActivity(
  events: PortfolioEvent[],
  laneY: Partial<Record<EventType, number>>,
): ActivityRow[] {
  const byDate = new Map<number, ActivityRow>()

  for (const event of events) {
    const t = timestamp(event.date)
    let row = byDate.get(t)
    if (!row) {
      row = { t, events: [] }
      byDate.set(t, row)
    }
    row.events.push(event)
    row[event.type] = laneY[event.type]
  }

  return [...byDate.values()].sort((a, b) => a.t - b.t)
}

// A 3×13 tick, not a dot: at this density round marks blur into each other,
// where verticals still read as separate days.
function LaneTick({ cx, cy, dividend }: { cx?: number; cy?: number; dividend?: boolean }) {
  if (cx == null || cy == null) return null
  return (
    <g>
      {/* Transparent hit area — the painted tick is far too thin to aim at. */}
      <rect x={cx - 9} y={cy - 12} width={18} height={24} fill="transparent" />
      <rect
        x={cx - 1.5}
        y={cy - 6.5}
        width={3}
        height={13}
        rx={1.5}
        fill={dividend ? 'var(--viz-series-3)' : 'var(--viz-ink-muted)'}
        stroke="var(--viz-surface)"
        strokeWidth={1.5}
        paintOrder="stroke"
      />
    </g>
  )
}

function TooltipShell({ date, children }: { date: number; children: React.ReactNode }) {
  return (
    <div className="max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1.5 font-medium text-slate-900 dark:text-white">
        {formatDay(new Date(date).toISOString().slice(0, 10))}
      </p>
      {children}
    </div>
  )
}

function ValueTooltip({ active, payload }: { active?: boolean; payload?: { payload: MonthRow }[] }) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null

  return (
    <TooltipShell date={row.t}>
      <dl className="space-y-1">
        <Reading color="var(--viz-series-1)" label="Market value" value={formatRupiah(row.marketValue)} />
        <Reading color="var(--viz-series-2)" label="Cost basis" value={formatRupiah(row.costBasis)} />
        <Reading label="Unrealised" value={formatRupiah(row.marketValue - row.costBasis)} muted />
      </dl>
    </TooltipShell>
  )
}

function eventDetail(event: PortfolioEvent): string {
  if (event.quantity != null && event.price != null) {
    return `${formatNumber(event.quantity)} @ ${formatNumber(event.price)}`
  }
  return event.note ?? ''
}

function ActivityTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: ActivityRow }[]
}) {
  const row = payload?.[0]?.payload
  if (!active || !row?.events.length) return null

  return (
    <TooltipShell date={row.t}>
      <ul className="space-y-1">
        {row.events.map((event, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3">
            <span className="text-slate-500 dark:text-slate-400">
              <span
                className={
                  event.type === 'dividend' ? 'font-medium text-slate-700 dark:text-slate-200' : ''
                }
              >
                {EVENT_LABEL[event.type]}
              </span>
              {event.ticker ? ` ${event.ticker}` : ''}
              {eventDetail(event) ? (
                <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                  {eventDetail(event)}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 font-medium tabular-nums text-slate-900 dark:text-white">
              {formatRupiah(event.amount)}
            </span>
          </li>
        ))}
      </ul>
    </TooltipShell>
  )
}

function Reading({
  color,
  label,
  value,
  muted,
}: {
  color?: string
  label: string
  value: string
  muted?: boolean
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
        className={`tabular-nums ${muted ? 'text-slate-500 dark:text-slate-400' : 'font-medium text-slate-900 dark:text-white'}`}
      >
        {value}
      </dd>
    </div>
  )
}

export default function PortfolioChart({
  months,
  events,
}: {
  months: MonthSnapshot[]
  events: PortfolioEvent[]
}) {
  const monthRows = useMemo<MonthRow[]>(
    () =>
      months.map((month) => ({
        t: timestamp(month.date),
        marketValue: month.marketValue,
        costBasis: month.costBasis,
      })),
    [months],
  )

  const ticks = useMemo(() => monthRows.map((row) => row.t), [monthRows])

  // Both panels are drawn against the same window so a bar sits under the day
  // it happened, not merely near it.
  const xDomain = useMemo<[number, number]>(() => {
    const all = [...monthRows.map((r) => r.t), ...events.map((e) => timestamp(e.date))]
    if (all.length === 0) return [0, 1]
    return [Math.min(...all), Math.max(...all)]
  }, [monthRows, events])

  // Lines are read for their shape, so the axis frames the data rather than
  // starting at zero — which would flatten every month into the same band.
  const yDomain = useMemo<[number, number]>(() => {
    const values = monthRows.flatMap((row) => [row.marketValue, row.costBasis])
    if (values.length === 0) return [0, 1]
    const min = Math.min(...values)
    const max = Math.max(...values)
    const pad = Math.max((max - min) * 0.15, max * 0.03)
    return [Math.max(0, min - pad), max + pad]
  }, [monthRows])

  const lanes = useMemo(
    () => LANES.filter((lane) => events.some((event) => event.type === lane.type)),
    [events],
  )

  // Lane i from the top sits at the centre of its band, counting up from the
  // bottom so lane 0 is the topmost.
  const laneY = useMemo(() => {
    const map: Partial<Record<EventType, number>> = {}
    lanes.forEach((lane, i) => {
      map[lane.type] = lanes.length - i - 0.5
    })
    return map
  }, [lanes])

  const activityRows = useMemo(() => buildActivity(events, laneY), [events, laneY])

  if (monthRows.length === 0) return null

  return (
    <figure className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <figcaption className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <LegendKey color="var(--viz-series-1)">Market value</LegendKey>
        <LegendKey color="var(--viz-series-2)">Cost basis</LegendKey>
      </figcaption>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={monthRows} margin={PANEL_MARGIN}>
            <CartesianGrid stroke="var(--viz-grid)" strokeWidth={1} vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={xDomain}
              ticks={ticks}
              tick={false}
              tickLine={false}
              axisLine={false}
              height={1}
            />
            <YAxis
              domain={yDomain}
              width={AXIS_WIDTH}
              tickFormatter={(value: number) => formatCompact(value)}
              tick={{ fill: 'var(--viz-ink-muted)', fontSize: 11 }}
              stroke="var(--viz-axis)"
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <Tooltip
              content={<ValueTooltip />}
              cursor={{ stroke: 'var(--viz-axis)', strokeWidth: 1 }}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="costBasis"
              name="Cost basis"
              stroke="var(--viz-series-2)"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: 'var(--viz-series-2)' }}
              activeDot={{ r: 5, stroke: 'var(--viz-surface)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="marketValue"
              name="Market value"
              stroke="var(--viz-series-1)"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: 'var(--viz-series-1)' }}
              activeDot={{ r: 5, stroke: 'var(--viz-surface)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {lanes.length > 0 && (
        <div
          className="mt-3 w-full border-t border-slate-100 pt-2 dark:border-slate-800"
          style={{ height: lanes.length * LANE_HEIGHT + 34 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={activityRows} margin={PANEL_MARGIN}>
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={xDomain}
                ticks={ticks}
                tickFormatter={(value: number) => formatMonth(value)}
                tick={{ fill: 'var(--viz-ink-muted)', fontSize: 11 }}
                stroke="var(--viz-axis)"
                tickLine={false}
                axisLine={false}
                minTickGap={8}
              />
              {/* The lane names are the legend: identity comes from the row a
                  tick sits in, never from its colour alone. */}
              <YAxis
                type="number"
                domain={[0, lanes.length]}
                ticks={lanes.map((lane) => laneY[lane.type] as number)}
                width={AXIS_WIDTH}
                tickFormatter={(value: number) =>
                  lanes.find((lane) => laneY[lane.type] === value)?.label ?? ''
                }
                tick={{ fill: 'var(--viz-ink-muted)', fontSize: 11 }}
                stroke="var(--viz-axis)"
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <Tooltip
                content={<ActivityTooltip />}
                cursor={{ stroke: 'var(--viz-axis)', strokeWidth: 1 }}
                isAnimationActive={false}
              />
              {lanes.map((lane) => (
                <Scatter
                  key={lane.type}
                  dataKey={lane.type}
                  shape={<LaneTick dividend={lane.type === 'dividend'} />}
                  isAnimationActive={false}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  )
}

function LegendKey({ color, children }: { color: string; children: string }) {
  return (
    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
      <span aria-hidden className="h-0.5 w-4 rounded-full" style={{ background: color }} />
      {children}
    </span>
  )
}

