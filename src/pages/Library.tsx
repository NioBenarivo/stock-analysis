import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import Layout from '../components/Layout'
import { docs, formatDate } from '../lib/docs'

export default function Library() {
  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-10">
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
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li key={doc.slug}>
                <Link
                  to={`/${doc.slug}`}
                  className="group flex gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-slate-900 dark:text-white">{doc.title}</h2>
                    {doc.description && (
                      <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        {doc.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                      {doc.date && <span>{formatDate(doc.date)}</span>}
                      {doc.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  )
}
