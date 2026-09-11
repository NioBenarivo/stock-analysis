import { useMemo, useState, type ReactNode } from 'react'
import Layout from '../components/Layout'
import GrowthChart, { type GrowthPoint, type Unit } from '../components/GrowthChart'
import NumberField from '../components/NumberField'
import { formatCompact, formatNumber, formatPercent, formatRupiah, toNumber } from '../lib/format'

const UP = 'text-[#006300] dark:text-[#0ca30c]'
const DOWN = 'text-[#d03b3b]'

// Sixty compounding years is already past the point of meaning; the cap is
// there so a stray keystroke cannot ask for ten thousand bars.
const MAX_YEARS = 60
const MONTHS = 12
/** Years up to this many get a bar per month; longer runs step in years. */
const MONTHLY_LIMIT = 5

export default function Calculator() {
  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Calculator</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Two workings-out: what a price gives you against your own estimate of value, and
            what a return does to it over time.
          </p>
        </div>

        <MarginOfSafety />
        <CompoundGrowth />
      </div>
    </Layout>
  )
}

function MarginOfSafety() {
  const [price, setPrice] = useState('1,000')
  const [fair, setFair] = useState('1,500')

  const currentPrice = toNumber(price)
  const fairPrice = toNumber(fair)

  const result = useMemo(() => {
    if (currentPrice == null || fairPrice == null || fairPrice <= 0) return null
    // Margin of safety is the discount measured against value, which is the
    // convention Graham set. Measured against price it would be the upside
    // below — a different, always larger number, and the usual mix-up.
    const margin = ((fairPrice - currentPrice) / fairPrice) * 100
    const upside = currentPrice > 0 ? (fairPrice / currentPrice - 1) * 100 : null
    return { margin, upside, gap: fairPrice - currentPrice }
  }, [currentPrice, fairPrice])

  const fairError =
    fair.trim() !== '' && fairPrice != null && fairPrice <= 0
      ? 'Fair value has to be above zero'
      : undefined

  return (
    <Card
      title="Margin of safety"
      caption="How far below your estimate of value the market is asking"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Current price"
          value={price}
          onChange={setPrice}
          prefix="Rp"
          grouped
          hint="What the market is asking today"
        />
        <NumberField
          label="Fair value"
          value={fair}
          onChange={setFair}
          prefix="Rp"
          grouped
          error={fairError}
          hint="Your own estimate of what it is worth"
        />
      </div>

      {result ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Stat
              label="Margin of safety"
              value={formatPercent(result.margin)}
              tone={result.margin > 0 ? 'up' : result.margin < 0 ? 'down' : undefined}
              detail={
                result.margin > 0
                  ? `${formatRupiah(result.gap)} below fair value`
                  : result.margin < 0
                    ? `${formatRupiah(Math.abs(result.gap))} above fair value`
                    : 'Priced exactly at fair value'
              }
              large
            />
            <Stat
              label="Upside to fair value"
              value={result.upside == null ? '—' : formatPercent(result.upside)}
              detail="What the price would have to gain"
            />
            <Stat
              label="Price ÷ fair value"
              value={
                fairPrice && fairPrice > 0
                  ? `${formatNumber((currentPrice ?? 0) / fairPrice)}×`
                  : '—'
              }
              detail={result.margin > 0 ? 'Trading at a discount' : 'Trading at a premium'}
            />
          </div>

          <Formula>
            margin of safety = (fair value − current price) ÷ fair value
          </Formula>
        </>
      ) : (
        <Empty>Enter both prices to see the margin.</Empty>
      )}
    </Card>
  )
}

function CompoundGrowth() {
  const [equity, setEquity] = useState('100,000,000')
  const [rate, setRate] = useState('12')
  const [years, setYears] = useState('10')
  const [deposit, setDeposit] = useState('0')

  const principal = toNumber(equity)
  const ratePercent = toNumber(rate)
  const yearCount = toNumber(years)
  const monthly = toNumber(deposit) ?? 0

  // Compounded month by month rather than in closed form. The annuity formula
  // divides by the rate, which explodes at exactly 0% — and the loop has to run
  // anyway to produce the series the chart reads.
  const series = useMemo<GrowthPoint[]>(() => {
    if (principal == null || ratePercent == null || yearCount == null) return []
    const totalYears = Math.min(Math.floor(yearCount), MAX_YEARS)
    if (principal <= 0 || totalYears < 1) return []

    const monthRate = ratePercent / 100 / MONTHS
    const out: GrowthPoint[] = [
      { month: 0, step: 0, value: principal, contributed: principal, gain: 0, stepGain: 0 },
    ]

    let value = principal
    let contributed = principal
    for (let month = 1; month <= totalYears * MONTHS; month++) {
      // Interest first, then the deposit: a deposit made at the end of a month
      // earns nothing during it.
      value = value * (1 + monthRate) + monthly
      contributed += monthly
      out.push({ month, step: month, value, contributed, gain: value - contributed, stepGain: 0 })
    }
    return out
  }, [principal, ratePercent, yearCount, monthly])

  // Up to five years every month is worth a bar; past that the chart and the
  // table step in years, off the same monthly numbers.
  const unit: Unit = series.length - 1 <= MONTHLY_LIMIT * MONTHS ? 'month' : 'year'

  const rows = useMemo<GrowthPoint[]>(() => {
    const sampled =
      unit === 'month'
        ? series
        : series
            .filter((point) => point.month % MONTHS === 0)
            .map((point) => ({ ...point, step: point.month / MONTHS }))

    // A step's own gain is what it added beyond the deposits made inside it,
    // so a yearly row reports a whole year rather than its last month.
    return sampled.map((point, i) =>
      i === 0
        ? point
        : {
            ...point,
            stepGain:
              point.value -
              sampled[i - 1].value -
              (point.contributed - sampled[i - 1].contributed),
          },
    )
  }, [series, unit])

  const last = series[series.length - 1]
  const yearsError =
    years.trim() !== '' && yearCount != null && (yearCount < 1 || yearCount > MAX_YEARS)
      ? `Between 1 and ${MAX_YEARS}`
      : undefined

  const monthRate = (ratePercent ?? 0) / MONTHS
  // Twelve monthly compounds land above the headline rate. Saying so beats
  // having the number quietly disagree with the annual figure people expect.
  const effective = ((1 + monthRate / 100) ** MONTHS - 1) * 100

  return (
    <Card
      title="Compound growth"
      caption="What a lump sum, and anything you add each month, becomes at a steady return"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField
          label="Starting equity"
          value={equity}
          onChange={setEquity}
          prefix="Rp"
          grouped
          hint="Invested once, at the start"
        />
        <NumberField
          label="Monthly deposit"
          value={deposit}
          onChange={setDeposit}
          prefix="Rp"
          grouped
          hint="Added at the end of every month"
        />
        <NumberField
          label="Annual return"
          value={rate}
          onChange={setRate}
          suffix="%"
          negative
          hint={
            ratePercent == null
              ? 'A loss can be negative'
              : `${formatNumber(monthRate)}% a month → ${formatNumber(effective)}%/yr compounded`
          }
        />
        <NumberField
          label="Years"
          value={years}
          onChange={setYears}
          suffix="yr"
          error={yearsError}
          hint={`Up to ${MAX_YEARS}`}
        />
      </div>

      {last && principal != null ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Final value" value={formatRupiah(last.value)} large />
            <Stat
              label="Total put in"
              value={formatRupiah(last.contributed)}
              detail={
                monthly > 0
                  ? `${formatCompact(principal)} + ${formatCompact(monthly)} × ${last.month} months`
                  : 'the starting lump sum'
              }
            />
            <Stat
              label="Total gain"
              value={formatRupiah(last.gain)}
              tone={last.gain >= 0 ? 'up' : 'down'}
              detail={`over ${last.month / MONTHS} year${last.month === MONTHS ? '' : 's'}`}
            />
            <Stat
              label="Growth multiple"
              value={`${formatNumber(last.value / last.contributed)}×`}
              detail="of everything you put in"
            />
          </div>

          <GrowthChart rows={rows} unit={unit} />

          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <Th>{unit === 'month' ? 'Month' : 'Year'}</Th>
                  <Th right>Put in</Th>
                  <Th right>Value</Th>
                  <Th right>Gain that {unit}</Th>
                  <Th right>Gain in total</Th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row) => (
                  <tr key={row.month} className="border-t border-slate-100 dark:border-slate-800">
                    <Td>{row.step}</Td>
                    <Td right>{formatRupiah(row.contributed)}</Td>
                    <Td right>{formatRupiah(row.value)}</Td>
                    <Td right>{formatRupiah(row.stepGain)}</Td>
                    <Td right>
                      <span className={row.gain >= 0 ? UP : DOWN}>{formatRupiah(row.gain)}</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Formula>
            every month: value = value × (1 + annual return ÷ 12) + monthly deposit
          </Formula>
        </>
      ) : (
        <Empty>Enter a starting amount above zero, a return, and at least one year.</Empty>
      )}
    </Card>
  )
}

function Card({
  title,
  caption,
  children,
}: {
  title: string
  caption: string
  children: ReactNode
}) {
  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{caption}</p>
      </div>
      {children}
    </section>
  )
}

function Stat({
  label,
  value,
  detail,
  tone,
  large,
}: {
  label: string
  value: string
  detail?: string
  tone?: 'up' | 'down'
  large?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`mt-1 font-semibold ${large ? 'text-xl' : 'text-lg'} ${
          tone === 'up' ? UP : tone === 'down' ? DOWN : 'text-slate-900 dark:text-white'
        }`}
      >
        {value}
      </p>
      {detail && (
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{detail}</p>
      )}
    </div>
  )
}

function Formula({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
      <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">{children}</span>
    </p>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
      {children}
    </p>
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
      className={`px-4 py-2.5 text-slate-700 dark:text-slate-300 ${
        right ? 'text-right tabular-nums' : 'text-left'
      }`}
    >
      {children}
    </td>
  )
}
