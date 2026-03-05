import { useEffect, useState, useRef, FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import ChartRenderer from '../components/ChartRenderer'
import LoadingSpinner from '../components/LoadingSpinner'

interface DataFile { _id: string; name: string; ext: string }
interface Message  { role: 'user' | 'ai'; content: string; chart?: any; ts: number }

const SUG_ICONS: Record<string, string> = {
  trend:    'arrow-up',
  top:      'trophy',
  compar:   'scale',
  distribut:'chart',
  total:    'hash',
  average:  'sigma',
  categor:  'folder',
  correlat: 'link',
  outlier:  'alert',
  revenue:  'currency',
  sales:    'currency',
  cost:     'currency',
}

function getSuggestionIcon(text: string): string {
  const t = text.toLowerCase()
  for (const [key] of Object.entries(SUG_ICONS)) {
    if (t.includes(key)) return key
  }
  return 'default'
}

const ICON_SVG: Record<string, JSX.Element> = {
  'arrow-up':  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>,
  'trophy':    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M2 4a2 2 0 00-2 2v3c0 1.5 1.5 3 3 3h.09A5.5 5.5 0 0010 16.05 5.5 5.5 0 0014.91 12H15c1.5 0 3-1.5 3-3V6a2 2 0 00-2-2H2zm6 8a3.5 3.5 0 01-3.5-3.5v-1h7v1A3.5 3.5 0 018 12z" /></svg>,
  'chart':     <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>,
  'default':   <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>,
}

export default function ChartPage() {
  const [searchParams] = useSearchParams()
  const initialFileId = searchParams.get('fileId') || ''

  const [files, setFiles]             = useState<DataFile[]>([])
  const [selectedFile, setSelected]   = useState(initialFileId)
  const [mode, setMode]               = useState<'ai' | 'lite'>('ai')
  const [question, setQuestion]       = useState('')
  const [messages, setMessages]       = useState<Message[]>([])
  const [loading, setLoading]         = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [sugLoading, setSugLoading]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    axios.get('/api/files').then(r => setFiles(r.data.files || []))
  }, [])

  useEffect(() => {
    if (!selectedFile) return
    setSugLoading(true)
    setSuggestions([])
    axios.get('/api/suggestions?fileId=' + selectedFile)
      .then(r => setSuggestions(r.data.questions || []))
      .catch(() => {})
      .finally(() => setSugLoading(false))
  }, [selectedFile])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleAsk(q?: string) {
    const text = (q || question).trim()
    if (!text) { toast.error('Please enter a question'); return }
    if (!selectedFile) { toast.error('Please select a file first'); return }

    setMessages(prev => [...prev, { role: 'user', content: text, ts: Date.now() }])
    setQuestion('')
    setLoading(true)

    try {
      if (mode === 'ai') {
        const res = await axios.post('/api/charts/ai/' + selectedFile, { question: text })
        setMessages(prev => [...prev, {
          role: 'ai',
          content: res.data.insight || 'Here is your chart:',
          chart: res.data.chart,
          ts: Date.now(),
        }])
      } else {
        const res = await axios.post('/api/charts/lite', { fileId: selectedFile, question: text })
        setMessages(prev => [...prev, {
          role: 'ai',
          content: res.data.explanation || 'Analysis complete.',
          chart: res.data.chart,
          ts: Date.now(),
        }])
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Something went wrong'
      setMessages(prev => [...prev, { role: 'ai', content: '! ' + msg, ts: Date.now() }])
    } finally {
      setLoading(false)
    }
  }

  function handleForm(e: FormEvent) { e.preventDefault(); handleAsk() }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold page-title">AI Analytics</h1>
          <p className="text-sm page-subtitle">Ask questions about your data in natural language</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Chat
          </button>
        )}
      </div>

      <div className="flex gap-4 flex-1 min-h-0">

        {/* Left panel */}
        <div className="w-72 flex flex-col gap-4 flex-shrink-0">

          {/* File selector */}
          <div className="glass rounded-2xl p-4">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Dataset
            </label>
            <select
              value={selectedFile}
              onChange={e => setSelected(e.target.value)}
              className="select-field"
            >
              <option value="">-- Select a file --</option>
              {files.map(f => (
                <option key={f._id} value={f._id}>{f.name}.{f.ext}</option>
              ))}
            </select>
          </div>

          {/* Mode toggle */}
          <div className="glass rounded-2xl p-4">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Analysis Mode
            </label>
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1.5px solid var(--border)' }}>
              <button
                onClick={() => setMode('ai')}
                className="flex-1 py-2 text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
                style={mode === 'ai'
                  ? { background: '#4f46e5', color: '#fff' }
                  : { background: 'var(--bg-input)', color: 'var(--text-muted)' }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
                </svg>
                AI Mode
              </button>
              <button
                onClick={() => setMode('lite')}
                className="flex-1 py-2 text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
                style={mode === 'lite'
                  ? { background: '#4f46e5', color: '#fff' }
                  : { background: 'var(--bg-input)', color: 'var(--text-muted)' }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Lite Mode
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              {mode === 'ai' ? 'Uses OpenAI GPT to generate smart charts' : 'Internal analysis, no API key needed'}
            </p>
          </div>

          {/* Suggested questions */}
          <div className="glass rounded-2xl p-4 flex-1 overflow-y-auto min-h-0">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              Suggested Questions
              {sugLoading && (
                <span className="inline-block w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              )}
            </label>
            {suggestions.length === 0 && !sugLoading ? (
              <div className="text-center py-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-faint)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                  Select a file to get AI-generated questions
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {suggestions.map((q, i) => {
                  const iconKey = getSuggestionIcon(q)
                  return (
                    <button
                      key={i}
                      onClick={() => handleAsk(q)}
                      disabled={!selectedFile || loading}
                      className="w-full group text-left rounded-xl transition-all disabled:opacity-40 overflow-hidden"
                      style={{ border: '1px solid var(--border)', background: 'var(--bg-input)' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <div className="flex items-start gap-2.5 px-3 py-2.5">
                        <span className="flex-shrink-0 mt-0.5" style={{ color: '#6366f1' }}>
                          {ICON_SVG[iconKey] || ICON_SVG['default']}
                        </span>
                        <span className="text-xs leading-relaxed transition-colors" style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          {q}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto glass rounded-2xl p-4 mb-3 min-h-0">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4" style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-8 h-8" style={{ color: '#6366f1' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold mb-1 page-title">Ready to Analyze</h2>
                <p className="text-sm max-w-xs page-subtitle">
                  Select a file, then ask a question or click a suggestion on the left
                </p>
                {!selectedFile && (
                  <div className="mt-6 grid grid-cols-2 gap-2 max-w-sm w-full">
                    {['Show data summary', 'What are key metrics?', 'Analyze trends', 'Show distribution'].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setQuestion(q)}
                        className="text-xs rounded-lg px-3 py-2 transition-all text-left"
                        style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={'animate-fade-in ' + (msg.role === 'user' ? 'flex justify-end' : 'flex justify-start')}>
                    {msg.role === 'ai' ? (
                      <div className="flex items-start gap-2.5 max-w-[90%]">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                             style={{ background: '#4f46e5' }}>
                          <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1z" />
                          </svg>
                        </div>
                        <div className="chat-ai flex-1">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          {msg.chart && (
                            <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                              <ChartRenderer chart={msg.chart} />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2.5 max-w-[80%]">
                        <div className="chat-user">
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                             style={{ background: 'var(--border)' }}>
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: 'var(--text-muted)' }}>
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#4f46e5' }}>
                        <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1z" />
                        </svg>
                      </div>
                      <div className="chat-ai">
                        <LoadingSpinner size="sm" label="Analyzing..." />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input bar */}
          <form onSubmit={handleForm} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder={selectedFile ? 'Ask anything about your data...' : 'Select a file first'}
              disabled={!selectedFile || loading}
              className="input-field flex-1"
            />
            <button
              type="submit"
              disabled={!selectedFile || loading || !question.trim()}
              className="btn-primary px-5 flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}