import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function StudentNavbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/app/events" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 14 14">
              <circle cx="7" cy="5" r="2.5"/><path d="M2 12c0-2.8 2.2-4 5-4s5 1.2 5 4"/>
            </svg>
          </div>
          <span className="font-semibold text-blue-600 text-sm">CampusConnect</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { path: '/app/events', label: 'Events' },
            { path: '/app/my-registrations', label: 'My Registrations' },
            { path: '/app/bookmarks', label: 'Bookmarks' },
          ].map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isActive(path)
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* User */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <span className="text-sm text-gray-600 hidden md:block max-w-28 truncate">
              {user?.displayName || user?.email}
            </span>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 12 12">
              <path d="M3 4.5l3 3 3-3"/>
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-xl shadow-lg w-44 py-1 z-50">
              <Link to="/app/profile" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                My Profile
              </Link>
              <Link to="/app/my-registrations" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                My Registrations
              </Link>
              <Link to="/app/bookmarks" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Bookmarks
              </Link>
              <div className="border-t border-gray-100 my-1" />
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
