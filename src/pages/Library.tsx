import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import Layout from '../components/Layout'
import { docs, formatDate } from '../lib/docs'

export default function Library() {
  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-10">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Library</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {docs.length} document{docs.length === 1 ? '' : 's'} in{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
              src/content
            </code>
          </p>
        </div>

        {docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No documents yet. Drop an <code>.mdx</code> file into <code>src/content</code>.
          </div>
        ) : (
          // Grid items stretch by default, so h-full + flex-col lets every card
          // match its row's height and pin its tags to the bottom edge.
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <li key={doc.slug}>
                <Link
                  to={`/${doc.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                    {doc.date && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(doc.date)}
                      </span>
                    )}
                  </div>

                  <h2 className="line-clamp-2 font-medium text-slate-900 dark:text-white">
                    {doc.title}
                  </h2>

                  {doc.description && (
                    <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {doc.description}
                    </p>
                  )}

                  {doc.tags?.length ? (
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                      {doc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  )
}
