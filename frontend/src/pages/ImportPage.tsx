import { useState, useRef, DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

type ImportSource = 'csv' | 'google_sheet' | 'sharepoint' | 'mysql' | 'postgres' | 'oracle'

const SOURCES: { id: ImportSource; label: string; desc: string; color: string; iconPath: string }[] = [
  {
    id: 'csv',
    label: 'CSV / Excel',
    desc: 'Upload local .csv, .xlsx, .xls or .tsv files',
    color: 'green',
    iconPath: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    id: 'google_sheet',
    label: 'Google Sheets',
    desc: 'Import from a public Google Sheet URL',
    color: 'blue',
    iconPath: 'M3 10h18M3 14h18M10 3v18M14 3v18M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z',
  },
  {
    id: 'sharepoint',
    label: 'SharePoint',
    desc: 'Import data from a SharePoint list URL',
    color: 'indigo',
    iconPath: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
  },
  {
    id: 'mysql',
    label: 'MySQL',
    desc: 'Connect to a MySQL or MariaDB database',
    color: 'orange',
    iconPath: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
  },
  {
    id: 'postgres',
    label: 'PostgreSQL',
    desc: 'Connect to a PostgreSQL database',
    color: 'sky',
    iconPath: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
  },
  {
    id: 'oracle',
    label: 'Oracle DB',
    desc: 'Connect to an Oracle database',
    color: 'red',
    iconPath: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
  },
]

const COLOR_CLASSES: Record<string, { card: string; badge: string; icon: string }> = {
  green:  { card: 'hover:border-emerald-500/60 hover:shadow-emerald-500/15', badge: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400', icon: '#10b981' },
  blue:   { card: 'hover:border-blue-500/60 hover:shadow-blue-500/15',       badge: 'bg-blue-500/20 border-blue-500/30 text-blue-400',         icon: '#3b82f6' },
  indigo: { card: 'hover:border-indigo-500/60 hover:shadow-indigo-500/15',   badge: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400',   icon: '#6366f1' },
  orange: { card: 'hover:border-orange-500/60 hover:shadow-orange-500/15',   badge: 'bg-orange-500/20 border-orange-500/30 text-orange-400',   icon: '#f97316' },
  sky:    { card: 'hover:border-sky-500/60 hover:shadow-sky-500/15',          badge: 'bg-sky-500/20 border-sky-500/30 text-sky-400',             icon: '#0ea5e9' },
  red:    { card: 'hover:border-red-500/60 hover:shadow-red-500/15',          badge: 'bg-red-500/20 border-red-500/30 text-red-400',             icon: '#ef4444' },
}

// ──────────────────────── CSV Upload panel ────────────────────────
function CsvUploadPanel({ onBack }: { onBack: () => void }) {
  const navigate  = useNavigate()
  const inputRef  = useRef<HTMLInputElement>(null)
  const [dragging, setDragging]   = useState(false)
  const [file, setFile]           = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)

  function handleDrop(e: DragEvent) {
    e.preventDefault(); setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) validateAndSet(dropped)
  }

  function validateAndSet(f: File) {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!['.csv', '.xlsx', '.xls', '.tsv'].includes(ext)) {
      toast.error('Only CSV, Excel (.xlsx/.xls), and TSV files are allowed'); return
    }
    if (f.size > 50 * 1024 * 1024) { toast.error('File size must be under 50 MB'); return }
    setFile(f)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true); setProgress(0)
    const formData = new FormData()
    formData.append('file', file)
    try {
      await axios.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => { if (e.total) setProgress(Math.round((e.loaded / e.total) * 100)) },
      })
      toast.success('File uploaded successfully!')
      navigate('/')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Upload failed')
      setUploading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-5 transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to sources
      </button>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={`rounded-xl p-12 text-center transition-all duration-300 border-2 border-dashed ${
          dragging ? 'scale-[1.01]' : ''} ${file ? 'cursor-default' : 'cursor-pointer'}`}
        style={{ background: 'var(--bg-input)', borderColor: dragging ? '#6366f1' : 'var(--border)' }}
      >
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.tsv" className="hidden"
          onChange={e => e.target.files?.[0] && validateAndSet(e.target.files[0])} />

        {!file ? (
          <>
            <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>Drop your file here</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>or click to browse</p>
            <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
              {['CSV', 'XLSX', 'XLS', 'TSV'].map(ext => (
                <span key={ext} className="px-3 py-1 rounded-full text-xs font-semibold border"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', borderColor: 'rgba(99,102,241,0.3)' }}>
                  .{ext.toLowerCase()}
                </span>
              ))}
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Max file size: 50 MB</p>
          </>
        ) : (
          <div className="animate-fade-in">
            <div className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>{file.name}</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</p>
            <button onClick={e => { e.stopPropagation(); setFile(null) }}
              className="text-xs underline hover:no-underline transition-all" style={{ color: '#f87171' }}>
              Remove file
            </button>
          </div>
        )}
      </div>

      {uploading && (
        <div className="mt-4 rounded-xl p-4 animate-fade-in"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between text-sm mb-2">
            <span style={{ color: 'var(--text-muted)' }}>Uploading {file?.name}...</span>
            <span className="font-semibold text-blue-400">{progress}%</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ background: 'var(--border)' }}>
            <div className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-400"
              style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {file && !uploading && (
        <button onClick={handleUpload}
          className="mt-4 w-full py-3 font-semibold text-white rounded-xl transition-all shadow-lg shadow-blue-500/30 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 flex items-center justify-center gap-2 animate-fade-in">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Upload File
        </button>
      )}
    </div>
  )
}

// ──────────────────────── URL import panel (Google Sheets / SharePoint) ────────────────────────
function UrlImportPanel({ source, onBack }: { source: 'google_sheet' | 'sharepoint'; onBack: () => void }) {
  const navigate   = useNavigate()
  const [name, setName]   = useState('')
  const [url, setUrl]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !url.trim()) return
    setLoading(true)
    try {
      await axios.post('/api/files/import-source', { source, dataset_name: name, sheet_url: url })
      toast.success('Data imported successfully!')
      navigate('/')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Import failed')
      setLoading(false)
    }
  }

  const label = source === 'google_sheet' ? 'Google Sheets' : 'SharePoint'
  const placeholder = source === 'google_sheet'
    ? 'https://docs.google.com/spreadsheets/d/...'
    : 'https://company.sharepoint.com/...'

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-5 transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to sources
      </button>

      <div className="rounded-xl p-6" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text)' }}>Import from {label}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Dataset Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              placeholder="My Dataset"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              {source === 'google_sheet' ? 'Sheet URL (must be publicly viewable)' : 'SharePoint URL'}
            </label>
            <input type="url" required value={url} onChange={e => setUrl(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onBack}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/30 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><LoadingSpinner size="sm" /> Importing...</> : 'Import Data'}
            </button>
          </div>
        </form>
      </div>

      {source === 'google_sheet' && (
        <p className="text-xs mt-3 text-center" style={{ color: 'var(--text-muted)' }}>
          Make sure your Google Sheet is shared as "Anyone with the link can view"
        </p>
      )}
    </div>
  )
}

// ──────────────────────── DB import panel ────────────────────────
function DbImportPanel({ source, onBack }: { source: 'mysql' | 'postgres' | 'oracle'; onBack: () => void }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ dataset_name: '', host: '', port: '', database: '', service: '', username: '', password: '', query: '' })
  const [loading, setLoading] = useState(false)

  const DEFAULTS: Record<string, string> = { mysql: '3306', postgres: '5432', oracle: '1521' }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/files/import-source', { source, ...form, port: form.port || DEFAULTS[source] })
      toast.success('Database imported successfully!')
      navigate('/')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Import failed')
      setLoading(false)
    }
  }

  const LABELS: Record<string, string> = { mysql: 'MySQL', postgres: 'PostgreSQL', oracle: 'Oracle DB' }

  const field = (key: keyof typeof form, label: string, opts?: { placeholder?: string; type?: string; required?: boolean }) => (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input
        type={opts?.type || 'text'}
        required={opts?.required !== false}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={opts?.placeholder || ''}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
      />
    </div>
  )

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-5 transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to sources
      </button>

      <div className="rounded-xl p-6" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text)' }}>Connect to {LABELS[source]}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {field('dataset_name', 'Dataset Name', { placeholder: 'My Dataset' })}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">{field('host', 'Host', { placeholder: 'localhost' })}</div>
            <div>{field('port', 'Port', { placeholder: DEFAULTS[source], required: false })}</div>
          </div>
          {source === 'oracle'
            ? field('service', 'Service Name', { placeholder: 'ORCL' })
            : field('database', 'Database', { placeholder: 'mydb' })}
          <div className="grid grid-cols-2 gap-3">
            {field('username', 'Username', { placeholder: 'root' })}
            {field('password', 'Password', { type: 'password', placeholder: '••••••••' })}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>SQL Query</label>
            <textarea required value={form.query} onChange={e => setForm(f => ({ ...f, query: e.target.value }))}
              rows={3} placeholder="SELECT * FROM table_name LIMIT 1000"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none font-mono"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onBack}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/30 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><LoadingSpinner size="sm" /> Connecting...</> : 'Import Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ──────────────────────── Main page ────────────────────────
export default function ImportPage() {
  const [selected, setSelected] = useState<ImportSource | null>(null)

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Import Data</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Choose a data source to get started
        </p>
      </div>

      {!selected && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {SOURCES.map(src => {
            const cls = COLOR_CLASSES[src.color]
            return (
              <button
                key={src.id}
                onClick={() => setSelected(src.id)}
                className={`rounded-xl p-5 text-left transition-all duration-200 border-2 hover:shadow-lg group ${cls.card}`}
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 border ${cls.badge}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                    style={{ color: cls.icon }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={src.iconPath} />
                  </svg>
                </div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>{src.label}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{src.desc}</p>
              </button>
            )
          })}
        </div>
      )}

      {selected === 'csv' && <CsvUploadPanel onBack={() => setSelected(null)} />}

      {(selected === 'google_sheet' || selected === 'sharepoint') && (
        <UrlImportPanel source={selected} onBack={() => setSelected(null)} />
      )}

      {(selected === 'mysql' || selected === 'postgres' || selected === 'oracle') && (
        <DbImportPanel source={selected} onBack={() => setSelected(null)} />
      )}
    </div>
  )
}
