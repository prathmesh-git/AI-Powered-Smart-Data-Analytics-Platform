import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import KPICard from '../components/KPICard'
import ChartRenderer from '../components/ChartRenderer'
import LoadingSpinner from '../components/LoadingSpinner'

interface Dashboard {
  dashboardId: string
  filename: string
  template: string
  dashboardType: string
  totalRecords: number
  kpis: any[]
  graphs: any[]
  allColumns: string[]
  dataframeSample: { columns: string[]; rows: any[][] }
  fileId?: string
}

export default function ViewDashboardPage() {
  const { dashboardId } = useParams<{ dashboardId: string }>()
  const navigate = useNavigate()

  const [dash, setDash]   = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]     = useState<'charts' | 'data'>('charts')

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(`/api/dashboard/${dashboardId}`)
        setDash(res.data.dashboard)
      } catch (err: any) {
        toast.error(err?.response?.data?.error || 'Dashboard not found')
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dashboardId])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" label="Loading dashboard…" />
    </div>
  )

  if (!dash) return null

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-200 text-sm mb-2 flex items-center gap-1">
            ← Back to Dashboards
          </button>
          <h1 className="text-2xl font-bold page-title">{dash.filename}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-900 text-brand-300 border border-brand-700/50 capitalize">{dash.template}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 capitalize">{dash.dashboardType}</span>
            <span className="text-xs text-gray-500">{dash.totalRecords?.toLocaleString()} records</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/chart?fileId=${dash.fileId || dash.dashboardId}`)} className="btn-secondary text-sm">
Ask AI
          </button>
          <button onClick={() => window.print()} className="btn-secondary text-sm">
Print
          </button>
          <a
            href={`/api/dashboard/${dashboardId}`}
            download={`${dash.filename}-dashboard.json`}
            className="btn-ghost text-sm"
            title="Export dashboard as JSON"
          >
Export
          </a>
        </div>
      </div>

       {/* KPI Cards */}
      {dash.kpis?.length > 0 && (
        <div className="mb-5 py-4 flex gap-5 items-stretch overflow-x-auto">
             {dash.kpis.map((kpi, i) => <KPICard key={i} kpi={kpi} />)}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 glass rounded-xl p-1 w-fit">
        {(['charts', 'data'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize
              ${tab === t ? 'bg-indigo-600 text-white' : 'hover:opacity-80'}`}
          style={tab !== t ? { color: 'var(--text-muted)' } : {}}
          >
            {t === 'charts' ? 'Charts' : 'Data'}
          </button>
        ))}
      </div>

      {/* Charts tab */}
      {tab === 'charts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {dash.graphs?.length > 0 ? (
            dash.graphs.map((graph, i) => (
              <div key={graph.id || i} className="glass rounded-2xl p-4 animate-fade-in">
            <h3 className="text-sm font-semibold mb-3 truncate page-title">{graph.title || `Chart ${i + 1}`}</h3>
                <ChartRenderer chart={{ ...graph, title: graph.title }} showDownload />
              </div>
            ))
          ) : (
            <div className="col-span-3 glass rounded-2xl p-12 text-center text-gray-500">
              No charts generated
            </div>
          )}
        </div>
      )}

      {/* Data tab */}
      {tab === 'data' && dash.dataframeSample && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="font-semibold page-title">Data Sample</h2>
            <span className="text-xs text-gray-500">
              {dash.allColumns?.length} columns · {dash.totalRecords?.toLocaleString()} total rows
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  {(dash.dataframeSample.columns || []).map((col, i) => (
                    <th key={i}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(dash.dataframeSample.rows || []).slice(0, 10).map((row: any, ri: number) => (
                  <tr key={ri}>
                    {(dash.dataframeSample.columns || []).map((col, ci) => (
                      <td key={ci} className="max-w-[160px] truncate">
                        {typeof row === 'object' && row !== null
                          ? String(row[col] ?? row[ci] ?? '')
                          : String(row[ci] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
