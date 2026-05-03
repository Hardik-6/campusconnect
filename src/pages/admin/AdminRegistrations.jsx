import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import AdminSidebar from '../../components/AdminSidebar'
import { sendApprovalEmail, sendRejectionEmail } from '../../services/emailService'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

export default function AdminRegistrations() {
  const { collegeId } = useAuth()
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState('all')
  const [registrations, setRegistrations] = useState([])
  const [filtered, setFiltered] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      const evQ = query(collection(db, 'events'), where('collegeId', '==', collegeId))
      const evSnap = await getDocs(evQ)
      const evData = evSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      setEvents(evData)
      const allRegs = []
      for (const ev of evData) {
        const regQ = query(collection(db, 'registrations'), where('eventId', '==', ev.id))
        const regSnap = await getDocs(regQ)
        regSnap.docs.forEach(d => allRegs.push({ id: d.id, ...d.data(), eventName: ev.name }))
      }
      setRegistrations(allRegs)
      setLoading(false)
    }
    fetch()
  }, [collegeId])

  useEffect(() => {
    let res = registrations
    if (selectedEvent !== 'all') res = res.filter(r => r.eventId === selectedEvent)
    if (statusFilter !== 'all') res = res.filter(r => r.status === statusFilter)
    setFiltered(res)
  }, [registrations, selectedEvent, statusFilter])

  const pendingCount = registrations.filter(r => r.status === 'pending').length

  const updateStatus = async (reg, status) => {
    await updateDoc(doc(db, 'registrations', reg.id), { status, updatedAt: new Date() })
    setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, status } : r))
    if (status === 'approved') {
      const evSnap = await getDoc(doc(db, 'events', reg.eventId))
      const evData = evSnap.data()
      await sendApprovalEmail({
        studentEmail: reg.leadEmail,
        studentName: reg.leadName,
        eventName: reg.eventName,
        eventDate: evData?.date ? format(evData.date.toDate(), 'MMM d, yyyy') : 'TBD',
        venue: evData?.venue || 'TBD',
      })
      toast.success(`✓ Approved ${reg.teamName}`)
    } else {
      await sendRejectionEmail({ studentEmail: reg.leadEmail, studentName: reg.leadName, eventName: reg.eventName })
      toast.success(`Rejected ${reg.teamName}`)
    }
  }

  const exportCSV = () => {
    const data = filtered.map(r => ({
      'Team/Name': r.teamName,
      'Event': r.eventName,
      'Lead Name': r.leadName,
      'Lead Email': r.leadEmail,
      'Lead Phone': r.leadPhone,
      'College': r.leadCollege,
      'Year': r.leadYear,
      'Branch': r.leadBranch,
      'Members': r.members?.length || 1,
      'Status': r.status,
      'Registered On': r.createdAt ? format(r.createdAt.toDate(), 'MMM d, yyyy') : '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Registrations')
    XLSX.writeFile(wb, `registrations_${selectedEvent === 'all' ? 'all' : selectedEvent}.xlsx`)
    toast.success('Exported successfully!')
  }

  const statusCounts = {
    all: registrations.filter(r => selectedEvent === 'all' || r.eventId === selectedEvent).length,
    pending: registrations.filter(r => r.status === 'pending' && (selectedEvent === 'all' || r.eventId === selectedEvent)).length,
    approved: registrations.filter(r => r.status === 'approved' && (selectedEvent === 'all' || r.eventId === selectedEvent)).length,
    rejected: registrations.filter(r => r.status === 'rejected' && (selectedEvent === 'all' || r.eventId === selectedEvent)).length,
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar pendingCount={pendingCount} />
      <div className="flex-1">
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Registrations</h1>
            <p className="text-xs text-gray-400 mt-0.5">Review and manage student registrations</p>
          </div>
          <button onClick={exportCSV} className="btn-outline text-xs px-4 py-2 rounded-lg flex items-center gap-2">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 13 13">
              <path d="M6.5 1v7M4 6l2.5 2.5L9 6"/><path d="M1 10v1.5a.5.5 0 00.5.5h10a.5.5 0 00.5-.5V10"/>
            </svg>
            Export CSV
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <select className="input-field w-auto text-xs" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
              <option value="all">All events</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <div className="flex gap-0">
              {[['all', `All (${statusCounts.all})`], ['pending', `Pending (${statusCounts.pending})`],
                ['approved', `Approved (${statusCounts.approved})`], ['rejected', `Rejected (${statusCounts.rejected})`]
              ].map(([val, label]) => (
                <button key={val} onClick={() => setStatusFilter(val)}
                  className={`px-3 py-1.5 text-xs border transition-colors first:rounded-l-lg last:rounded-r-lg border-r-0 last:border-r ${
                    statusFilter === val ? 'bg-blue-50 text-blue-600 border-blue-200 font-medium' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="card p-8 text-center text-sm text-gray-400">Loading registrations...</div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-gray-400 text-sm">No registrations found</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Team / Student</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Event</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">College</th>
                    <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Members</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(reg => (
                    <>
                      <tr key={reg.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpanded(expanded === reg.id ? null : reg.id)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                              style={{ background: `hsl(${reg.teamName?.charCodeAt(0) * 5 % 360}, 55%, 50%)` }}>
                              {reg.teamName?.[0] || 'T'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{reg.teamName}</p>
                              <p className="text-xs text-gray-400">{reg.leadEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{reg.eventName}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{reg.leadCollege}</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-600">{reg.members?.length || 1}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {reg.createdAt ? format(reg.createdAt.toDate(), 'MMM d') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`status-${reg.status}`}>{reg.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {reg.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <button onClick={e => { e.stopPropagation(); updateStatus(reg, 'approved') }}
                                className="btn-success">Approve</button>
                              <button onClick={e => { e.stopPropagation(); updateStatus(reg, 'rejected') }}
                                className="btn-danger">Reject</button>
                            </div>
                          )}
                          {reg.status !== 'pending' && <span className="text-xs text-gray-300">—</span>}
                        </td>
                      </tr>
                      {expanded === reg.id && (
                        <tr key={`${reg.id}-expanded`} className="bg-blue-50">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="space-y-3">
                              <p className="text-xs font-medium text-gray-700 mb-2">Team member details</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {(reg.members || [reg]).map((m, i) => (
                                  <div key={i} className="bg-white rounded-lg p-3 border border-blue-100">
                                    <p className="text-xs font-semibold text-gray-800">{m.name} {i === 0 && <span className="text-blue-500">(Leader)</span>}</p>
                                    <p className="text-xs text-gray-400">{m.email}</p>
                                    <p className="text-xs text-gray-400">{m.college}</p>
                                    <p className="text-xs text-gray-400">{m.year} · {m.branch}</p>
                                    {m.phone && <p className="text-xs text-gray-400">{m.phone}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
