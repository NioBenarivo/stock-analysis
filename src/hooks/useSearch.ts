import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { loadSearchIndex, searchDocs, type PreparedIndex, type SearchResult } from '../lib/search'

interface UseSearch {
  results: SearchResult[]
  /** False until the full-text chunk lands; results are frontmatter-only. */
  indexReady: boolean
  /** True only while the very first fetch of the index is in flight. */
  loadingIndex: boolean
}

/**
 * Shared by the ⌘K palette and the library filter. Both render results the
 * instant a key is pressed — matching frontmatter, which is already in memory —
 * and re-run against the body text as soon as the index chunk arrives.
 */
export function useSearch(query: string, active = true, limit?: number): UseSearch {
  const [index, setIndex] = useState<PreparedIndex | null>(null)

  const wanted = active && query.trim().length > 0
  // Derived rather than stored: wanting the index and not having it yet *is*
  // the loading state, and one fewer setState keeps the keystroke path short.
  const loadingIndex = wanted && index === null

  useEffect(() => {
    if (!wanted || index) return
    let cancelled = false
    loadSearchIndex().then((prepared) => {
      if (!cancelled) setIndex(prepared)
    })
    return () => {
      cancelled = true
    }
  }, [wanted, index])

  // Typing stays responsive while a scan of ~3MB of prose runs behind it.
  const deferred = useDeferredValue(query)

  const results = useMemo(
    () => (active ? searchDocs(deferred, index, limit) : []),
    [deferred, index, active, limit],
  )

  return { results, indexReady: index !== null, loadingIndex }
}
