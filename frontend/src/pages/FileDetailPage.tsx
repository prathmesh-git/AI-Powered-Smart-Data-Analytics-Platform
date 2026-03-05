import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

interface FileInfo {
  _id: string
  name: string
  originalName: string
  ext: string
  size: number
  createdAt: string
}

export default function FileDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [file, setFile]       = useState<FileInfo | null>(null)
  const [header, setHeader]   = useState<string[]>([])
  const [rows, setRows]       = useState<any[][]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(`/api/files/${id}`)
        setFile(res.data.file)
        setHeader(res.data.header)
        setRows(res.data.rows)
        setTotal(res.data.totalRows)
      } catch (err: any) {
        toast.error(err?.response?.data?.error || 'Failed to load file')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" label="Loading file data…" />
    </div>
  )

  if (!file) return null

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-200 text-sm mb-2 flex items-center gap-1">
            ← Back to Files
          </button>
          <h1 className="text-2xl font-bold text-white">{file.name}</h1>
          <p className="text-gray-400 text-sm mt-1">{file.originalName} · {header.length} columns · {total.toLocaleString()} rows</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/chart?fileId=${id}`)}
            className="btn-primary flex items-center gap-2"
          >

            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Analyze with AI
          </button>
          <button
            onClick={() => navigate(`/dashboard?fileId=${id}`)}
            className="btn-secondary flex items-center gap-2"
          >

            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="12" width="4" height="8" />
              <rect x="9.5" y="7" width="4" height="13" />
              <rect x="16" y="3" width="4" height="17" />
            </svg>
            Create Dashboard
          </button>
        </div>
      </div>

      {/* Column chips */}
      <div className="glass rounded-2xl p-4 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Columns ({header.length})</p>
        <div className="flex flex-wrap gap-2">
          {header.map((col, i) => (
            <span key={i} className="px-3 py-1 rounded-full bg-brand-900/60 text-brand-200 text-xs font-medium border border-brand-700/40">
              {col}
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">Data Preview</h2>
          <span className="text-xs text-gray-500">Showing {rows.length} of {total.toLocaleString()} rows</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                {header.map((col, i) => <th key={i}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  <td className="text-center text-gray-600 text-xs">{ri + 1}</td>
                  {header.map((_, ci) => (
                    <td key={ci} className="max-w-[200px] truncate" title={String(row[ci] ?? '')}>
                      {row[ci] !== undefined && row[ci] !== null && row[ci] !== '' ? String(row[ci]) : (
                        <span className="text-gray-600 italic text-xs">null</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > rows.length && (
          <div className="px-5 py-3 border-t border-gray-800 text-xs text-gray-500 text-center">
            + {(total - rows.length).toLocaleString()} more rows not shown
          </div>
        )}
      </div>
    </div>
  )
}
