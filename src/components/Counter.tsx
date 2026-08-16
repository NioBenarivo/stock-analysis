import { useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'

interface Props {
  start?: number
  step?: number
  label?: string
}

// Exists to prove that components mounted from markdown are real React
// components with their own state, not pre-rendered HTML.
export default function Counter({ start = 0, step = 1, label = 'Count' }: Props) {
  const [count, setCount] = useState(start)

  const btn =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'

  return (
    <div className="not-prose my-6 flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex-1">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
          {count}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button className={btn} onClick={() => setCount((c) => c - step)} aria-label="Decrement">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button className={btn} onClick={() => setCount((c) => c + step)} aria-label="Increment">
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button className={btn} onClick={() => setCount(start)} aria-label="Reset">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
