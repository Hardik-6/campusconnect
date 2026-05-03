import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'

const StatCard = ({ label, value, hint, hintColor = 'text-gray-400' }) => (
  <div className="card p-5">
    <p className="text-xs text-gray-400 mb-2">{label}</p>
    <p className="text-2xl font-semibold text-gray-900 mb-1">{value}</p>
    <p className={`text-xs ${hintColor}`}>{hint}</p>
  </div>
)

export default function AdminDashboard() {
  const { user, collegeId } = useAuth()
  const navigate = useNavigate()
  const [college, setCollege] = useState(null)
  const [events, setEvents] = useState([])
  const [pendingRegs, setPendingRegs] = useState([])
  const [totalRegs, setTotalRegs] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      if (!collegeId) return
      // College info
      const clgSnap = await getDoc(doc(db, 'colleges', collegeId))
      if (clgSnap.exists()) setCollege(clgSnap.data())
      // Events
      const evQ = query(collection(db, 'events'), where('collegeId', '==', collegeId))
      const evSnap = await getDocs(evQ)
      const evData = evSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      setEvents(evData)
      // Registrations
      const allRegs = []
      const pendingList = []
      for (const ev of evData) {
        const regQ = query(collection(db, 'registrations'), where('eventId', '==', ev.id))
        const regSnap = await getDocs(regQ)
        regSnap.docs.forEach(d => {
          const reg = { id: d.id, ...d.data(), eventName: ev.name }
          allRegs.push(reg)
          if (reg.status === 'pending') pendingList.push(reg)
        })
      }
      setTotalRegs(allRegs.length)
      setPendingRegs(pendingList.slice(0, 5))
      setLoading(false)
    }
    fetch()
  }, [collegeId])

  const upcomingEvents = events.filter(e => e.date && e.date.toDate() > new Date())
  const approvedCount = totalRegs - pendingRegs.length

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar pendingCount={pendingRegs.length} college={college} />
      <div className="flex-1">
        {/* Topbar */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">{college?.name} · Welcome back</p>
          </div>
          <button onClick={() => navigate('/admin/events/new')} className="btn-primary text-xs px-4 py-2 rounded-lg">
            + Post new event
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total events" value={events.length} hint={`${upcomingEvents.length} upcoming`} hintColor="text-blue-500" />
           <StatCard label="Registrations" value={totalRegs} hint={`${totalRegs} total`} hintColor="text-green-500" />
            <StatCard label="Pending approval" value={pendingRegs.length} hint={pendingRegs.length > 0 ? 'Action needed' : 'All clear!'} hintColor={pendingRegs.length > 0 ? 'text-orange-500' : 'text-green-500'} />
            <StatCard label="Approved" value={approvedCount} hint={totalRegs > 0 ? `${Math.round((approvedCount/totalRegs)*100)}% approval rate` : 'No registrations yet'} hintColor="text-green-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Events list */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="section-title">My events</h2>
                <button onClick={() => navigate('/admin/events')} className="text-xs text-blue-600">View all →</button>
              </div>
              {loading ? (
                <div className="p-5 space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
                </div>
              ) : events.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-400">No events posted yet</p>
                  <button onClick={() => navigate('/admin/events/new')} className="mt-2 text-xs text-blue-600">Post your first event →</button>
                </div>
              ) : (
                <div>
                  {events.slice(0, 4).map(ev => {
                    const isUpcoming = ev.date && ev.date.toDate() > new Date()
                    const isPast = ev.date && ev.date.toDate() < new Date()
                    return (
                      <div key={ev.id} onClick={() => navigate(`/admin/registrations?event=${ev.id}`)}
                        className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 cursor-pointer last:border-0">
                        <div className={`w-1 h-10 rounded-full flex-shrink-0 ${isUpcoming ? 'bg-blue-500' : isPast ? 'bg-gray-200' : 'bg-green-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{ev.name}</p>
                          <p className="text-xs text-gray-400">
                            {ev.date ? format(ev.date.toDate(), 'MMM d, yyyy') : 'TBD'} · {ev.isTeam ? 'Team' : 'Individual'}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isUpcoming ? 'bg-blue-50 text-blue-600' : isPast ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-600'}`}>
                            {isUpcoming ? 'Upcoming' : isPast ? 'Ended' : 'Live'}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">{ev.registrationCount || 0} regs</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pending Registrations quick view */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="section-title">Pending approvals</h2>
                <button onClick={() => navigate('/admin/registrations')} className="text-xs text-blue-600">View all →</button>
              </div>
              {loading ? (
                <div className="p-5 space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
                </div>
              ) : pendingRegs.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg width="16" height="16" fill="none" stroke="#22C55E" strokeWidth="1.5" viewBox="0 0 16 16">
                      <path d="M3 8l4 4 6-7"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400">All caught up!</p>
                  <p className="text-xs text-gray-300 mt-0.5">No pending registrations</p>
                </div>
              ) : (
                <div>
                  {pendingRegs.map(reg => (
                    <div key={reg.id}
                      onClick={() => navigate('/admin/registrations')}
                      className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 cursor-pointer last:border-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                        style={{ background: `hsl(${reg.teamName?.charCodeAt(0) * 5 % 360}, 60%, 50%)` }}>
                        {reg.teamName?.[0] || 'T'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{reg.teamName}</p>
                        <p className="text-xs text-gray-400 truncate">{reg.eventName}</p>
                      </div>
                      <span className="status-pending flex-shrink-0">Pending</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
