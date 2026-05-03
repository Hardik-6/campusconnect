import { useState } from 'react'
import { collection, addDoc, updateDoc, doc, increment, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { sendAdminNewRegistrationEmail } from '../services/emailService'
import toast from 'react-hot-toast'

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate']

const emptyMember = () => ({ name: '', email: '', college: '', year: '', branch: '', phone: '' })

export default function RegisterModal({ event, college, onClose, onSuccess }) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [personal, setPersonal] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    college: '',
    year: '',
    branch: '',
  })

  const [teamName, setTeamName] = useState('')
  const [members, setMembers] = useState([{ ...emptyMember(), name: user?.displayName || '', email: user?.email || '' }])

  const updateMember = (i, field, value) => {
    const updated = [...members]
    updated[i][field] = value
    setMembers(updated)
  }

  const addMember = () => {
    if (members.length < event.maxTeam) setMembers([...members, emptyMember()])
    else toast.error(`Max ${event.maxTeam} members allowed`)
  }

  const removeMember = (i) => {
    if (members.length > event.minTeam) setMembers(members.filter((_, idx) => idx !== i))
    else toast.error(`Minimum ${event.minTeam} members required`)
  }

  const handleSubmit = async () => {
    if (!personal.phone || !personal.college || !personal.year || !personal.branch) {
      toast.error('Please fill all personal details')
      return
    }
    if (event.isTeam && !teamName.trim()) {
      toast.error('Please enter a team name')
      return
    }
    if (event.isTeam && members.length < event.minTeam) {
      toast.error(`Minimum ${event.minTeam} members required`)
      return
    }
    setLoading(true)
    try {
      const regData = {
        eventId: event.id,
        eventName: event.name,
        collegeId: event.collegeId,
        userId: user.uid,
        userEmail: user.email,
        status: 'pending',
        createdAt: new Date(),
        isTeam: event.isTeam,
        teamName: event.isTeam ? teamName : personal.name,
        leadName: personal.name,
        leadEmail: personal.email,
        leadPhone: personal.phone,
        leadCollege: personal.college,
        leadYear: personal.year,
        leadBranch: personal.branch,
        members: event.isTeam ? members : [personal],
      }

      await addDoc(collection(db, 'registrations'), regData)
      await updateDoc(doc(db, 'events', event.id), { registrationCount: increment(1) })

      // Notify admin via email
      const adminSnap = await getDoc(doc(db, 'colleges', event.collegeId))
      if (adminSnap.exists() && adminSnap.data().adminEmail) {
        await sendAdminNewRegistrationEmail({
          adminEmail: adminSnap.data().adminEmail,
          teamName: event.isTeam ? teamName : personal.name,
          eventName: event.name,
          memberCount: event.isTeam ? members.length : 1,
        })
      }

      toast.success('Registered successfully! Waiting for admin approval.')
      onSuccess()
    } catch (err) {
      toast.error('Registration failed. Try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Register for {event.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{college?.name} · {event.isTeam ? `Team (${event.minTeam}–${event.maxTeam} members)` : 'Individual'}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">✕</button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-50">
          {['Your details', event.isTeam ? 'Team details' : null, 'Confirm'].filter(Boolean).map((label, i) => {
            const stepNum = i + 1
            const totalSteps = event.isTeam ? 3 : 2
            const active = step === stepNum
            const done = step > stepNum
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${active ? 'bg-blue-600 text-white' : done ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                    {done ? '✓' : stepNum}
                  </div>
                  <span className="text-xs font-medium">{label}</span>
                </div>
                {stepNum < (event.isTeam ? 3 : 2) && <div className="h-px w-6 bg-gray-200" />}
              </div>
            )
          })}
        </div>

        <div className="p-5">
          {/* Step 1 — Personal Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Your personal details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="lbl">Full name <span className="text-red-400">*</span></label>
                  <input className="input-field" value={personal.name}
                    onChange={e => setPersonal({ ...personal, name: e.target.value })} placeholder="Your full name" />
                </div>
                <div className="col-span-2">
                  <label className="lbl">Email address <span className="text-red-400">*</span></label>
                  <input className="input-field" value={personal.email} readOnly
                    onChange={e => setPersonal({ ...personal, email: e.target.value })} placeholder="your@email.com" />
                </div>
                <div>
                  <label className="lbl">Phone number <span className="text-red-400">*</span></label>
                  <input className="input-field" value={personal.phone} type="tel"
                    onChange={e => setPersonal({ ...personal, phone: e.target.value })} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="lbl">College name <span className="text-red-400">*</span></label>
                  <input className="input-field" value={personal.college}
                    onChange={e => setPersonal({ ...personal, college: e.target.value })} placeholder="Your college" />
                </div>
                <div>
                  <label className="lbl">Year <span className="text-red-400">*</span></label>
                  <select className="input-field" value={personal.year}
                    onChange={e => setPersonal({ ...personal, year: e.target.value })}>
                    <option value="">Select year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="lbl">Branch / Department <span className="text-red-400">*</span></label>
                  <input className="input-field" value={personal.branch}
                    onChange={e => setPersonal({ ...personal, branch: e.target.value })} placeholder="e.g. Computer Science" />
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => {
                    if (!personal.name || !personal.phone || !personal.college || !personal.year || !personal.branch) {
                      toast.error('Please fill all fields')
                      return
                    }
                    setStep(event.isTeam ? 2 : 3)
                  }}
                  className="btn-primary px-6 py-2.5 rounded-xl"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Team Details */}
          {step === 2 && event.isTeam && (
            <div className="space-y-4">
              <div>
                <label className="lbl">Team name <span className="text-red-400">*</span></label>
                <input className="input-field" value={teamName}
                  onChange={e => setTeamName(e.target.value)} placeholder="Enter your team name" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-gray-700">Team members ({members.length}/{event.maxTeam})</h3>
                <button onClick={addMember} className="text-xs text-blue-600 hover:underline">+ Add member</button>
              </div>
              {members.map((member, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">{i + 1}</div>
                      <span className="text-xs font-medium text-gray-700">{i === 0 ? 'Team Leader (You)' : `Member ${i + 1}`}</span>
                    </div>
                    {i > 0 && (
                      <button onClick={() => removeMember(i)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="lbl">Full name</label>
                      <input className="input-field" value={member.name}
                        onChange={e => updateMember(i, 'name', e.target.value)} placeholder="Member name" />
                    </div>
                    <div>
                      <label className="lbl">Email</label>
                      <input className="input-field" value={member.email} readOnly={i === 0}
                        onChange={e => updateMember(i, 'email', e.target.value)} placeholder="member@email.com" />
                    </div>
                    <div>
                      <label className="lbl">College</label>
                      <input className="input-field" value={member.college}
                        onChange={e => updateMember(i, 'college', e.target.value)} placeholder="College name" />
                    </div>
                    <div>
                      <label className="lbl">Year & Branch</label>
                      <input className="input-field" value={member.branch}
                        onChange={e => updateMember(i, 'branch', e.target.value)} placeholder="e.g. 2nd Yr · CS" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-between mt-2">
                <button onClick={() => setStep(1)} className="btn-outline px-5 py-2.5 rounded-xl">← Back</button>
                <button onClick={() => {
                  if (!teamName.trim()) { toast.error('Enter team name'); return }
                  if (members.some(m => !m.name || !m.email)) { toast.error('Fill all member details'); return }
                  setStep(3)
                }} className="btn-primary px-6 py-2.5 rounded-xl">Next →</button>
              </div>
            </div>
          )}

          {/* Step 3 — Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Review your registration</h3>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Event</span>
                  <span className="font-medium text-gray-800">{event.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">College</span>
                  <span className="font-medium text-gray-800">{college?.name}</span>
                </div>
                {event.isTeam && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Team name</span>
                    <span className="font-medium text-gray-800">{teamName}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Your name</span>
                  <span className="font-medium text-gray-800">{personal.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Your college</span>
                  <span className="font-medium text-gray-800">{personal.college}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Year & Branch</span>
                  <span className="font-medium text-gray-800">{personal.year} · {personal.branch}</span>
                </div>
                {event.isTeam && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Team size</span>
                    <span className="font-medium text-gray-800">{members.length} members</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-blue-100 pt-2 mt-2">
                  <span className="text-gray-500">Registration fee</span>
                  <span className="font-semibold text-gray-800">{event.fee > 0 ? `₹${event.fee} (offline)` : 'Free'}</span>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                <p className="text-xs text-orange-700">
                  Your registration will be <strong>pending</strong> until the college admin approves it. You'll see the status in My Registrations.
                </p>
              </div>

              <div className="flex justify-between mt-2">
                <button onClick={() => setStep(event.isTeam ? 2 : 1)} className="btn-outline px-5 py-2.5 rounded-xl">← Back</button>
                <button onClick={handleSubmit} disabled={loading}
                  className="btn-primary px-6 py-2.5 rounded-xl">
                  {loading ? 'Submitting...' : 'Confirm Registration ✓'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
