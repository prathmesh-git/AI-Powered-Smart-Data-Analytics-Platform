import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: 'var(--bg-card)',
          color: 'var(--text)',
          border: '1.5px solid var(--border)',
          borderRadius: '12px',
          fontSize: '14px',
          boxShadow: 'var(--shadow-md)',
        },
      }}
    />
  </React.StrictMode>
)
