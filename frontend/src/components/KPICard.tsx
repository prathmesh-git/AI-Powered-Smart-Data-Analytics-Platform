interface KPI {
  label: string
  value: string | number
  icon?: string
  color?: string
  change?: string
}

const colorMap: Record<string, string> = {
  blue:   'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  green:  'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
  purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
  pink:   'from-pink-500/20 to-pink-600/10 border-pink-500/30',
  red:    'from-red-500/20 to-red-600/10 border-red-500/30',
}

function KPIIcon({ name }: { name?: string }) {
  const cls = 'w-5 h-5'
  switch (name) {
    case 'database':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5" />
          <path d="M3 12c0 1.657 4.03 3 9 3s9-1.343 9-3" />
        </svg>
      )
    case 'trending-up':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      )
    case 'bar-chart':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <rect x="3" y="12" width="4" height="8" />
          <rect x="9.5" y="7" width="4" height="13" />
          <rect x="16" y="3" width="4" height="17" />
        </svg>
      )
    case 'tag':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
          <circle cx="7" cy="7" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'users':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      )
    case 'dollar':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      )
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
  }
}

export default function KPICard({ kpi }: { kpi: KPI }) {
  const gradient = colorMap[kpi.color || 'blue'] || colorMap.blue

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br ${gradient} border glass animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{kpi.label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text)' }}>{kpi.value}</p>
          {kpi.change && (
            <span className={`text-xs mt-1 inline-block ${kpi.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
              {kpi.change}
            </span>
          )}
        </div>
        <div className="ml-3 opacity-70" style={{ color: 'var(--text)' }}>
          <KPIIcon name={kpi.icon} />
        </div>
      </div>
    </div>
  )
}
