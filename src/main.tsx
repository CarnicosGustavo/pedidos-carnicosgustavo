import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AdminApp } from './admin/AdminApp'

function isAdminPath() {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
}

function Root() {
  return isAdminPath() ? <AdminApp /> : <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
