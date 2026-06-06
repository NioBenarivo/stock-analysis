/**
 * Formats a metric value + unit for display.
 * - % units: value comes before unit with no space  → "75%"
 * - everything else: thousands-separated, unit after → "27,147 Rp(B)"
 */
export function fmtValue(value: number, unit: string): string {
  const u = unit.trim()
  if (u === '%') return `${value}%`
  const formatted = value.toLocaleString('en-US')
  return u ? `${formatted} ${u}` : formatted
}

/**
 * Compact version for Y-axis ticks where space is tight.
 * Abbreviates large numbers: 1,500 → "1.5K", 27,000 → "27K", 1,200,000 → "1.2M"
 */
export function fmtTick(value: number, unit: string): string {
  const u = unit.trim()
  let compact: string
  if (value >= 1_000_000) {
    compact = `${+(value / 1_000_000).toFixed(1)}M`
  } else if (value >= 1_000) {
    compact = `${+(value / 1_000).toFixed(1)}K`
  } else {
    compact = String(value)
  }
  if (u === '%') return `${compact}%`
  return u ? `${compact} ${u}` : compact
}
