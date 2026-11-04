import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)
const render = () => root.render(<StrictMode><App /></StrictMode>)

// dev-only sample data for screenshots: open /?demo (never bundled into production)
if (import.meta.env.DEV && new URLSearchParams(location.search).has('demo')) import('./dev/demo').then((m) => m.seed()).then(render)
else render()
