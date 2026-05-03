import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import StudentNavbar from '../../components/StudentNavbar'

export default function Bookmarks() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      const userSnap = await getDoc(doc(db, 'users', user.uid))
      const bookmarks = userSnap.data()?.bookmarks || []
      const eventsData = await Promise.all(
        bookmarks.map(async id => {
          const snap = await getDoc(doc(db, 'events', id))
          return snap.exists() ? { id: snap.id, ...snap.data() } : null
        })
      )
      setEvents(eventsData.filter(Boolean))
      setLoading(false)
    }
    fetch()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Bookmarks</h1>
        <p className="text-sm text-gray-400 mb-6">Events you've saved</p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse h-36" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-2xl mb-3">♡</p>
            <p className="text-gray-400 text-sm">No bookmarks yet</p>
            <p className="text-gray-300 text-xs mt-1">Click the heart icon on any event to save it</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map(event => (
              <div key={event.id} onClick={() => navigate(`/app/events/${event.id}`)}
                className="card p-4 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all">
                <h3 className="font-medium text-gray-900 mb-1">{event.name}</h3>
                <p className="text-xs text-gray-400 mb-3">{event.collegeName}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{event.date ? format(event.date.toDate(), 'MMM d, yyyy') : 'TBD'}</span>
                  <span className="text-green-600 font-medium">{event.fee > 0 ? `₹${event.fee}` : 'Free'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
