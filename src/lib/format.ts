// Number and date formatting, shared by anything that prints rupiah.
//
// These live here rather than beside the portfolio data because importing them
// from `data/portfolio` would evaluate that module's eager glob — dragging the
// real figures into the bundle of every page that only wanted a comma.

// Grouping comes to the browser as en-US commas, matching how the Stockbit
// statements themselves print the figures.
const full = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function formatRupiah(value: number): string {
  return `${value < 0 ? '−' : ''}Rp ${full.format(Math.abs(Math.round(value)))}`
}

/** Axis-width money: 462,967,781 → "463 jt". */
export function formatCompact(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '−' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1)} M`
  if (abs >= 1_000_000) return `${sign}${Math.round(abs / 1_000_000)} jt`
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)} rb`
  return `${sign}${full.format(abs)}`
}

export function formatDay(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatMonth(date: string | number): string {
  const parsed = typeof date === 'number' ? new Date(date) : new Date(`${date}T00:00:00`)
  return parsed.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
}

/** Share quantities and prices, which are not rupiah totals. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)
}

/** A percentage that keeps one decimal unless it is a whole number. */
export function formatPercent(value: number): string {
  const rounded = Math.round(value * 100) / 100
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded).toFixed(2)}%`
}

/**
 * The inverse of the grouped inputs: "1,234.5" → 1234.5. A half-typed value
 * ("", "-", ".") is null rather than NaN, so callers can tell "not finished"
 * from "not a number".
 */
export function toNumber(value: string): number | null {
  const cleaned = value.replace(/,/g, '').trim()
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}
