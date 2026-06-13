import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { getAnalysis } from '../data/content'
import { hydrateMetrics } from '../data/sheets'
import type { SheetData } from '../data/sheets'
import { useSheetData } from '../hooks/useSheetData'
import { METRIC_COLOR_LIST } from '../utils/colors'
import Layout from '../components/Layout'
import MetricChart from '../components/MetricChart'
import DualMetricChart from '../components/DualMetricChart'
import StackedBarChart from '../components/StackedBarChart'
import ComboChart from '../components/ComboChart'
import ComparisonChart from '../components/ComparisonChart'
import type { Metric } from '../types/stock'
import { fmtValue } from '../utils/format'

export default function MetricsDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const stock = getAnalysis(id ?? '')
  const { data: sheetData, loading: sheetLoading } = useSheetData(stock?.sector ?? '')

  const metrics = useMemo(() => {
    if (!stock?.metrics) return undefined
    if (sheetData) return hydrateMetrics(stock.metrics, stock.ticker, sheetData)
    return stock.metrics.map((m) => ({ ...m, data: m.data ?? [] }))
  }, [stock, sheetData])

  if (!stock || !metrics?.length) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-slate-400">
          No metrics found.
        </div>
      </Layout>
    )
  }

  const hasAnyPeriodic = metrics.some((m) => m.data.some((d) => d.period !== undefined))
  const hasAnyAnnual = metrics.some((m) => m.data.some((d) => d.year !== undefined && !d.period))
  const showFreqToggle = hasAnyPeriodic && hasAnyAnnual

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-10 py-10">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{stock.ticker}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {stock.companyName} · {stock.sector}
          </p>
        </div>

        {/* Charts grid */}
        {sheetLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Loading metrics...</span>
          </div>
        ) : (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {(() => {
            const secondaryIds = new Set(metrics.map((m) => m.dualWith).filter(Boolean))
            const stackMemberIds = new Set(metrics.flatMap((m) => m.stackWith ?? []))
            const comboLineIds = new Set(metrics.map((m) => m.comboWith).filter(Boolean))
            return metrics
              .filter(
                (m) =>
                  !secondaryIds.has(m.id) && !stackMemberIds.has(m.id) && !comboLineIds.has(m.id),
              )
              .map((metric, i) => {
                const paired = metric.dualWith
                  ? metrics.find((m) => m.id === metric.dualWith)
                  : undefined
                const mountDelay = i * 100
                if (paired)
                  return (
                    <ChartSlot key={metric.id} mountDelay={mountDelay}>
                      <DualMetricChart
                        percentMetric={metric}
                        nominalMetric={paired}
  
                      />
                    </ChartSlot>
                  )
                if (metric.stackWith?.length) {
                  const stackMetrics = metric.stackWith
                    .map((id) => metrics.find((m) => m.id === id))
                    .filter((m): m is typeof metric => m !== undefined)
                  return (
                    <ChartSlot key={metric.id} mountDelay={mountDelay}>
                      <StackedBarChart metrics={stackMetrics} />
                    </ChartSlot>
                  )
                }
                if (metric.comboWith) {
                  const lineMetric = metrics.find((m) => m.id === metric.comboWith)
                  if (lineMetric)
                    return (
                      <ChartSlot key={metric.id} mountDelay={mountDelay}>
                        <ComboChart
                          leftMetrics={[metric]}
                          rightMetrics={[lineMetric]}
    
                        />
                      </ChartSlot>
                    )
                }
                return (
                  <ChartSlot key={metric.id} mountDelay={mountDelay}>
                    <MetricChart
                      metric={metric}
                      color={METRIC_COLOR_LIST[i % METRIC_COLOR_LIST.length]}

                    />
                  </ChartSlot>
                )
              })
          })()}
        </div>
        )}

        {/* Summary table */}
        <SummaryTable metrics={metrics} showFreqToggle={showFreqToggle} />

        {/* Peer comparison */}
        <PeerComparison metrics={metrics} sheetData={sheetData} />
      </div>
    </Layout>
  )
}

function ChartSlot({ children, mountDelay = 0 }: { children: React.ReactNode; mountDelay?: number }) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), mountDelay)
    return () => clearTimeout(t)
  }, [mountDelay])

  useEffect(() => {
    if (!mounted) return
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [mounted])

  if (!mounted) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 min-h-72 shadow-md shadow-slate-200/60 dark:shadow-none" />
    )
  }

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(10px)',
        transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
      }}
    >
      {children}
    </div>
  )
}

function PeerComparison({
  metrics,
  sheetData,
}: {
  metrics: Metric[]
  sheetData: SheetData | null
}) {
  if (!sheetData) return null

  const comparisons = metrics
    .map((m) => {
      const tickers = sheetData[m.id]
      if (!tickers) return null
      const series = Object.entries(tickers)
        .map(([ticker, data]) => ({
          ticker,
          data: data
            .filter((d) => d.year !== undefined)
            .map((d) => ({ year: d.year!, value: d.value })),
        }))
        .filter((s) => s.data.length > 0)
      if (series.length < 2) return null
      return { metric: m, series }
    })
    .filter(
      (
        c,
      ): c is {
        metric: Metric
        series: { ticker: string; data: { year: number; value: number }[] }[]
      } => c !== null,
    )

  if (comparisons.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">
        Peer Comparison
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {comparisons.map(({ metric, series }) => (
          <ComparisonChart
            key={metric.id}
            label={metric.label}
            unit={metric.unit}
            type={metric.compareType ?? metric.type}
            series={series}
          />
        ))}
      </div>
    </div>
  )
}

function SummaryTable({ metrics, showFreqToggle }: { metrics: Metric[]; showFreqToggle: boolean }) {
  const [freq, setFreq] = useState<'annual' | 'periodic'>('annual')

  const rows =
    freq === 'annual'
      ? [
          ...new Set(
            metrics.flatMap((m) =>
              m.data.filter((d) => d.year !== undefined && !d.period).map((d) => String(d.year)),
            ),
          ),
        ].sort((a, b) => Number(b) - Number(a))
      : [
          ...new Set(
            metrics.flatMap((m) =>
              m.data.filter((d) => d.period !== undefined).map((d) => d.period!),
            ),
          ),
        ].sort((a, b) => {
          const [qa, ya] = a.split(' ')
          const [qb, yb] = b.split(' ')
          return Number(yb) - Number(ya) || qa.localeCompare(qb) * -1
        })

  if (rows.length === 0) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">All Metrics</p>
        {showFreqToggle && (
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFreq('annual')}
              className={`px-2.5 py-1 rounded-md transition-colors ${freq === 'annual' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-white font-medium' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              Annual
            </button>
            <button
              onClick={() => setFreq('periodic')}
              className={`px-2.5 py-1 rounded-md transition-colors ${freq === 'periodic' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-white font-medium' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              Quarterly
            </button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <th className="text-left text-slate-400 font-medium px-6 py-3 w-28">Period</th>
              {metrics.map((m) => (
                <th
                  key={m.id}
                  className="text-right text-slate-500 dark:text-slate-400 font-medium px-5 py-3 whitespace-nowrap"
                >
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row}
                className={`border-b border-slate-50 dark:border-slate-800 last:border-0 ${i === 0 ? 'bg-blue-50/40 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <td
                  className={`px-6 py-3 font-medium ${i === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  {row}
                </td>
                {metrics.map((m) => {
                  const point =
                    freq === 'annual'
                      ? m.data.find((d) => String(d.year) === row && !d.period)
                      : m.data.find((d) => d.period === row)
                  return (
                    <td
                      key={m.id}
                      className="px-5 py-3 text-right font-medium text-slate-900 dark:text-white tabular-nums"
                    >
                      {point !== undefined ? fmtValue(point.value, m.unit) : '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
