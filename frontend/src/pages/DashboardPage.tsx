import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

interface DataFile { _id: string; name: string; ext: string; originalName: string }

const TEMPLATES = [
  { key: 'executive',    label: 'Executive',    color: 'blue',   desc: '4 KPIs & 6 summary charts',        kpis: 4,  charts: 6  },
  { key: 'sales',        label: 'Sales',         color: 'green',  desc: 'Revenue, products & conversions',  kpis: 5,  charts: 7  },
  { key: 'marketing',    label: 'Marketing',     color: 'pink',   desc: 'Campaigns, reach & engagement',    kpis: 5,  charts: 7  },
  { key: 'operations',   label: 'Operations',    color: 'orange', desc: 'Efficiency, cost & performance',   kpis: 6,  charts: 8  },
  { key: 'hr',           label: 'HR',            color: 'purple', desc: 'Headcount, retention & hiring',    kpis: 5,  charts: 6  },
  { key: 'finance',      label: 'Finance',       color: 'green',  desc: 'P&L, cash flow & budgeting',       kpis: 6,  charts: 8  },
  { key: 'modern',       label: 'Modern',        color: 'blue',   desc: '6 KPIs & 9 visual charts',         kpis: 6,  charts: 9  },
  { key: 'analytics',    label: 'Analytics',     color: 'indigo', desc: 'Deep-dive data exploration',       kpis: 4,  charts: 10 },
  { key: 'performance',  label: 'Performance',   color: 'blue',   desc: 'Benchmarks & goal tracking',       kpis: 6,  charts: 8  },
  { key: 'retail',       label: 'Retail',        color: 'orange', desc: 'Sales, inventory & customers',     kpis: 5,  charts: 7  },
  { key: 'logistics',    label: 'Logistics',     color: 'blue',   desc: 'Shipping, delivery & routes',      kpis: 4,  charts: 6  },
  { key: 'healthcare',   label: 'Healthcare',    color: 'green',  desc: 'Patients, outcomes & costs',       kpis: 5,  charts: 7  },
  { key: 'education',    label: 'Education',     color: 'purple', desc: 'Enrolment, grades & performance',  kpis: 4,  charts: 6  },
  { key: 'tech',         label: 'Tech / SaaS',   color: 'blue',   desc: 'Users, churn & feature usage',     kpis: 6,  charts: 9  },
  { key: 'social',       label: 'Social Media',  color: 'pink',   desc: 'Followers, reach & engagement',    kpis: 5,  charts: 7  },
  { key: 'survey',       label: 'Survey',        color: 'indigo', desc: 'Responses, ratings & feedback',    kpis: 4,  charts: 6  },
  { key: 'supply_chain', label: 'Supply Chain',  color: 'orange', desc: 'Vendors, stock & lead times',      kpis: 5,  charts: 7  },
  { key: 'product',      label: 'Product',       color: 'blue',   desc: 'Releases, bugs & user stories',    kpis: 5,  charts: 7  },
  { key: 'real_estate',  label: 'Real Estate',   color: 'green',  desc: 'Listings, prices & trends',        kpis: 4,  charts: 6  },
  { key: 'custom',       label: 'Custom',        color: 'purple', desc: 'Auto-detect best layout',          kpis: 6,  charts: 6  },
]

const colorBadge: Record<string, string> = {
  blue:   'bg-blue-500/20 text-blue-400',
  green:  'bg-emerald-500/20 text-emerald-400',
  purple: 'bg-purple-500/20 text-purple-400',
  orange: 'bg-orange-500/20 text-orange-400',
  pink:   'bg-pink-500/20 text-pink-400',
  indigo: 'bg-indigo-500/20 text-indigo-400',
}

export default function DashboardPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [files, setFiles]           = useState<DataFile[]>([])
  const [fileId, setFileId]         = useState(searchParams.get('fileId') || '')
  const [template, setTemplate]     = useState('executive')
  const [dashType, setDashType]     = useState<'manual' | 'ai'>('manual')
  const [creating, setCreating]     = useState(false)
  const [pastDashes, setPastDashes] = useState<any[]>([])

  useEffect(() => {
    axios.get('/api/files').then(r => setFiles(r.data.files || []))
    axios.get('/api/dashboard').then(r => setPastDashes(r.data.dashboards || [])).catch(() => {})
  }, [])

  async function handleCreate() {
    if (!fileId) { toast.error('Please select a file first'); return }
    const tpl = TEMPLATES.find(t => t.key === template) || TEMPLATES[0]
    setCreating(true)
    toast.loading('Generating dashboard...', { id: 'dash' })
    try {
      const res = await axios.post('/api/dashboard/create', {
        fileId,
        dashboardType: dashType,
        template,
        kpiCount: tpl.kpis,
        chartCount: tpl.charts,
      })
      toast.success('Dashboard created!', { id: 'dash' })
      navigate(`/dashboard/view/${res.data.dashboardId}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Dashboard creation failed', { id: 'dash' })
      setCreating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold page-title">Create Dashboard</h1>
        <p className="page-subtitle mt-1">Generate auto-built KPI cards and charts from your data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* File selection */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>1. Choose Dataset</h2>
          <select
            value={fileId}
            onChange={e => setFileId(e.target.value)}
            className="select-field"
          >
            <option value="">-- Select a file --</option>
            {files.map(f => (
              <option key={f._id} value={f._id}>{f.name}.{f.ext}</option>
            ))}
          </select>
        </div>

        {/* Dashboard type */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>2. Dashboard Type</h2>
          <div className="flex gap-3">
            {(['manual', 'ai'] as const).map(t => (
              <button
                key={t}
                onClick={() => setDashType(t)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all
                  ${dashType === t
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'border hover:border-indigo-400/40'}`}
                style={dashType !== t ? { background: 'var(--bg-input)', color: 'var(--text-muted)', borderColor: 'var(--border)' } : {}}
              >
                {t === 'ai' ? 'AI Smart' : 'Standard'}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {dashType === 'ai' ? 'AI selects the best chart types for your data' : 'Standard auto-generated charts based on columns'}
          </p>
        </div>
      </div>

      {/* Template selection */}
      <div className="glass rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>
          3. Choose Template
          <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>({TEMPLATES.length} options)</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {TEMPLATES.map(t => (
            <button
              key={t.key}
              onClick={() => setTemplate(t.key)}
              className={`p-3.5 rounded-xl border text-left transition-all group
                ${template === t.key
                  ? 'border-indigo-500 shadow-lg'
                  : 'hover:border-indigo-400/50'}`}
              style={{
                background: template === t.key ? 'rgba(79,70,229,0.12)' : 'var(--bg-input)',
                borderColor: template === t.key ? '#6366f1' : 'var(--border)',
              }}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mb-1.5 ${colorBadge[t.color] || colorBadge.blue}`}>
                {t.label.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-sm font-semibold leading-tight page-title">{t.label}</div>
              <div className="text-xs leading-tight mt-0.5 page-subtitle">{t.desc}</div>
              <div className={`flex gap-2 mt-2 text-[10px] font-medium ${template === t.key ? 'text-indigo-300' : 'text-gray-600 group-hover:text-gray-500'}`}>
                <span>{t.kpis} KPIs</span>
                <span>·</span>
                <span>{t.charts} Charts</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Create button */}
      <button
        onClick={handleCreate}
        disabled={!fileId || creating}
        className="btn-primary w-full py-4 text-base flex items-center justify-center gap-3"
      >
        {creating ? (
          <>
            <LoadingSpinner size="sm" />
            Generating Dashboard...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Dashboard
          </>
        )}
      </button>

      {/* Past dashboards */}
      {pastDashes.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4 page-title">Recent Dashboards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pastDashes.slice(0, 6).map(d => (
              <button
                key={d.dashboardId}
                onClick={() => navigate(`/dashboard/view/${d.dashboardId}`)}
                className="glass rounded-xl p-4 text-left hover:border-brand-500/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="3" y="12" width="4" height="8" />
                      <rect x="9.5" y="7" width="4" height="13" />
                      <rect x="16" y="3" width="4" height="17" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold page-title">{d.filename}</p>
                    <p className="text-xs page-subtitle">{d.template} · {d.dashboardType} · {d.totalRecords?.toLocaleString() || '?'} rows</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
