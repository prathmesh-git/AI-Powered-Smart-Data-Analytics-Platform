import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden transition-colors duration-200" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto transition-colors duration-200" style={{ background: 'var(--bg-card)' }}>
          <div className="min-h-full p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
