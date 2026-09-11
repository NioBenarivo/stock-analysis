import { useId } from 'react'

// A text input that only accepts numbers, kept as a string so a half-typed
// value ("1.", "-", "") survives editing. `toNumber` in lib/format is what the
// callers compute with; the field itself never rounds or clamps as you type.

/** 1234567.8 → "1,234,567.8", preserving a trailing "." while it is typed. */
function group(value: string): string {
  const [int, ...rest] = value.split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return value.includes('.') ? `${grouped}.${rest.join('')}` : grouped
}

function clean(raw: string, { negative, grouped }: { negative: boolean; grouped: boolean }): string {
  const sign = negative && raw.trimStart().startsWith('-') ? '-' : ''
  // One decimal point survives; every other non-digit goes.
  const [int = '', ...rest] = raw.replace(/[^\d.]/g, '').split('.')
  const digits = rest.length > 0 ? `${int}.${rest.join('')}` : int
  return sign + (grouped ? group(digits) : digits)
}

export default function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
  error,
  grouped = false,
  negative = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  /** Sits inside the input, before the number — "Rp". */
  prefix?: string
  /** Sits inside the input, after the number — "%" or "years". */
  suffix?: string
  hint?: string
  error?: string
  /** Thousand separators as you type. For money, not for rates. */
  grouped?: boolean
  negative?: boolean
}) {
  const id = useId()

  return (
    <div>
      <label htmlFor={id} className="block text-xs text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div
        className={`mt-1.5 flex items-center rounded-lg border bg-white px-3 transition-colors focus-within:border-slate-400 dark:bg-slate-950 dark:focus-within:border-slate-500 ${
          error
            ? 'border-[#d03b3b]'
            : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        {prefix && (
          <span className="mr-1.5 shrink-0 text-sm text-slate-400 dark:text-slate-500">
            {prefix}
          </span>
        )}
        <input
          id={id}
          // `decimal` rather than `numeric`: an IDX price can carry cents, and
          // this is the keypad that offers a dot on a phone.
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(clean(event.target.value, { negative, grouped }))}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-note` : undefined}
          className="w-full bg-transparent py-2 text-sm tabular-nums text-slate-900 outline-none placeholder:text-slate-300 dark:text-white dark:placeholder:text-slate-600"
          placeholder="0"
        />
        {suffix && (
          <span className="ml-1.5 shrink-0 text-sm text-slate-400 dark:text-slate-500">
            {suffix}
          </span>
        )}
      </div>
      {(error || hint) && (
        <p
          id={`${id}-note`}
          className={`mt-1 text-xs ${error ? 'text-[#d03b3b]' : 'text-slate-400 dark:text-slate-500'}`}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
