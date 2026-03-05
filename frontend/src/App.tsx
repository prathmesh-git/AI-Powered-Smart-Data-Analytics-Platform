import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import HomePage         from './pages/HomePage'
import ImportPage       from './pages/ImportPage'
import FileDetailPage   from './pages/FileDetailPage'
import ChartPage        from './pages/ChartPage'
import DashboardPage    from './pages/DashboardPage'
import ViewDashboardPage from './pages/ViewDashboardPage'
import Layout           from './components/Layout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<HomePage />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="files/:id" element={<FileDetailPage />} />
        <Route path="chart" element={<ChartPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="dashboard/view/:dashboardId" element={<ViewDashboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
