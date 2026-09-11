import { useMemo } from 'react'
import { markTerms, type SnippetPart } from '../lib/search'

const MARK = 'rounded bg-amber-200/70 text-slate-900 dark:bg-amber-400/25 dark:text-amber-100'

function render(parts: SnippetPart[]) {
  return parts.map((part, i) =>
    part.match ? (
      <mark key={i} className={MARK}>
        {part.text}
      </mark>
    ) : (
      <span key={i}>{part.text}</span>
    ),
  )
}

/** Marks the query terms inside an already-extracted snippet. */
export function HighlightParts({ parts }: { parts: SnippetPart[] }) {
  return <>{render(parts)}</>
}

/** Marks the query terms inside arbitrary text, such as a title. */
export default function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const parts = useMemo(() => markTerms(text, terms), [text, terms])
  return <>{render(parts)}</>
}
