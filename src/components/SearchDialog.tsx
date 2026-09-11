import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { CornerDownLeft, FileText, Hash, Loader2, Search, X } from 'lucide-react'
import { useSearch } from '../hooks/useSearch'
import { docs, formatDate } from '../lib/docs'
import { parseQuery } from '../lib/search'
import Highlight, { HighlightParts } from './Highlight'

const RESULT_LIMIT = 20

// Mounted only while open — see Navbar — so every invocation starts on an
// empty query without an effect reaching in to reset one.
export default function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [lastQuery, setLastQuery] = useState('')
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const { results, loadingIndex, indexReady } = useSearch(query, true, RESULT_LIMIT)
  const terms = useMemo(() => parseQuery(query), [query])
  const trimmed = query.trim()

  // With nothing typed the palette doubles as a jump list over every document.
  const rows = useMemo(
    () =>
      trimmed
        ? results.map((result) => ({ ...result, key: result.doc.slug }))
        : docs.map((doc) => ({ doc, href: `/${doc.slug}`, key: doc.slug, heading: undefined, snippet: undefined })),
    [trimmed, results],
  )

  // Each fresh query starts from the top of its own result list. Adjusting
  // during render is the supported way to reset state on a changed input —
  // React re-runs this component before touching the DOM.
  if (lastQuery !== trimmed) {
    setLastQuery(trimmed)
    setActive(0)
  }

  // Results can shrink under the cursor when the full-text index lands, so the
  // highlighted row is clamped rather than tracked.
  const activeRow = rows.length ? Math.min(active, rows.length - 1) : 0

  useEffect(() => {
    const raf = requestAnimationFrame(() => inputRef.current?.focus())
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = overflow
    }
  }, [])

  // Keep the highlighted row visible when arrowing past the fold.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [activeRow, rows])

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive(rows.length ? (activeRow + 1) % rows.length : 0)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive(rows.length ? (activeRow - 1 + rows.length) % rows.length : 0)
    } else if (event.key === 'Enter') {
      const row = rows[activeRow]
      if (!row) return
      event.preventDefault()
      navigate(row.href)
      onClose()
    }
  }

  // Portaled to the body because the navbar that owns this state is a
  // backdrop-blurred element, and a backdrop filter makes its box the
  // containing block for fixed descendants — the overlay would be trapped
  // inside the header strip.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 px-4 pt-[10vh] backdrop-blur-sm dark:bg-slate-950/70"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[75vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search documents"
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-800">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search every document…"
            className="h-14 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            role="combobox"
            aria-expanded
            aria-controls="search-results"
            aria-activedescendant={rows[activeRow] ? `search-row-${rows[activeRow].key}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          {loadingIndex && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />}
          <button
            onClick={onClose}
            aria-label="Close search"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No document matches <span className="font-medium text-slate-700 dark:text-slate-200">{trimmed}</span>.
            {!indexReady && <span className="mt-1 block text-xs">Still loading full text…</span>}
          </div>
        ) : (
          <ul ref={listRef} id="search-results" role="listbox" className="flex-1 overflow-y-auto p-2">
            {rows.map((row, i) => (
              <li key={row.key}>
                <Link
                  id={`search-row-${row.key}`}
                  to={row.href}
                  onClick={onClose}
                  onMouseMove={() => setActive(i)}
                  data-active={i === activeRow}
                  role="option"
                  aria-selected={i === activeRow}
                  tabIndex={-1}
                  className={`block rounded-lg px-3 py-2.5 transition-colors ${
                    i === activeRow ? 'bg-slate-100 dark:bg-slate-800' : ''
                  }`}
                >
                  <div className="flex items-baseline gap-2">
                    <FileText className="h-3.5 w-3.5 shrink-0 translate-y-0.5 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 dark:text-white">
                      <Highlight text={row.doc.title} terms={terms} />
                    </span>
                    {row.doc.date && (
                      <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(row.doc.date)}
                      </span>
                    )}
                  </div>

                  {row.heading && (
                    <div className="mt-1 flex items-center gap-1 pl-5.5 text-xs text-slate-500 dark:text-slate-400">
                      <Hash className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        <Highlight text={row.heading} terms={terms} />
                      </span>
                    </div>
                  )}

                  {row.snippet ? (
                    <p className="mt-1 line-clamp-2 pl-5.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      <HighlightParts parts={row.snippet} />
                    </p>
                  ) : (
                    row.doc.description && (
                      <p className="mt-1 line-clamp-2 pl-5.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        <Highlight text={row.doc.description} terms={terms} />
                      </p>
                    )
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-2 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>
                <CornerDownLeft className="h-2.5 w-2.5" />
              </Kbd>
              open
            </span>
            <span className="flex items-center gap-1">
              <Kbd>esc</Kbd>
              close
            </span>
          </div>
          <span>
            {trimmed
              ? `${results.length}${results.length === RESULT_LIMIT ? '+' : ''} result${results.length === 1 ? '' : 's'}`
              : `${docs.length} documents`}
            {trimmed && !indexReady && ' · titles only'}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-slate-200 bg-slate-50 px-1 font-sans text-[10px] text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
      {children}
    </kbd>
  )
}
