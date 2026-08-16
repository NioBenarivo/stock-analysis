interface Props {
  label: string
  value: string
  delta?: string
}

// Deliberately NOT in the MDX registry — it demonstrates the escape hatch of
// importing a component directly inside an .mdx file.
export default function Stat({ label, value, delta }: Props) {
  return (
    <div className="not-prose flex-1 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{value}</p>
      {delta && <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">{delta}</p>}
    </div>
  )
}
