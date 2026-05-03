import { useState, useEffect, useRef } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, Timestamp } from 'firebase/firestore'
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, auth, storage } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { sendAdminCredentialsEmail } from '../../services/emailService'
import toast from 'react-hot-toast'

const SANav = ({ active, setActive, logout }) => {
  const items = [
    { id: 'dashboard', label: 'Analytics' },
    { id: 'colleges', label: 'Colleges' },
    { id: 'add', label: 'Add College' },
    { id: 'events', label: 'All Events' },
  ]
  return (
    <aside className="w-52 bg-white border-r border-gray-100 flex flex-col min-h-screen">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
            <svg width="13" height="13" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 13 13">
              <path d="M6.5 1l1.5 3h3l-2.5 2 1 3-3-2-3 2 1-3L2 4h3z"/>
            </svg>
          </div>
          <span className="font-semibold text-emerald-700 text-sm">CampusConnect</span>
        </div>
        <p className="text-xs text-gray-400 pl-9">Super Admin</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {items.map(({ id, label }) => (
          <button key={id} onClick={() => setActive(id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${active === id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <button onClick={logout} className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg">
          Log out
        </button>
      </div>
    </aside>
  )
}

export default function SuperAdminDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [active, setActive] = useState('dashboard')
  const [colleges, setColleges] = useState([])
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [addForm, setAddForm] = useState({ name: '', city: '', state: '', adminEmail: '', adminPassword: '' })
  const [docFile, setDocFile] = useState(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
  const fetch = async () => {
    try {
      console.log('Fetching data...')
      const [cSnap, eSnap, uSnap, rSnap] = await Promise.all([
        getDocs(collection(db, 'colleges')),
        getDocs(collection(db, 'events')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'registrations')),
      ])
      console.log('Colleges found:', cSnap.docs.length)
      console.log('Colleges data:', cSnap.docs.map(d => d.data()))
      setColleges(cSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setEvents(eSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setRegistrations(rSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error('Fetch error:', err)
      toast.error('Failed to load data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }
  fetch()
}, [])

  const handleVerify = async (collegeId, verified) => {
    await updateDoc(doc(db, 'colleges', collegeId), { verified })
    setColleges(prev => prev.map(c => c.id === collegeId ? { ...c, verified } : c))
    toast.success(verified ? 'College verified!' : 'College unverified')
  }

  const handleRemove = async (college) => {
    if (!confirm(`Remove ${college.name}? This will delete all their events.`)) return
    await deleteDoc(doc(db, 'colleges', college.id))
    setColleges(prev => prev.filter(c => c.id !== college.id))
    toast.success('College removed')
  }

  const handleAddCollege = async (e) => {
    e.preventDefault()
    if (!addForm.name || !addForm.adminEmail || !addForm.adminPassword) {
      toast.error('Fill all required fields')
      return
    }
    setAdding(true)
    try {
      // Upload document if provided
      let documentURL = ''
      if (docFile) {
        const storageRef = ref(storage, `college-docs/${Date.now()}_${docFile.name}`)
        await uploadBytes(storageRef, docFile)
        documentURL = await getDownloadURL(storageRef)
      }

      // ✅ Create SECONDARY Firebase app to avoid logging out Super Admin
      const secondaryApp = initializeApp(auth.app.options, `admin-create-${Date.now()}`)
      const secondaryAuth = getAuth(secondaryApp)
      const userCred = await createUserWithEmailAndPassword(
        secondaryAuth,
        addForm.adminEmail,
        addForm.adminPassword
      )
      const adminUid = userCred.user.uid
      // Sign out secondary app immediately
      await secondaryAuth.signOut()

      // Create college document
      const clgRef = await addDoc(collection(db, 'colleges'), {
        name: addForm.name,
        city: addForm.city,
        state: addForm.state,
        adminEmail: addForm.adminEmail,
        adminUid,
        verified: true,
        documentURL,
        createdAt: Timestamp.now(),
      })

      // Create admin document
      await addDoc(collection(db, 'admins'), {
        uid: adminUid,
        collegeId: clgRef.id,
        email: addForm.adminEmail,
        role: 'admin',
        createdAt: Timestamp.now(),
      })

      // Send credentials email
      await sendAdminCredentialsEmail({
        adminEmail: addForm.adminEmail,
        collegeName: addForm.name,
        password: addForm.adminPassword,
      })

      toast.success(`${addForm.name} added! Credentials sent to ${addForm.adminEmail}`)
      setColleges(prev => [...prev, {
        id: clgRef.id,
        ...addForm,
        verified: true,
        documentURL,
        adminUid,
        eventCount: 0
      }])
      setAddForm({ name: '', city: '', state: '', adminEmail: '', adminPassword: '' })
      setDocFile(null)
      setActive('colleges')
    } catch (err) {
      toast.error(err.message || 'Failed to add college')
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  const categoryCount = events.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + 1; return acc }, {})

  const handleLogout = async () => { await logout(); navigate('/superadmin/login') }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SANav active={active} setActive={setActive} logout={handleLogout} />
      <div className="flex-1">
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <h1 className="text-base font-semibold text-gray-900">
            {active === 'dashboard' ? 'Platform Analytics' : active === 'colleges' ? 'Colleges' : active === 'add' ? 'Add College' : 'All Events'}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">CampusConnect Super Admin</p>
        </div>

        <div className="p-6">
          {/* Dashboard */}
          {active === 'dashboard' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
{ label: 'Total colleges', value: colleges.length, hint: `${colleges.filter(c => c.verified).length} verified · ${colleges.filter(c => !c.verified).length} pending` },                  { label: 'Total events', value: events.length, hint: 'All time' },
                  { label: 'Registrations', value: registrations.length, hint: 'All time' },
                  { label: 'Students', value: users.length, hint: 'Active users' },
                ].map(({ label, value, hint }) => (
                  <div key={label} className="card p-5">
                    <p className="text-xs text-gray-400 mb-2">{label}</p>
                    <p className="text-2xl font-semibold text-gray-900 mb-1">{loading ? '...' : value}</p>
                    <p className="text-xs text-gray-400">{hint}</p>
                  </div>
                ))}
              </div>
              <div className="card p-5">
                <h2 className="section-title mb-4">Events by category</h2>
                <div className="space-y-3">
                  {Object.entries(categoryCount).map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{cat}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-5 bg-blue-500 rounded-full flex items-center pl-2"
                          style={{ width: `${(count / events.length) * 100}%`, minWidth: '2rem' }}>
                          <span className="text-xs text-white font-medium">{count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Colleges */}
          {active === 'colleges' && (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['College', 'City', 'Admin Email', 'Document', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {colleges.map(clg => (
                    <tr key={clg.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                            {clg.name?.[0]}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{clg.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{clg.city}, {clg.state}</td>
                     <td className="px-4 py-3 text-xs text-gray-500">{clg.adminEmail}</td>
<td className="px-4 py-3 text-xs text-gray-600 font-medium">
  {events.filter(e => e.collegeId === clg.id).length} events
</td>
<td className="px-4 py-3">
  {clg.documentURL
                          ? <a href={clg.documentURL} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">View doc</a>
                          : <span className="text-xs text-gray-300">None</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clg.verified ? 'status-approved' : 'status-pending'}>
                          {clg.verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {!clg.verified && (
                            <button onClick={() => handleVerify(clg.id, true)} className="btn-success">Verify</button>
                          )}
                          {clg.verified && (
                            <button onClick={() => handleVerify(clg.id, false)} className="btn-outline text-xs px-2 py-1">Unverify</button>
                          )}
                          <button onClick={() => handleRemove(clg)} className="btn-danger">Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add College */}
          {active === 'add' && (
            <form onSubmit={handleAddCollege} className="max-w-xl space-y-5">
              <div className="card p-5 space-y-4">
                <h2 className="section-title">College information</h2>
                <div>
                  <label className="lbl">College name <span className="text-red-400">*</span></label>
                  <input className="input-field" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} placeholder="e.g. VIT Pune" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="lbl">City</label>
                    <input className="input-field" value={addForm.city} onChange={e => setAddForm({...addForm, city: e.target.value})} placeholder="Pune" />
                  </div>
                  <div>
                    <label className="lbl">State</label>
                    <input className="input-field" value={addForm.state} onChange={e => setAddForm({...addForm, state: e.target.value})} placeholder="Maharashtra" />
                  </div>
                </div>
                <div>
                  <label className="lbl">College document (Registration certificate / AICTE approval)</label>
                  <input type="file" accept=".pdf,.jpg,.png" onChange={e => setDocFile(e.target.files[0])}
                    className="input-field text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-blue-50 file:text-blue-600" />
                  <p className="text-xs text-gray-400 mt-1">Upload official college document for verification</p>
                </div>
              </div>

              <div className="card p-5 space-y-4">
                <h2 className="section-title">Admin credentials</h2>
                <p className="text-xs text-gray-400">These credentials will be emailed to the college admin.</p>
                <div>
                  <label className="lbl">Admin email <span className="text-red-400">*</span></label>
                  <input type="email" className="input-field" value={addForm.adminEmail}
                    onChange={e => setAddForm({...addForm, adminEmail: e.target.value})} placeholder="admin@college.edu.in" required />
                </div>
                <div>
                  <label className="lbl">Admin password <span className="text-red-400">*</span></label>
                  <input type="text" className="input-field" value={addForm.adminPassword}
                    onChange={e => setAddForm({...addForm, adminPassword: e.target.value})} placeholder="Create a strong password" required />
                  <p className="text-xs text-gray-400 mt-1">This will be sent to the admin's email. Ask them to change it after first login.</p>
                </div>
              </div>

              <button type="submit" disabled={adding} className="btn-primary w-full py-3 rounded-xl">
                {adding ? 'Adding college...' : '+ Add College & Send Credentials'}
              </button>
            </form>
          )}

          {/* All Events */}
          {active === 'events' && (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
{['College', 'City', 'Admin Email', 'Events', 'Document', 'Status', 'Actions'].map(h => (                      <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map(ev => (
                    <tr key={ev.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{ev.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{ev.collegeName}</td>
                      <td className="px-4 py-3"><span className={`badge-${ev.category?.toLowerCase().replace(' ', '-') || 'other'}`}>{ev.category}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-400">{ev.date ? new Date(ev.date.toDate()).toLocaleDateString() : 'TBD'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{ev.registrationCount || 0} / {ev.maxSeats}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{ev.fee > 0 ? `₹${ev.fee}` : 'Free'}</td>
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
