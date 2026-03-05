import { useRef } from 'react'
import { Bar, Line, Pie, Doughnut, Scatter } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
)

interface ChartSpec {
  type: string
  data: any
  options?: any
  title?: string
}

export default function ChartRenderer({ chart, className = '', showDownload = false }: { chart: ChartSpec, className?: string, showDownload?: boolean }) {
  const chartRef = useRef<any>(null)

  if (!chart || !chart.data) return (
    <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
      No chart data available
    </div>
  )

  function handleDownload() {
    const instance = chartRef.current
    if (!instance) return
    const canvas: HTMLCanvasElement = instance.canvas
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${chart.title || 'chart'}.png`
    a.click()
  }

  const opts = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#9ca3af', font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: '#1e1b4b',
        titleColor: '#e0e7ff',
        bodyColor: '#c7d2fe',
        borderColor: '#4f46e5',
        borderWidth: 1,
        cornerRadius: 8,
      },
      ...(chart.options?.plugins || {}),
    },
    scales: chart.type !== 'pie' && chart.type !== 'doughnut' && chart.type !== 'radar' ? {
      x: {
        ticks: { color: '#6b7280', font: { size: 11 } },
        grid: { color: 'rgba(107,114,128,0.15)' },
        ...(chart.options?.scales?.x || {}),
      },
      y: {
        ticks: { color: '#6b7280', font: { size: 11 } },
        grid: { color: 'rgba(107,114,128,0.15)' },
        ...(chart.options?.scales?.y || {}),
      },
    } : undefined,
    ...(chart.options || {}),
  }

  const props = { data: chart.data, options: opts, ref: chartRef }

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full">
        {chart.type === 'bar'      && <Bar      {...props} />}
        {chart.type === 'line'     && <Line     {...props} />}
        {chart.type === 'pie'      && <Pie      {...props} />}
        {chart.type === 'doughnut' && <Doughnut {...props} />}
        {chart.type === 'scatter'  && <Scatter  {...props} />}
        {!['bar','line','pie','doughnut','scatter'].includes(chart.type) && <Bar {...props} />}
      </div>
      {showDownload && (
        <div className="flex justify-end mt-2">
          <button
            onClick={handleDownload}
            className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all hover:bg-gray-800/50"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PNG
          </button>
        </div>
      )}
    </div>
  )
}

