import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getAnalysis, analyses } from '../data/content'
import type { Metric, StockAnalysis } from '../types/stock'
import { METRIC_COLOR_LIST } from '../utils/colors'
import Layout from '../components/Layout'
import MetricChart from '../components/MetricChart'
import ComparisonChart from '../components/ComparisonChart'
import ComboChart from '../components/ComboChart'
import DualMetricChart from '../components/DualMetricChart'
import StackedBarChart from '../components/StackedBarChart'

function CompanyLogo({ domain, ticker }: { domain: string; ticker: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-lg shrink-0">
        {ticker.slice(0, 2)}
      </div>
    )
  }
  return (
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={ticker}
      onError={() => setFailed(true)}
      className="w-14 h-14 rounded-2xl object-contain bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 shrink-0"
    />
  )
}

function makeCodeRenderer(metrics: Metric[] | undefined, allAnalyses: StockAnalysis[]) {
  return function CodeBlock({
    className,
    children,
  }: {
    className?: string
    children?: React.ReactNode
  }) {
    const lang = className?.replace('language-', '')
    const content = String(children).trim()

    if (lang === 'chart' && metrics) {
      const metric = metrics.find((m) => m.id === content)
      const colorIndex = metrics.findIndex((m) => m.id === content)
      if (metric) {
        return (
          <div className="not-prose my-6">
            <MetricChart metric={metric} color={METRIC_COLOR_LIST[colorIndex % METRIC_COLOR_LIST.length]} />
          </div>
        )
      }
    }

    if (lang === 'dual' && metrics) {
      const lines = content.split('\n').map((s) => s.trim()).filter(Boolean)
      const percentId = lines.find((l) => l.startsWith('percent:'))?.replace('percent:', '').trim()
      const nominalId = lines.find((l) => l.startsWith('nominal:'))?.replace('nominal:', '').trim()
      const percentMetric = metrics.find((m) => m.id === percentId)
      const nominalMetric = metrics.find((m) => m.id === nominalId)
      if (percentMetric && nominalMetric) {
        return (
          <div className="not-prose my-6">
            <DualMetricChart percentMetric={percentMetric} nominalMetric={nominalMetric} />
          </div>
        )
      }
    }

    if (lang === 'combo' && metrics) {
      const leftIds: string[] = []
      const rightIds: string[] = []
      for (const line of content.split('\n').map((s) => s.trim()).filter(Boolean)) {
        if (line.startsWith('left:'))
          leftIds.push(...line.replace('left:', '').split(',').map((s) => s.trim()).filter(Boolean))
        else if (line.startsWith('right:'))
          rightIds.push(...line.replace('right:', '').split(',').map((s) => s.trim()).filter(Boolean))
      }
      const leftMetrics = leftIds.map((id) => metrics.find((m) => m.id === id)).filter((m): m is Metric => m !== undefined)
      const rightMetrics = rightIds.map((id) => metrics.find((m) => m.id === id)).filter((m): m is Metric => m !== undefined)
      if (leftMetrics.length > 0 || rightMetrics.length > 0) {
        return (
          <div className="not-prose my-6">
            <ComboChart leftMetrics={leftMetrics} rightMetrics={rightMetrics} />
          </div>
        )
      }
    }

    if (lang === 'stack' && metrics) {
      const ids = content.split('\n').map((s) => s.trim()).filter(Boolean)
      const stackMetrics = ids.map((id) => metrics.find((m) => m.id === id)).filter((m): m is Metric => m !== undefined)
      if (stackMetrics.length > 0) {
        return (
          <div className="not-prose my-6">
            <StackedBarChart metrics={stackMetrics} />
          </div>
        )
      }
    }

    if (lang === 'compare') {
      const metricId = content
      const series = allAnalyses
        .filter((a) => a.metrics?.some((m) => m.id === metricId))
        .map((a) => {
          const metric = a.metrics!.find((m) => m.id === metricId)!
          return {
            ticker: a.ticker,
            unit: metric.unit,
            label: metric.label,
            data: metric.data
              .filter((d) => d.year !== undefined)
              .map((d) => ({ year: d.year!, value: d.value })),
          }
        })
      if (series.length > 0) {
        return (
          <div className="not-prose my-6">
            <ComparisonChart label={series[0].label} unit={series[0].unit} series={series} />
          </div>
        )
      }
    }

    return <code className={className}>{children}</code>
  }
}

export default function Company() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const stock = getAnalysis(id ?? '')

  if (!stock) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-slate-400">Company not found.</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-10 py-10">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="flex items-center gap-5 mb-10">
          <CompanyLogo domain={stock.logoDomain} ticker={stock.ticker} />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{stock.ticker}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{stock.companyName} · {stock.sector}</p>
          </div>
        </div>

        {/* Written analysis with inline charts */}
        {stock.body && (
          <div>
            <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{stock.title}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{stock.subtitle}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                {new Date(stock.dateAnalyzed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none
              prose-headings:font-semibold
              prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
              prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
              prose-p:leading-relaxed prose-p:my-4
              prose-strong:font-semibold
            ">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  pre: ({ children }) => <div>{children}</div>,
                  code: makeCodeRenderer(stock.metrics, analyses),
                }}
              >
                {stock.body}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
