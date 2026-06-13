export const METRIC_COLORS = {
  blue: '#3b82f6',
  emerald: '#10b981',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  orange: '#f97316',
  indigo: '#6366f1',
  teal: '#14b8a6',
  rose: '#f43f5e',
  lime: '#84cc16',
  purple: '#a855f7',
}

export const METRIC_COLOR_LIST = Object.values(METRIC_COLORS)

export function resolveColor(color: string | undefined, fallback: string): string {
  if (!color) return fallback
  return METRIC_COLORS[color as keyof typeof METRIC_COLORS] ?? color
}
