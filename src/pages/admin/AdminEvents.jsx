import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import toast from 'react-hot-toast'

export default function AdminEvents() {
  const { collegeId } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Clear cache on mount so admin always sees fresh data
useEffect(() => {
  sessionStorage.removeItem('cc_events')
}, [])

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, 'events'), where('collegeId', '==', collegeId))
      const snap = await getDocs(q)
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    fetch()
  }, [collegeId])

const handleDelete = async (id, name) => {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
  await deleteDoc(doc(db, 'events', id))
  setEvents(prev => prev.filter(e => e.id !== id))
  // Clear cache so student sees updated list
  sessionStorage.removeItem('cc_events')
  toast.success('Event deleted')
}
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1">
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">My Events</h1>
            <p className="text-xs text-gray-400">{events.length} events posted</p>
          </div>
          <button onClick={() => navigate('/admin/events/new')} className="btn-primary text-xs px-4 py-2 rounded-lg">
            + Post Event
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card p-4 h-16 animate-pulse" />)}</div>
          ) : events.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-gray-400 text-sm mb-2">No events yet</p>
              <button onClick={() => navigate('/admin/events/new')} className="btn-primary text-xs">Post your first event</button>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Event', 'Category', 'Date', 'Type', 'Seats', 'Fee', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map(ev => (
                    <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{ev.name}</td>
                      <td className="px-4 py-3"><span className="badge-hack">{ev.category}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{ev.date ? format(ev.date.toDate(), 'MMM d, yyyy') : 'TBD'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{ev.isTeam ? 'Team' : 'Individual'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{ev.registrationCount || 0} / {ev.maxSeats}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{ev.fee > 0 ? `₹${ev.fee}` : 'Free'}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => navigate(`/admin/registrations?event=${ev.id}`)} className="btn-outline text-xs px-2 py-1">Registrations</button>
                        <button onClick={() => handleDelete(ev.id, ev.name)} className="btn-danger">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
