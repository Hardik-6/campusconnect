import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import StudentNavbar from '../../components/StudentNavbar'

export default function MyRegistrations() {
  const { user } = useAuth()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, 'registrations'), where('userId', '==', user.uid))
      const snap = await getDocs(q)
      const regs = await Promise.all(snap.docs.map(async d => {
        const reg = { id: d.id, ...d.data() }
        const eventSnap = await getDoc(doc(db, 'events', reg.eventId))
        reg.event = eventSnap.exists() ? eventSnap.data() : null
        return reg
      }))
      setRegistrations(regs.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate()))
      setLoading(false)
    }
    fetch()
  }, [user])

  const statusConfig = {
    pending:  { label: 'Pending approval', class: 'status-pending', icon: '⏳' },
    approved: { label: 'Approved',         class: 'status-approved', icon: '✓' },
    rejected: { label: 'Rejected',         class: 'status-rejected', icon: '✕' },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">My Registrations</h1>
        <p className="text-sm text-gray-400 mb-6">Track all your event registrations</p>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" fill="none" stroke="#94A3B8" strokeWidth="1.5" viewBox="0 0 20 20">
                <rect x="3" y="4" width="14" height="14" rx="2"/><path d="M7 4V2M13 4V2M3 9h14"/>
              </svg>
            </div>
            <p className="text-gray-400 text-sm">No registrations yet</p>
            <p className="text-gray-300 text-xs mt-1">Browse events and register to see them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {registrations.map(reg => {
              const status = statusConfig[reg.status] || statusConfig.pending
              return (
                <div key={reg.id} className="card p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{reg.event?.name || reg.eventName}</h3>
                        <span className={status.class}>{status.icon} {status.label}</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        Registered on {reg.createdAt ? format(reg.createdAt.toDate(), 'MMM d, yyyy') : '—'}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-gray-400">Type</p>
                          <p className="text-sm font-medium text-gray-700">{reg.isTeam ? 'Team' : 'Individual'}</p>
                        </div>
                        {reg.isTeam && (
                          <div>
                            <p className="text-xs text-gray-400">Team name</p>
                            <p className="text-sm font-medium text-gray-700">{reg.teamName}</p>
                          </div>
                        )}
                        {reg.isTeam && (
                          <div>
                            <p className="text-xs text-gray-400">Members</p>
                            <p className="text-sm font-medium text-gray-700">{reg.members?.length || 1}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-400">Event date</p>
                          <p className="text-sm font-medium text-gray-700">
                            {reg.event?.date ? format(reg.event.date.toDate(), 'MMM d, yyyy') : 'TBD'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status message */}
                  {reg.status === 'pending' && (
                    <div className="mt-3 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-orange-600">Waiting for college admin to review your registration.</p>
                    </div>
                  )}
                  {reg.status === 'approved' && (
                    <div className="mt-3 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-green-700">🎉 You're in! Show this confirmation at the event venue.</p>
                    </div>
                  )}
                  {reg.status === 'rejected' && (
                    <div className="mt-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-600">Your registration was not approved. Contact the college for more info.</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
