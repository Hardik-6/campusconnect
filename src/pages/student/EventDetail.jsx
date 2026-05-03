import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import StudentNavbar from '../../components/StudentNavbar'
import RegisterModal from '../../components/RegisterModal'

const CATEGORY_COLORS = {
  Hackathon: 'badge-hack', Quiz: 'badge-quiz', 'Idea Pitch': 'badge-idea',
  Competition: 'badge-comp', Cultural: 'badge-other', Other: 'badge-other',
}

export default function EventDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [college, setCollege] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookmarked, setBookmarked] = useState(false)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, 'events', id))
      if (!snap.exists()) { navigate('/app/events'); return }
      const data = { id: snap.id, ...snap.data() }
      setEvent(data)
      // Fetch college
      const clgSnap = await getDoc(doc(db, 'colleges', data.collegeId))
      if (clgSnap.exists()) setCollege(clgSnap.data())
      // Check bookmark
      const userSnap = await getDoc(doc(db, 'users', user.uid))
      if (userSnap.exists()) {
        setBookmarked((userSnap.data().bookmarks || []).includes(id))
      }
      // Check existing registration
      const regQ = query(collection(db, 'registrations'), where('eventId', '==', id), where('userId', '==', user.uid))
      const regSnap = await getDocs(regQ)
      setAlreadyRegistered(!regSnap.empty)
      setLoading(false)
    }
    fetch()
  }, [id, user])

  const toggleBookmark = async () => {
    const ref = doc(db, 'users', user.uid)
    if (bookmarked) {
      await updateDoc(ref, { bookmarks: arrayRemove(id) })
      setBookmarked(false)
      toast.success('Removed from bookmarks')
    } else {
      await updateDoc(ref, { bookmarks: arrayUnion(id) })
      setBookmarked(true)
      toast.success('Bookmarked!')
    }
  }

  const isDeadlinePassed = event?.deadline && new Date() > event.deadline.toDate()
  const isFull = event && event.registrationCount >= event.maxSeats

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavbar />
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-8" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="h-40 bg-gray-100 rounded-xl" />
            <div className="h-40 bg-gray-100 rounded-xl" />
          </div>
          <div className="h-60 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
          <span onClick={() => navigate('/app/events')} className="hover:text-blue-600 cursor-pointer">Events</span>
          <span>›</span>
          <span className="text-gray-600">{event.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Main */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={CATEGORY_COLORS[event.category] || 'badge-other'}>{event.category}</span>
                <span className="badge-other">{event.venue?.toLowerCase().includes('online') ? 'Online' : 'Offline'}</span>
                <span className="badge-other">{event.isTeam ? 'Team Event' : 'Individual'}</span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-3">{event.name}</h1>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                  {college?.name?.[0] || 'C'}
                </div>
                <span className="text-sm text-gray-500">Hosted by <strong className="text-gray-700">{college?.name}</strong> · {college?.city}</span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="card p-5">
              <h3 className="section-title mb-4">Event details</h3>
              <div className="grid grid-cols-2 gap-4">
               {[
  { label: 'Date & Time', value: event.date ? format(event.date.toDate(), 'MMM d, yyyy · h:mm a') : 'TBD' },
  { label: 'Venue', value: event.venue || 'TBD' },
  { label: 'Team Size', value: event.isTeam ? `${event.minTeam}–${event.maxTeam} members` : 'Individual only' },
  { label: 'Registration Fee', value: event.fee > 0 ? `₹${event.fee} (Pay offline at venue)` : 'Free' },
  { label: 'Reg. Deadline', value: event.deadline ? format(event.deadline.toDate(), 'MMM d, yyyy') : 'TBD' },
  ...(event.prize && Number(event.prize) > 0
    ? [{ label: 'Prize Pool', value: `₹${Number(event.prize).toLocaleString()}` }]
    : []),
].map(({ label, value }) => (
  <div key={label}>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-800">{value}</p>
  </div>
))}
              </div>
            </div>

            {/* Description */}
            <div className="card p-5">
              <h3 className="section-title mb-3">About this event</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{event.description || 'No description provided.'}</p>
            </div>

 
          {/* Prize breakdown */}
{event.prize && event.prize > 0 && (
  <div className="card p-5">
    <h3 className="section-title mb-3">Prize breakdown</h3>
    <div className="space-y-2">
      {[['🥇 1st Place', Math.round(event.prize * 0.5)],
        ['🥈 2nd Place', Math.round(event.prize * 0.3)],
        ['🥉 3rd Place', Math.round(event.prize * 0.2)]].map(([place, amount]) => (
        <div key={place} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
          <span className="text-sm text-gray-600">{place}</span>
          <span className="text-sm font-semibold text-green-600">₹{amount.toLocaleString()}</span>
        </div>
      ))}
    </div>
  </div>
)}

            {/* Contact */}
            <div className="card p-5">
              <h3 className="section-title mb-2">Contact</h3>
              <p className="text-sm text-gray-500">{event.contact || college?.adminEmail || 'Contact the college for info'}</p>
            </div>
          </div>

          {/* Right — Registration Card */}
          <div className="space-y-4">
            <div className="card overflow-hidden sticky top-20">
              <div className="bg-blue-50 p-5 border-b border-blue-100 text-center">
                <p className="text-xs text-blue-500 mb-1">Registration fee</p>
                <p className="text-3xl font-semibold text-blue-700">{event.fee > 0 ? `₹${event.fee}` : 'Free'}</p>
                {event.fee > 0 && <p className="text-xs text-blue-400 mt-1">Pay offline at venue</p>}
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Deadline</span>
                  <span className="font-medium text-gray-700">
                    {event.deadline ? format(event.deadline.toDate(), 'MMM d, yyyy') : 'Open'}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">Spots filled</span>
                    <span className="font-medium">{event.registrationCount || 0} / {event.maxSeats}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-1.5 bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((event.registrationCount || 0) / event.maxSeats) * 100)}%` }} />
                  </div>
                </div>

                {alreadyRegistered ? (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                    <p className="text-sm text-green-700 font-medium">✓ Already registered</p>
                    <p className="text-xs text-green-500 mt-0.5">Check My Registrations for status</p>
                  </div>
                ) : isDeadlinePassed ? (
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-500">Registration closed</p>
                  </div>
                ) : isFull ? (
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-red-500">Event is full</p>
                  </div>
                ) : (
                  <button onClick={() => setShowModal(true)} className="w-full btn-primary py-3 rounded-xl">
                    Register Now
                  </button>
                )}

                <button onClick={toggleBookmark}
                  className="w-full btn-outline py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm">
                  {bookmarked ? '♥ Saved' : '♡ Save Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <RegisterModal
          event={event}
          college={college}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setAlreadyRegistered(true); setShowModal(false) }}
        />
      )}
    </div>
  )
}
