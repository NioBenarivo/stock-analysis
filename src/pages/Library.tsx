import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Hash, Loader2, Search, X } from 'lucide-react'
import Layout from '../components/Layout'
import Highlight, { HighlightParts } from '../components/Highlight'
import { useSearch } from '../hooks/useSearch'
import { docs, formatDate } from '../lib/docs'
import { parseQuery, type SearchResult } from '../lib/search'

export default function Library() {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // No limit: the filter narrows the whole grid rather than showing a top-N.
  const { results, loadingIndex, indexReady } = useSearch(query, true, Number.MAX_SAFE_INTEGER)
  const terms = useMemo(() => parseQuery(query), [query])
  const filtering = query.trim().length > 0

  // `/` focuses this box instead of opening the palette while the library is
  // on screen; the navbar's handler ignores keys typed into an input, so once
  // focus lands here the two never fight over it.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey) return
      const el = event.target as HTMLElement | null
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA'].includes(el.tagName))) return
      event.preventDefault()
      event.stopPropagation()
      inputRef.current?.focus()
    }
    // Capture phase so this beats the navbar's window listener to the key.
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])

  const cards: SearchResult[] = filtering
    ? results
    : docs.map((doc) => ({ doc, score: 0, href: `/${doc.slug}` }))

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Library</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {filtering ? (
              <>
                {cards.length} of {docs.length} document{docs.length === 1 ? '' : 's'} match{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">{query.trim()}</span>
                {!indexReady && ' — searching titles while the full text loads'}
              </>
            ) : (
              <>
                {docs.length} document{docs.length === 1 ? '' : 's'} in{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
                  src/content
                </code>
              </>
            )}
          </p>
        </div>

        <div className="mb-8 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 focus-within:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:border-slate-600">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && setQuery('')}
            placeholder="Search titles, tags and document text…"
            aria-label="Search documents"
            className="h-11 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            autoComplete="off"
            spellCheck={false}
          />
          {loadingIndex && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />}
          {filtering && (
            <button
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {filtering ? (
              <>
                Nothing matches <span className="font-medium">{query.trim()}</span>.
              </>
            ) : (
              <>
                No documents yet. Drop an <code>.mdx</code> file into <code>src/content</code>.
              </>
            )}
          </div>
        ) : (
          // Grid items stretch by default, so h-full + flex-col lets every card
          // match its row's height and pin its tags to the bottom edge.
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(({ doc, href, heading, snippet }) => (
              <li key={doc.slug}>
                <Link
                  to={href}
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
                    <Highlight text={doc.title} terms={terms} />
                  </h2>

                  {/* A body hit replaces the description with the matching
                      passage, so the card shows why it survived the filter. */}
                  {snippet ? (
                    <>
                      {heading && (
                        <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <Hash className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            <Highlight text={heading} terms={terms} />
                          </span>
                        </div>
                      )}
                      <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        <HighlightParts parts={snippet} />
                      </p>
                    </>
                  ) : (
                    doc.description && (
                      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        <Highlight text={doc.description} terms={terms} />
                      </p>
                    )
                  )}

                  {doc.tags?.length ? (
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                      {doc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        >
                          <Highlight text={tag} terms={terms} />
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
