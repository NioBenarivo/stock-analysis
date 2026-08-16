import { useRef, useState, type ComponentPropsWithoutRef } from 'react'
import { Check, Copy } from 'lucide-react'

// MDX hands `pre` a single <code className="language-x"> child. Rather than
// walking the React tree to recover the source text, read it off the DOM node.
export default function CodeBlock({ className, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const ref = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  async function copy() {
    const text = ref.current?.textContent ?? ''
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard is unavailable outside secure contexts; failing quietly is fine.
    }
  }

  return (
    <div className="not-prose group relative my-6">
      <pre
        ref={ref}
        className={`overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 ${className ?? ''}`}
        {...props}
      />
      <button
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className="absolute right-2 top-2 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 opacity-0 transition-opacity hover:text-slate-900 focus:opacity-100 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}
