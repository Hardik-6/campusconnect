import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { UserRoute, AdminRoute, SuperAdminRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import StudentLogin from './pages/auth/StudentLogin'
import AdminLogin from './pages/auth/AdminLogin'
import SuperAdminLogin from './pages/auth/SuperAdminLogin'
import Landing from './pages/public/Landing'
import EventsPage from './pages/student/EventsPage'
import EventDetail from './pages/student/EventDetail'
import MyRegistrations from './pages/student/MyRegistrations'
import Bookmarks from './pages/student/Bookmarks'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEvents from './pages/admin/AdminEvents'
import PostEvent from './pages/admin/PostEvent'
import AdminRegistrations from './pages/admin/AdminRegistrations'
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { fontSize: '13px', borderRadius: '10px', border: '1px solid #f1f5f9' },
          success: { iconTheme: { primary: '#22C55E', secondary: '#fff' } },
        }} />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicOnlyRoute><StudentLogin /></PublicOnlyRoute>} />
          <Route path="/admin/login" element={<PublicOnlyRoute><AdminLogin /></PublicOnlyRoute>} />
          <Route path="/superadmin/login" element={<PublicOnlyRoute><SuperAdminLogin /></PublicOnlyRoute>} />
          <Route path="/app/events" element={<UserRoute><EventsPage /></UserRoute>} />
          <Route path="/app/events/:id" element={<UserRoute><EventDetail /></UserRoute>} />
          <Route path="/app/my-registrations" element={<UserRoute><MyRegistrations /></UserRoute>} />
          <Route path="/app/bookmarks" element={<UserRoute><Bookmarks /></UserRoute>} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
          <Route path="/admin/events/new" element={<AdminRoute><PostEvent /></AdminRoute>} />
          <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
          <Route path="/superadmin/dashboard" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
