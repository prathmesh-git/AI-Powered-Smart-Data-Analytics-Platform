import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

interface AuthContextType {
  user: string | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // Bootstrap: verify token on mount
  useEffect(() => {
    const saved = localStorage.getItem('token')
    const savedUser = localStorage.getItem('username')
    if (saved && savedUser) {
      setToken(saved)
      setUser(savedUser)
      axios.defaults.headers.common['Authorization'] = `Bearer ${saved}`
    }
    setLoading(false)
  }, [])

  async function login(username: string, password: string) {
    const res = await axios.post('/api/auth/login', { username, password })
    const { token: newToken, username: uname } = res.data
    setToken(newToken)
    setUser(uname)
    localStorage.setItem('token', newToken)
    localStorage.setItem('username', uname)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  async function register(username: string, email: string, password: string) {
    const res = await axios.post('/api/auth/register', { username, email, password })
    const { token: newToken, username: uname } = res.data
    setToken(newToken)
    setUser(uname)
    localStorage.setItem('token', newToken)
    localStorage.setItem('username', uname)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  function logout() {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    delete axios.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
