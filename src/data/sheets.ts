import type { Metric, MetricDataPoint } from '../types/stock'

// { metricId: { TICKER: dataPoints[] } }
export type SheetData = Record<string, Record<string, MetricDataPoint[]>>

// ─── CSV parser ────────────────────────────────────────────────────────────────

function parseCsvRow(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current.trim())
  return cells
}

function parsePeriod(raw: string): Omit<MetricDataPoint, 'value'> {
  if (/^Q\d\s+\d{4}$/.test(raw)) return { period: raw }
  const year = parseInt(raw, 10)
  if (!isNaN(year) && String(year) === raw) return { year }
  return { period: raw }
}

// Parses the block-format sheet CSV into SheetData.
//
// Expected layout per table block:
//   metric_id           ← single non-empty cell = table name
//   period,BBCA,BBRI,…  ← header row (first cell must be "period" or "year")
//   2020,644,502,…      ← data rows
//   (blank row)         ← separates blocks
//
export function parseCsvToSheetData(raw: string): SheetData {
  const result: SheetData = {}
  const lines = raw.split(/\r?\n/)

  let state: 'idle' | 'hasName' | 'inData' = 'idle'
  let currentMetric = ''
  let headers: string[] = []

  for (const line of lines) {
    const row = parseCsvRow(line)
    const nonEmpty = row.filter((c) => c !== '')

    // Blank row → reset
    if (nonEmpty.length === 0) {
      state = 'idle'
      currentMetric = ''
      headers = []
      continue
    }

    if (state === 'idle') {
      // Table name: first cell is non-empty text that isn't a year/period number
      const first = row[0].trim()
      if (first && isNaN(parseInt(first, 10))) {
        currentMetric = first.toLowerCase().replace(/\s+/g, '_')
        state = 'hasName'
      }
      continue
    }

    if (state === 'hasName') {
      // Header row: first cell is "period" or "year"
      const first = row[0].toLowerCase()
      if (first === 'period' || first === 'year') {
        headers = row.map((c) => c.trim())
        result[currentMetric] ??= {}
        for (let i = 1; i < headers.length; i++) {
          if (headers[i]) result[currentMetric][headers[i]] ??= []
        }
        state = 'inData'
      }
      continue
    }

    if (state === 'inData') {
      const periodRaw = row[0].trim()
      if (!periodRaw) continue
      const point = parsePeriod(periodRaw)

      for (let i = 1; i < headers.length; i++) {
        const ticker = headers[i]
        if (!ticker) continue
        const val = parseFloat((row[i] ?? '').replace(/,/g, ''))
        if (!isNaN(val)) {
          result[currentMetric][ticker] ??= []
          result[currentMetric][ticker].push({ ...point, value: val })
        }
      }
    }
  }

  return result
}

// ─── Fetch + module-level cache ────────────────────────────────────────────────

const cache = new Map<string, Promise<SheetData>>()

export function fetchSheetData(url: string): Promise<SheetData> {
  if (!cache.has(url)) {
    const promise = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Sheet fetch failed: ${r.status}`)
        return r.text()
      })
      .then((text) => parseCsvToSheetData(text))
      .catch(() => ({}) as SheetData)
    cache.set(url, promise)
  }
  return cache.get(url)!
}

// ─── Hydration ─────────────────────────────────────────────────────────────────

// Merges sheet data into metric schemas for a specific ticker.
// Sheet data wins over frontmatter data when present.
// Formula metrics (no direct data) are left untouched — resolveFormulas handles them.
export function hydrateMetrics(metrics: Metric[], ticker: string, sheetData: SheetData): Metric[] {
  return metrics.map((m) => {
    const tickerData = sheetData[m.id]?.[ticker]
    if (tickerData && tickerData.length > 0) return { ...m, data: tickerData }
    return { ...m, data: m.data ?? [] }
  })
}
