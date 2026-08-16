import type { ReactNode } from 'react'
import { Info, Lightbulb, TriangleAlert, OctagonAlert } from 'lucide-react'

export type CalloutType = 'note' | 'tip' | 'warn' | 'danger'

const styles: Record<CalloutType, { icon: typeof Info; wrapper: string; icon_: string }> = {
  note: {
    icon: Info,
    wrapper: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40',
    icon_: 'text-blue-500 dark:text-blue-400',
  },
  tip: {
    icon: Lightbulb,
    wrapper: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40',
    icon_: 'text-emerald-500 dark:text-emerald-400',
  },
  warn: {
    icon: TriangleAlert,
    wrapper: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40',
    icon_: 'text-amber-500 dark:text-amber-400',
  },
  danger: {
    icon: OctagonAlert,
    wrapper: 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40',
    icon_: 'text-rose-500 dark:text-rose-400',
  },
}

interface Props {
  type?: CalloutType
  title?: string
  children: ReactNode
}

export default function Callout({ type = 'note', title, children }: Props) {
  const { icon: Icon, wrapper, icon_ } = styles[type] ?? styles.note

  return (
    <div className={`not-prose my-6 flex gap-3 rounded-xl border p-4 ${wrapper}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${icon_}`} />
      <div className="min-w-0 flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {title && (
          <p className="mb-1 font-semibold text-slate-900 dark:text-white">{title}</p>
        )}
        <div className="[&>*+*]:mt-2 [&_a]:underline [&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] dark:[&_code]:bg-white/10">
          {children}
        </div>
      </div>
    </div>
  )
}
