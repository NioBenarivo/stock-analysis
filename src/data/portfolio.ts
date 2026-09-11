// The portfolio data contract.
//
// The numbers themselves live in `portfolio.local.ts`, which is gitignored —
// real balances should not end up in a public repo or on the deployed site.
// This module loads that file if it is there and falls back to empty, so the
// build works either way: locally you get the full chart, on Vercel the page
// renders its empty state.

// No cash-movement type on purpose. Every P/R row in the statements is the
// daily settlement of that day's trading — the account sweeps to zero each
// day — so plotting them would double-count the buys and sells that cause
// them. Add one back only for a transfer that isn't settling a trade.
export type EventType = 'dividend' | 'buy' | 'sell'

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

// The formatters moved to `lib/format`, where a page that wants a comma can
// import them without pulling the figures below into its bundle. Re-exported
// so the portfolio's own modules keep their single import.
export * from '../lib/format'
