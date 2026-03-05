import { NavLink, useLocation } from 'react-router-dom'

const LINKS = [
  {
    to: '/',
    end: true,
    label: 'My Files',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
    ),
  },
  {
    to: '/import',
    end: false,
    label: 'Import Data',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px] flex-shrink-0">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: '/chart',
    end: false,
    label: 'AI Analytics',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    to: '/dashboard',
    end: false,
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px] flex-shrink-0">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col min-h-full transition-colors duration-200"
      style={{ borderRight: '1px solid var(--border)', background: 'var(--bg)' }}
    >
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {LINKS.map(link => {
          const isActive = link.end
            ? location.pathname === link.to
            : location.pathname === link.to || location.pathname.startsWith(link.to + '/')

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
              style={isActive
                ? {
                    background: 'linear-gradient(to right, #2563eb, #3b82f6)',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
                  }
                : {
                    color: 'var(--text-muted)',
                  }
              }
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-input)'
                  ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = ''
                  ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)'
                }
              }}
            >
              <span
                className="transition-colors"
                style={isActive ? { color: '#ffffff' } : { color: '#6366f1' }}
              >
                {link.icon}
              </span>
              <span>{link.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom divider + version */}
      <div className="p-3 pb-4">
        <div className="rounded-lg px-3 py-2.5" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Platform</p>
          <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>Smart Data Analytics</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint, var(--text-muted))' }}>v2.0</p>
        </div>
      </div>
    </aside>
  )
}
