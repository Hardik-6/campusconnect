import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  </div>
)

export const UserRoute = ({ children }) => {
  const { user, role, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (role !== 'user') return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/superadmin/dashboard'} replace />
  return children
}

export const AdminRoute = ({ children }) => {
  const { user, role, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/admin/login" replace />
  if (role !== 'admin') return <Navigate to={role === 'user' ? '/app/events' : '/superadmin/dashboard'} replace />
  return children
}

export const SuperAdminRoute = ({ children }) => {
  const { user, role, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/superadmin/login" replace />
  if (role !== 'superadmin') return <Navigate to={role === 'user' ? '/app/events' : '/admin/dashboard'} replace />
  return children
}

export const PublicOnlyRoute = ({ children, adminOnly = false, superOnly = false }) => {
  const { user, role, loading } = useAuth()
  if (loading) return <Spinner />
  if (user) {
    if (role === 'superadmin') return <Navigate to="/superadmin/dashboard" replace />
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
    return <Navigate to="/app/events" replace />
  }
  return children
}
