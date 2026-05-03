import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const NAV = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 15 15">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1"/>
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1"/>
    </svg>
  )},
  { path: '/admin/events', label: 'My Events', icon: (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 15 15">
      <rect x="1" y="2" width="13" height="11" rx="1.5"/><path d="M5 2V1M10 2V1M1 6h13"/>
    </svg>
  )},
  { path: '/admin/events/new', label: 'Post Event', icon: (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 15 15">
      <circle cx="7.5" cy="7.5" r="6"/><path d="M7.5 5v5M5 7.5h5"/>
    </svg>
  )},
  { path: '/admin/registrations', label: 'Registrations', icon: (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 15 15">
      <path d="M2 4h11M2 7.5h8M2 11h5"/>
    </svg>
  ), badge: true },
]

export default function AdminSidebar({ pendingCount = 0, college }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/admin/login')
  }

  return (
    <aside className="w-52 bg-white border-r border-gray-100 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="13" height="13" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 13 13">
              <circle cx="6.5" cy="4.5" r="2.5"/><path d="M1.5 11.5c0-2.8 2.2-4 5-4s5 1.2 5 4"/>
            </svg>
          </div>
          <span className="font-semibold text-blue-600 text-sm">CampusConnect</span>
        </div>
        {/* College chip */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 flex-shrink-0">
            {college?.name?.[0] || 'C'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{college?.name || 'College'}</p>
            <p className="text-xs text-gray-400">Admin</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 ml-auto flex-shrink-0" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ path, label, icon, badge }) => {
          const active = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className={active ? 'text-blue-600' : 'text-gray-400'}>{icon}</span>
              {label}
              {badge && pendingCount > 0 && (
                <span className="ml-auto bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-2 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-800 truncate">{user?.email}</p>
            <p className="text-xs text-gray-400">Admin</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          Log out
        </button>
      </div>
    </aside>
  )
}
