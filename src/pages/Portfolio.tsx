import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react'
import Layout from '../components/Layout'
import PortfolioChart from '../components/PortfolioChart'
import {
  events as allEvents,
  formatDay,
  formatMonth,
  formatNumber,
  formatRupiah,
  hasPortfolioData,
  latestMonth,
  months,
  totalOf,
  unrealised,
  type EventType,
} from '../data/portfolio'

const EVENT_FILTERS: { type: EventType; label: string }[] = [
  { type: 'dividend', label: 'Dividends' },
  { type: 'sell', label: 'Sells' },
  { type: 'buy', label: 'Buys' },
]

const UP = 'text-[#006300] dark:text-[#0ca30c]'
const DOWN = 'text-[#d03b3b]'

export default function Portfolio() {
  const [hidden, setHidden] = useState<EventType[]>([])

  const shown = useMemo(
    () => allEvents.filter((event) => !hidden.includes(event.type)),
    [hidden],
  )

  function toggle(type: EventType) {
    setHidden((current) =>
      current.includes(type) ? current.filter((t) => t !== type) : [...current, type],
    )
  }

  if (!hasPortfolioData || !latestMonth) {
    return (
      <Layout>
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-10">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Portfolio</h1>
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
            <Wallet className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              No portfolio data on this deployment.
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-400 dark:text-slate-500">
              The figures live in{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">
                src/data/portfolio.local.ts
              </code>
              , which is deliberately kept out of git so real balances never reach a public
              site. Run the app locally to see the chart.
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  const gain = unrealised(latestMonth)
  const dividends = totalOf('dividend')

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Portfolio</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {months.length} monthly statement{months.length === 1 ? '' : 's'} · latest{' '}
            {formatDay(latestMonth.date)}
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Market value" value={formatRupiah(latestMonth.marketValue)} />
          <Stat
            label="Unrealised"
            value={formatRupiah(gain.value)}
            tone={gain.value >= 0 ? 'up' : 'down'}
            detail={`${gain.value >= 0 ? '+' : ''}${gain.percent.toFixed(2)}% on cost`}
          />
          <Stat
            label="Dividends received"
            value={formatRupiah(dividends)}
            detail={`${allEvents.filter((e) => e.type === 'dividend').length} payments`}
          />
          <Stat label="Equity NAB" value={formatRupiah(latestMonth.equityNav)} />
        </div>

        {/* One filter row, above everything it scopes — the chart and the
            activity table below both render against this slice. */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-slate-500 dark:text-slate-400">Show</span>
          {EVENT_FILTERS.map(({ type, label }) => {
            const on = !hidden.includes(type)
            return (
              <button
                key={type}
                onClick={() => toggle(type)}
                aria-pressed={on}
                className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                  on
                    ? 'border-slate-300 bg-slate-100 font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                    : 'border-slate-200 text-slate-400 hover:text-slate-600 dark:border-slate-800 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <PortfolioChart months={months} events={shown} />

        {months.length < 2 && (
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            One statement so far, so there is no growth line yet — every marker sits at the
            31 January value. Add more months to{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">
              portfolio.local.ts
            </code>{' '}
            and the line draws itself.
          </p>
        )}

        <Section title="Holdings" caption={formatDay(latestMonth.date)}>
          <table className="w-full text-sm">
            <thead>
              <Tr head>
                <Th>Stock</Th>
                <Th right>Qty</Th>
                <Th right>Avg</Th>
                <Th right>Close</Th>
                <Th right>Cost</Th>
                <Th right>Market</Th>
                <Th right>Unrealised</Th>
              </Tr>
            </thead>
            <tbody>
              {(latestMonth.holdings ?? []).map((holding) => {
                const delta = holding.marketValue - holding.costValue
                const percent = holding.costValue === 0 ? 0 : (delta / holding.costValue) * 100
                return (
                  <Tr key={holding.ticker}>
                    <Td>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {holding.ticker}
                      </span>
                      <span className="block text-xs text-slate-400 dark:text-slate-500">
                        {holding.name}
                      </span>
                    </Td>
                    <Td right>{formatNumber(holding.quantity)}</Td>
                    <Td right>{formatNumber(holding.avgPrice)}</Td>
                    <Td right>{formatNumber(holding.closePrice)}</Td>
                    <Td right>{formatRupiah(holding.costValue)}</Td>
                    <Td right>{formatRupiah(holding.marketValue)}</Td>
                    <Td right>
                      <span className={delta >= 0 ? UP : DOWN}>
                        {formatRupiah(delta)}
                        <span className="block text-xs opacity-80">
                          {delta >= 0 ? '+' : ''}
                          {percent.toFixed(2)}%
                        </span>
                      </span>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </table>
        </Section>

        <Section title="Monthly figures" caption="The chart, as numbers">
          <table className="w-full text-sm">
            <thead>
              <Tr head>
                <Th>Month</Th>
                <Th right>Market value</Th>
                <Th right>Cost basis</Th>
                <Th right>Unrealised</Th>
                <Th right>Cash</Th>
                <Th right>Equity NAB</Th>
              </Tr>
            </thead>
            <tbody>
              {months.map((month) => {
                const delta = month.marketValue - month.costBasis
                return (
                  <Tr key={month.date}>
                    <Td>{formatMonth(month.date)}</Td>
                    <Td right>{formatRupiah(month.marketValue)}</Td>
                    <Td right>{formatRupiah(month.costBasis)}</Td>
                    <Td right>
                      <span className={delta >= 0 ? UP : DOWN}>{formatRupiah(delta)}</span>
                    </Td>
                    <Td right>{formatRupiah(month.cash)}</Td>
                    <Td right>{formatRupiah(month.equityNav)}</Td>
                  </Tr>
                )
              })}
            </tbody>
          </table>
        </Section>

        <Section
          title="Activity"
          caption={`${shown.length} of ${allEvents.length} entries`}
        >
          <table className="w-full text-sm">
            <thead>
              <Tr head>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Stock</Th>
                <Th right>Detail</Th>
                <Th right>Amount</Th>
              </Tr>
            </thead>
            <tbody>
              {shown.map((event, i) => (
                <Tr key={`${event.date}-${i}`}>
                  <Td>{formatDay(event.date)}</Td>
                  <Td>
                    <span
                      className={
                        event.type === 'dividend'
                          ? 'font-medium text-slate-900 dark:text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      }
                    >
                      {EVENT_FILTERS.find((f) => f.type === event.type)?.label.replace(/s$/, '') ??
                        event.type}
                    </span>
                  </Td>
                  <Td>{event.ticker ?? '—'}</Td>
                  <Td right>
                    <span className="text-slate-500 dark:text-slate-400">
                      {event.quantity != null && event.price != null
                        ? `${formatNumber(event.quantity)} @ ${formatNumber(event.price)}`
                        : (event.note ?? '—')}
                    </span>
                  </Td>
                  <Td right>{formatRupiah(event.amount)}</Td>
                </Tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>
    </Layout>
  )
}

function Stat({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail?: string
  tone?: 'up' | 'down'
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      {/* Proportional figures: tabular digits read loose at this size. */}
      <p
        className={`mt-1 text-lg font-semibold ${
          tone === 'up' ? UP : tone === 'down' ? DOWN : 'text-slate-900 dark:text-white'
        }`}
      >
        {value}
      </p>
      {detail && (
        <p className="mt-0.5 flex items-center gap-0.5 text-xs text-slate-400 dark:text-slate-500">
          {tone === 'up' && <ArrowUpRight className="h-3 w-3" />}
          {tone === 'down' && <ArrowDownRight className="h-3 w-3" />}
          {detail}
        </p>
      )}
    </div>
  )
}

function Section({
  title,
  caption,
  children,
}: {
  title: string
  caption?: string
  children: ReactNode
}) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
        {caption && <p className="text-xs text-slate-400 dark:text-slate-500">{caption}</p>}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {children}
      </div>
    </section>
  )
}

function Tr({ children, head }: { children: ReactNode; head?: boolean }) {
  return (
    <tr className={head ? '' : 'border-t border-slate-100 dark:border-slate-800'}>{children}</tr>
  )
}

function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return (
    <th
      scope="col"
      className={`px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 ${
        right ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  )
}

function Td({ children, right }: { children: ReactNode; right?: boolean }) {
  return (
    <td
      className={`px-4 py-2.5 align-top text-slate-700 dark:text-slate-300 ${
        right ? 'text-right tabular-nums' : 'text-left'
      }`}
    >
      {children}
    </td>
  )
}
