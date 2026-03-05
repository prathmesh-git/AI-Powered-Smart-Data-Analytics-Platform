import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

interface DataFile {
  _id: string
  name: string
  originalName: string
  ext: string
  size: number
  createdAt: string
}

const EXT_COLOR: Record<string, string> = {
  csv:  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  xlsx: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  xls:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  tsv:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

function formatSize(bytes: number) {
  if (!bytes) return '--'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [files, setFiles]       = useState<DataFile[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  async function fetchFiles() {
    try {
      const res = await axios.get('/api/files')
      setFiles(res.data.files || [])
    } catch {
      toast.error('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFiles() }, [])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await axios.delete(`/api/files/${id}`)
      setFiles(prev => prev.filter(f => f._id !== id))
      toast.success('File deleted')
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.originalName.toLowerCase().includes(search.toLowerCase())
  )

  const csvCount   = files.filter(f => f.ext === 'csv').length
  const excelCount = files.filter(f => ['xlsx', 'xls'].includes(f.ext)).length
  const totalSize  = formatSize(files.reduce((acc, f) => acc + (f.size || 0), 0))

  const stats = [
    { label: 'Total Files', value: files.length, color: 'text-blue-500' },
    { label: 'CSV Files',   value: csvCount,      color: 'text-emerald-500' },
    { label: 'Excel Files', value: excelCount,    color: 'text-indigo-400' },
    { label: 'Total Size',  value: totalSize,     color: 'text-purple-400' },
  ]

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">

      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Welcome back, <span className="text-blue-500">{user}</span>
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Manage and analyze your data files
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map(s => (
          <div key={s.label} className="rounded-lg p-4 shadow-lg transition-colors duration-200"
               style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg p-3 mb-5 flex items-center gap-3 shadow-xl transition-colors duration-200"
           style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
        <div className="flex-1 relative">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }}>
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>
        <Link to="/import">
          <button className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all shadow-lg shadow-blue-500/30 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 whitespace-nowrap">
            + Upload File
          </button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner size="lg" label="Loading your files..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg p-14 text-center shadow-xl transition-colors duration-200"
             style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
          <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-4"
               style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>
            {search ? 'No files match your search' : 'No files yet'}
          </h3>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            {search ? 'Try a different search term' : 'Upload your first CSV or Excel file to get started'}
          </p>
          {!search && (
            <Link to="/import">
              <button className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all shadow-lg shadow-blue-500/30 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400">
                + Import your first file
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(file => (
            <div key={file._id}
                 className="group rounded-lg p-4 shadow-lg hover:border-blue-500/40 transition-all duration-200"
                 style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                       style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }} title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{file.originalName}</p>
                  </div>
                </div>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold border uppercase flex-shrink-0 ${EXT_COLOR[file.ext] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                  {file.ext}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  {formatDate(file.createdAt)}
                </span>
                {file.size > 0 && (
                  <span className="flex items-center gap-1">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    {formatSize(file.size)}
                  </span>
                )}
              </div>

              <div className="mb-3" style={{ borderTop: '1px solid var(--border)' }} />

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/files/${file._id}`)}
                  className="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-200"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  View
                </button>
                <button
                  onClick={() => navigate(`/chart?fileId=${file._id}`)}
                  className="flex-1 py-1.5 text-xs font-semibold text-white rounded-lg transition-all shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
                >
                  Analyze
                </button>
                <button
                  onClick={() => navigate(`/dashboard?fileId=${file._id}`)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                  title="Dashboard"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(file._id, file.name)}
                  disabled={deleting === file._id}
                  className="px-2.5 py-1.5 text-xs rounded-lg transition-all duration-200 flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                  title="Delete"
                >
                  {deleting === file._id ? (
                    <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
