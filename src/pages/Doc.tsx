import { Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Layout from '../components/Layout'
import { getDoc, formatDate } from '../lib/docs'

// Shown while a document's chunk downloads. Mirrors body-text rhythm so the
// page doesn't jump when the real content lands.
function DocSkeleton() {
  const widths = ['w-full', 'w-11/12', 'w-full', 'w-4/6', 'w-full', 'w-9/12']
  return (
    <div className="animate-pulse space-y-3" aria-label="Loading document" role="status">
      {widths.map((w, i) => (
        <div key={i} className={`h-4 rounded bg-slate-200 dark:bg-slate-800 ${w}`} />
      ))}
    </div>
  )
}

export default function Doc() {
  const { slug } = useParams<{ slug: string }>()
  const doc = getDoc(slug ?? '')

  if (!doc) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-10">
          <p className="text-slate-500 dark:text-slate-400">
            No document named <code>{slug}</code>.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm text-blue-600 dark:text-blue-400">
            Back to library
          </Link>
        </div>
      </Layout>
    )
  }

  const { Component } = doc

  return (
    <Layout>
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-10">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Library
        </Link>

        <header className="mb-8 border-b border-slate-200 pb-6 dark:border-slate-800">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{doc.title}</h1>
          {doc.description && (
            <p className="mt-1.5 text-slate-500 dark:text-slate-400">{doc.description}</p>
          )}
          {doc.date && (
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              {formatDate(doc.date)}
            </p>
          )}
        </header>

        <div
          className="prose prose-slate max-w-none dark:prose-invert
            prose-headings:font-semibold
            prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
            prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
            prose-p:leading-relaxed
            prose-a:text-blue-600 dark:prose-a:text-blue-400
            prose-code:before:content-none prose-code:after:content-none
            prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5
            prose-code:text-[0.85em] prose-code:font-normal dark:prose-code:bg-slate-800"
        >
          <Suspense fallback={<DocSkeleton />}>
            <Component />
          </Suspense>
        </div>
      </article>
    </Layout>
  )
}
