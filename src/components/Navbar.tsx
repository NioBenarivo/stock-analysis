import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { BookText, Search, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import type { Theme } from '../hooks/useTheme'
import SearchDialog from './SearchDialog'

const themeOptions: { value: Theme; icon: typeof Sun }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
]

// Mac reads ⌘K, everything else Ctrl K. Checked once — it only decides a label.
const isApple = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

export default function Navbar() {
  const { theme, setTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      const palette = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)
      // `/` is the other conventional opener, but only when it isn't being
      // typed into something — the library filter owns it there.
      const slash = event.key === '/' && !event.metaKey && !event.ctrlKey && !isTypingTarget(event.target)
      if (!palette && !slash) return
      event.preventDefault()
      setSearchOpen(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-10">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900 dark:text-white"
        >
          <BookText className="h-4 w-4" />
          Markdown Reader
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search documents"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-slate-700 dark:hover:text-slate-300"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden rounded border border-slate-200 bg-white px-1 font-sans text-[10px] text-slate-400 sm:inline dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
              {isApple ? '⌘' : 'Ctrl '}K
            </kbd>
          </button>

          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`
              }
            >
              Library
            </NavLink>
          </nav>

          <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
            {themeOptions.map(({ value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                title={value.charAt(0).toUpperCase() + value.slice(1)}
                className={`rounded-md p-1.5 transition-colors ${
                  theme === value
                    ? 'bg-white text-slate-700 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
    </header>
  )
}
