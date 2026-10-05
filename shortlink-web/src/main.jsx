import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Dark mode follows the OS setting via the .dark class (no manual toggle).
if (typeof window.matchMedia === 'function') {
  const scheme = window.matchMedia('(prefers-color-scheme: dark)')
  const apply = () => document.documentElement.classList.toggle('dark', scheme.matches)
  apply()
  scheme.addEventListener?.('change', apply)
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
