import { useState, useEffect, useRef } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuth } from '../../context/AuthContext'

const CATEGORIES = ['All', 'Hackathon', 'Quiz', 'Competition', 'Idea Pitch', 'Cultural', 'Other']

const BADGE_COLORS = {
  Hackathon:    'bg-blue-50 text-blue-700',
  Quiz:         'bg-green-50 text-green-700',
  'Idea Pitch': 'bg-orange-50 text-orange-700',
  Competition:  'bg-purple-50 text-purple-700',
  Cultural:     'bg-pink-50 text-pink-700',
  Other:        'bg-gray-100 text-gray-600',
}

const CARD_ACCENTS = {
  Hackathon:    'bg-blue-500',
  Quiz:         'bg-green-500',
  'Idea Pitch': 'bg-orange-500',
  Competition:  'bg-purple-500',
  Cultural:     'bg-pink-500',
  Other:        'bg-gray-400',
}

function EventCard({ event, onClick }) {
  const spotsPercent = Math.min(100, ((event.registrationCount || 0) / event.maxSeats) * 100)

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
    >
      <div className={`h-2 w-full ${CARD_ACCENTS[event.category] || 'bg-gray-400'}`} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${BADGE_COLORS[event.category] || 'bg-gray-100 text-gray-600'}`}>
            {event.category}
          </span>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${event.fee > 0 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
            {event.fee > 0 ? `₹${event.fee}` : 'Free'}
          </span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors leading-tight">
          {event.name}
        </h3>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
            {event.collegeName?.[0] || 'C'}
          </div>
          <span className="text-sm text-gray-500 truncate">{event.collegeName}</span>
        </div>

        <div className="space-y-2.5 mb-5">
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <span>📅</span>
            <span>{event.date ? format(event.date.toDate(), 'MMM d, yyyy') : 'Date TBD'}
</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <span>📍</span>
            <span className="truncate">{event.venue || 'Venue TBD'}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <span>👥</span>
            <span>{event.isTeam ? `Team (${event.minTeam}–${event.maxTeam} members)` : 'Individual'}</span>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 flex items-end justify-between">
          <div className="flex-1 mr-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{event.registrationCount || 0} registered</span>
              <span>{event.maxSeats} seats</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-2 bg-blue-500 rounded-full transition-all"
                style={{ width: `${spotsPercent}%` }}
              />
            </div>
          </div>
          {event.prize > 0 && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-400">Prize</p>
              <p className="text-base font-bold text-green-600">
                ₹{Number(event.prize).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const [events, setEvents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const dropdownRef = useRef(null)


      // Check cache first
useEffect(() => {
  const fetchEvents = async () => {
    try {
      const snap = await getDocs(collection(db, 'events'))
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setEvents(data)
      setFiltered(data)
    } catch (e) {
      console.error('Error fetching events:', e)
    } finally {
      setLoading(false)
    }
  }
  fetchEvents()
}, [])
  // Search filter
  useEffect(() => {
    let res = [...events]
    if (category !== 'All') res = res.filter(e => e.category === category)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      res = res.filter(e =>
        e.name?.toLowerCase().includes(q) ||
        e.collegeName?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q) ||
        e.venue?.toLowerCase().includes(q)
      )
    }
    setFiltered(res)
  }, [category, search, events])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCardClick = (eventId) => {
    if (!user) navigate('/login')
    else navigate(`/app/events/${eventId}`)
  }

  const getDashboardUrl = () => {
    if (role === 'admin') return '/admin/dashboard'
    if (role === 'superadmin') return '/superadmin/dashboard'
    return '/app/events'
  }

  const handleLogout = async () => {
    await logout()
    setDropdownOpen(false)
  }

  const getInitials = () => {
    const name = user?.displayName || user?.email || 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 16 16">
                <circle cx="8" cy="6" r="3"/>
                <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-blue-600">CampusConnect</span>
          </div>

          {/* Nav Links — center */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              Events
            </button>
           
           <button
  onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
>
  About
</button>
<button
  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
>
  Contact Us
</button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              // Profile dropdown
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 hover:bg-gray-50 px-3 py-2 rounded-xl transition-colors"
                >
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border-2 border-blue-100" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {getInitials()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden md:block max-w-28 truncate">
                    {user?.displayName || user?.email?.split('@')[0]}
                  </span>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 14 14" className="text-gray-400">
                    <path d="M3 5l4 4 4-4"/>
                  </svg>
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-12 bg-white border border-gray-100 rounded-2xl shadow-xl w-52 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {user?.displayName || 'Student'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { navigate(getDashboardUrl()); setDropdownOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                      >
                        <span>⚡</span> My Dashboard
                      </button>
                      {role === 'user' && (
                        <>
                          <button
                            onClick={() => { navigate('/app/my-registrations'); setDropdownOpen(false) }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                          >
                            <span>📋</span> My Registrations
                          </button>
                          <button
                            onClick={() => { navigate('/app/bookmarks'); setDropdownOpen(false) }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                          >
                            <span>🔖</span> Bookmarks
                          </button>
                        </>
                      )}
                    </div>
                    <div className="border-t border-gray-50 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <span>🚪</span> Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-gray-600 hover:text-blue-600 px-4 py-2 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/login"
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Multi-college event platform
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Discover events from{' '}
            <span className="text-blue-600">every college</span>
          </h1>

          <p className="text-lg text-gray-500 mb-8 leading-relaxed">
            Hackathons, quizzes, competitions & more — all in one place.
            Register for events across colleges with a single account.
          </p>

          {/* Search Bar */}
          <div className="flex items-center gap-3 bg-white border-2 border-gray-200 focus-within:border-blue-500 rounded-2xl px-5 py-3.5 max-w-lg mx-auto transition-all shadow-sm">
            <svg width="18" height="18" fill="none" stroke="#9CA3AF" strokeWidth="1.8" viewBox="0 0 18 18">
              <circle cx="8" cy="8" r="6"/>
              <path d="M13 13l3 3"/>
            </svg>
            <input
              type="text"
              placeholder="Search events, colleges, venues..."
              className="bg-transparent flex-1 text-base outline-none text-gray-800 placeholder-gray-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoComplete="off"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600 text-lg font-medium"
              >
                ✕
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-10">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{events.length}+</p>
              <p className="text-xs text-gray-400 mt-0.5">Events</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">Free</p>
              <p className="text-xs text-gray-400 mt-0.5">To register</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">All</p>
              <p className="text-xs text-gray-400 mt-0.5">Colleges</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div id="events-section" className="max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                category === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {cat}
            </button>
          ))}
          {(search || category !== 'All') && (
            <button
              onClick={() => { setSearch(''); setCategory('All') }}
              className="px-4 py-2 rounded-full text-sm font-semibold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-all"
            >
              ✕ Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-600">
            {loading ? 'Loading events...' : (
              search
                ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search}"`
                : `${filtered.length} event${filtered.length !== 1 ? 's' : ''} found`
            )}
          </h2>
          {!user && (
            <p className="text-sm text-gray-400">
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                Sign in
              </Link>{' '}
              to view details & register
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-2 bg-gray-200 w-full" />
                <div className="p-6 space-y-3">
                  <div className="h-5 bg-gray-100 rounded-full w-24" />
                  <div className="h-7 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="space-y-2 pt-2">
                    <div className="h-4 bg-gray-100 rounded" />
                    <div className="h-4 bg-gray-100 rounded" />
                    <div className="h-4 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-gray-700 font-bold text-lg mb-1">No events found</h3>
            <p className="text-gray-400 text-sm mb-4">
              {search ? `No results for "${search}"` : 'No events in this category yet'}
            </p>
            <button
              onClick={() => { setSearch(''); setCategory('All') }}
              className="text-blue-600 text-sm font-semibold hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => handleCardClick(event.id)}
              />
            ))}
          </div>
        )}

{/* About Section */}
<div id="about" className="mt-16">
  <div className="text-center mb-10">
    <h2 className="text-3xl font-bold text-gray-900 mb-3">
      About <span className="text-blue-600">CampusConnect</span>
    </h2>
    <p className="text-gray-500 max-w-xl mx-auto">
      A platform built to connect students with events happening across colleges in India
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
    {[
      { icon: '🎯', title: 'Our Mission', desc: 'Make college events accessible to every student across India regardless of which college they attend.' },
      { icon: '🏫', title: 'For Colleges', desc: 'Colleges post events, manage registrations and connect with talented students from everywhere.' },
      { icon: '👨‍🎓', title: 'For Students', desc: 'Students discover hackathons, quizzes and competitions from all colleges and register in clicks.' },
    ].map(({ icon, title, desc }) => (
      <div key={title} className="bg-white rounded-2xl border border-gray-100 p-8 text-center hover:shadow-lg transition-all">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
      </div>
    ))}
  </div>

  <div className="bg-white rounded-2xl border border-gray-100 p-10 mb-8">
    <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How it works</h2>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[
        { step: '01', title: 'College registers', desc: 'College contacts Super Admin and gets verified on the platform' },
        { step: '02', title: 'Events posted', desc: 'College admin posts events with all details like hackathons and quizzes' },
        { step: '03', title: 'Students register', desc: 'Students from any college browse and register for events they like' },
        { step: '04', title: 'Admin approves', desc: 'College admin reviews registrations. Students get email notification!' },
      ].map(({ step, title, desc }) => (
        <div key={step} className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm mx-auto mb-4">
            {step}
          </div>
          <h3 className="font-bold text-gray-900 mb-2 text-sm">{title}</h3>
          <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>
  </div>

  <div className="bg-blue-600 rounded-2xl p-8 text-center">
    <h2 className="text-2xl font-bold text-white mb-6">Platform at a glance</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {[
        { value: '100%', label: 'Free for students' },
        { value: '3', label: 'Role system' },
        { value: '∞', label: 'Events possible' },
        { value: '24/7', label: 'Always available' },
      ].map(({ value, label }) => (
        <div key={label}>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          <p className="text-blue-100 text-sm">{label}</p>
        </div>
      ))}
    </div>
  </div>
</div>

{/* Contact Section */}
<div id="contact" className="mt-16 bg-white rounded-2xl border border-gray-100 p-10 text-center">
  <div className="text-4xl mb-4">📬</div>
  <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Us</h2>
  <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
    Want your college on CampusConnect? Reach out to us and we will get you verified!
  </p>
  <div className="flex flex-col md:flex-row items-center justify-center gap-4">
    <a
      href="# mailto:hp303164@gmail.com"
      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
    >
      📧 hp303164@gmail.com
    </a>
    <a
      href="# tel:+9322679762"
      className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
    >
      📞 +91 9322679762
    </a>
  </div>
</div>




        {/* Bottom CTA for guests */}
        {!user && filtered.length > 0 && (
          <div className="mt-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-10 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              Ready to register for events?
            </h3>
            <p className="text-blue-100 mb-6 text-base">
              Create a free account and register for events across all colleges
            </p>
            <Link
              to="/login"
              className="inline-block bg-white text-blue-600 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-base shadow-sm"
            >
              Get started with Google →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}