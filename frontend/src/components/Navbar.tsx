import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { isDark, toggle } = useTheme()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between h-14 px-5 transition-colors duration-200"
         style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
          Smart Data Analytics
        </span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-2">

        {/* + New Data */}
        <Link to="/import">
          <button className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/30">
            + New Data
          </button>
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={isDark ? 'Switch to Light' : 'Switch to Dark'}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
          style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
        >
          {isDark ? (
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>

        {/* User pill */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors duration-200"
             style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-500/30">
            {user?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-xs font-semibold hidden sm:block" style={{ color: 'var(--text)' }}>{user}</span>
          <button
            onClick={handleLogout}
            title="Logout"
            className="hover:text-red-500 transition-colors ml-1"
            style={{ color: 'var(--text-faint)' }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

      </div>
    </nav>
  )
}
