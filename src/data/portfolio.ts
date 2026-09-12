// The portfolio data contract.
//
// The numbers themselves live in `portfolio.local.ts`, which is gitignored —
// real balances should not end up in a public repo or on the deployed site.
// This module loads that file if it is there and falls back to empty, so the
// build works either way: locally you get the full chart, on Vercel the page
// renders its empty state.

// `deposit` and `withdrawal` are the exception this file always anticipated:
// money crossing the account boundary, not a trade settling. Every P/R row in
// a statement is the daily settlement of that day's trading — the account
// sweeps to zero each evening — so those must never become events; recording
// them double-counts the buy or sell that caused them. Only a transfer that
// matches no invoice belongs here.
export type EventType = 'dividend' | 'buy' | 'sell' | 'deposit' | 'withdrawal'

/** The two that move money in or out rather than around. */
export const CASH_TYPES = ['deposit', 'withdrawal'] as const

export interface PortfolioEvent {
  /** ISO day — the statement's transaction date, not the settlement date. */
  date: string
  type: EventType
  ticker?: string
  quantity?: number
  price?: number
  /** Rupiah, always positive — `type` carries the direction. */
  amount: number
  note?: string
}

export interface Holding {
  ticker: string
  name: string
  quantity: number
  avgPrice: number
  closePrice: number
  costValue: number
  marketValue: number
}

/** One statement's closing position. */
export interface MonthSnapshot {
  /** ISO day the statement closes on. */
  date: string
  /** Portfolio market value at close. */
  marketValue: number
  /** What those holdings cost — the statement's "Buying Value" total. */
  costBasis: number
  cash: number
  /** Unsettled purchases, negative on the statement; stored as written. */
  undueTrading: number
  equityNav: number
  holdings?: Holding[]
}

export interface PortfolioData {
  months: MonthSnapshot[]
  events: PortfolioEvent[]
  /**
   * Money already in the account before the first `deposit`/`withdrawal` event
   * listed. Set it — `0` included, meaning the account started empty and every
   * transfer since is in `events` — to assert the cash history is complete, and
   * lifetime profit becomes exact. Leave it out when the transfer list only
   * covers part of the account's life: the page then measures profit from the
   * first statement instead, and says so.
   */
  openingBalance?: number
}

// A glob rather than a plain import: with no matching file it resolves to an
// empty object instead of failing the build, which is what lets the local data
// file stay out of git without breaking the deploy.
const local = import.meta.glob<PortfolioData>('./portfolio.local.ts', { eager: true })
const data = Object.values(local)[0]

const byDate = <T extends { date: string }>(a: T, b: T) => a.date.localeCompare(b.date)

export const months: MonthSnapshot[] = [...(data?.months ?? [])].sort(byDate)
export const events: PortfolioEvent[] = [...(data?.events ?? [])].sort(byDate)
export const hasPortfolioData = months.length > 0

export const latestMonth: MonthSnapshot | undefined = months[months.length - 1]

/** Unrealised gain/loss on the latest statement, in rupiah and percent. */
export function unrealised(month: MonthSnapshot) {
  const value = month.marketValue - month.costBasis
  return { value, percent: month.costBasis === 0 ? 0 : (value / month.costBasis) * 100 }
}

export function totalOf(type: EventType): number {
  return events.filter((event) => event.type === type).reduce((sum, e) => sum + e.amount, 0)
}

// ---------------------------------------------------------------------------
// Cash in and out
//
// What the trading events cannot tell you: how much of your own money is in
// here. `unrealised` compares market value to the cost of what you hold today,
// so it silently drops every realised gain and every dividend. Measured against
// contributions instead, the gap is the whole result.

export const cashFlows: PortfolioEvent[] = events.filter(
  (event): event is PortfolioEvent & { type: 'deposit' | 'withdrawal' } =>
    event.type === 'deposit' || event.type === 'withdrawal',
)

export const hasCashFlows = cashFlows.length > 0

/**
 * True when contributions are known from the account's first rupiah, so
 * `value − contributed` is lifetime profit rather than profit since a date.
 * Either the data says so outright, or every transfer predates the first
 * statement, which amounts to the same claim.
 */
export const lifetimeCashKnown: boolean =
  data?.openingBalance != null ||
  (hasCashFlows && months.length > 0 && cashFlows[0].date < months[0].date)

/**
 * What stood in the account before the listed transfers. With a complete
 * history that is the declared opening balance (often zero). Without one, the
 * first statement's value is the only honest anchor — profit is then measured
 * from that date forward, never called lifetime.
 *
 * Holdings plus cash, matching `profitOn`'s reading of the account exactly:
 * anchoring on market value alone would leave the first statement's cash
 * outside the money put in, and it would surface later as profit.
 */
export const openingBalance: number =
  data?.openingBalance ??
  (months.length > 0 ? months[0].marketValue + months[0].cash : 0)

/** Net of every deposit less every withdrawal up to and including `date`. */
export function netCashInBy(date: string): number {
  return cashFlows
    .filter((flow) => flow.date <= date)
    .reduce((sum, flow) => sum + (flow.type === 'deposit' ? flow.amount : -flow.amount), 0)
}

/**
 * Own money in the account at `date`: the opening anchor plus net transfers
 * since. This is the line the market value is read against.
 *
 * With a complete history every transfer counts. Without one, transfers up to
 * and including the first statement are already inside that statement's closing
 * value, so counting them again would double them — only later ones are added.
 */
export function contributedBy(date: string): number {
  const since = lifetimeCashKnown
    ? cashFlows
    : cashFlows.filter((f) => f.date > months[0]?.date)
  return (
    openingBalance +
    since
      .filter((flow) => flow.date <= date)
      .reduce((sum, flow) => sum + (flow.type === 'deposit' ? flow.amount : -flow.amount), 0)
  )
}

/** Everything made on the money put in: value now, less what was contributed. */
export function profitOn(month: MonthSnapshot) {
  const contributed = contributedBy(month.date)
  const value = month.marketValue + month.cash
  const gain = value - contributed
  return { contributed, value, gain, percent: contributed === 0 ? 0 : (gain / contributed) * 100 }
}

// The formatters moved to `lib/format`, where a page that wants a comma can
// import them without pulling the figures below into its bundle. Re-exported
// so the portfolio's own modules keep their single import.
export * from '../lib/format'
