import { NavLink } from 'react-router-dom'
import { LayoutGrid, Table2 } from 'lucide-react'

const links = [
  { to: '/', label: 'Analyses', icon: LayoutGrid },
  { to: '/metrics', label: 'Key Metrics', icon: Table2 },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-10 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900 tracking-tight">Stock Research</span>
        <nav className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
