import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import type { Role } from './types'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Sales from './pages/Sales'
import Alerts from './pages/Alerts'
import AuditLogs from './pages/AuditLogs'

function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.role)) return <Navigate to="/products" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route element={<RequireRole roles={['MANAGER', 'DEVOPS']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          <Route path="/products" element={<Products />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route element={<RequireRole roles={['MANAGER']} />}>
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  )
}
