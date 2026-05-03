import { useState } from 'react'
import { collection, addDoc, Timestamp,doc,getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import toast from 'react-hot-toast'

const CATEGORIES = ['Hackathon', 'Quiz', 'Competition', 'Idea Pitch', 'Cultural', 'Other']

export default function PostEvent() {
  const { collegeId, user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', category: 'Hackathon', description: '', date: '', time: '',
    venue: '', isOnline: false, fee: '', prize: '', isTeam: true,
    minTeam: 2, maxTeam: 4, maxSeats: 100, deadline: '', contact: '',
    collegeName: '',
  })

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.description || !form.date || !form.venue || !form.deadline) {
      toast.error('Please fill all required fields')
      return
    }
    setLoading(true)
    try {
      const dateTime = new Date(`${form.date}T${form.time || '09:00'}`)
      const deadlineDate = new Date(form.deadline)
      await addDoc(collection(db, 'events'), {
        name: form.name,
        category: form.category,
        description: form.description,
        date: Timestamp.fromDate(dateTime),
        venue: form.isOnline ? 'Online' : form.venue,
        isOnline: form.isOnline,
        fee: Number(form.fee) || 0,
        prize: Number(form.prize) || 0,
        isTeam: form.isTeam,
        minTeam: form.isTeam ? Number(form.minTeam) : 1,
        maxTeam: form.isTeam ? Number(form.maxTeam) : 1,
        maxSeats: Number(form.maxSeats),
        deadline: Timestamp.fromDate(deadlineDate),
        contact: form.contact,
        collegeId,
        collegeName: form.collegeName,
        registrationCount: 0,
        createdAt: Timestamp.now(),
        createdBy: user.uid,
      })
   sessionStorage.removeItem('cc_events')
toast.success('Event posted successfully!')
navigate('/admin/events')
    } catch (err) {
      toast.error('Failed to post event')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1">
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
              <path d="M10 12L6 8l4-4"/>
            </svg>
          </button>
          <div>
            <h1 className="text-base font-semibold text-gray-900">Post new event</h1>
            <p className="text-xs text-gray-400">Fill in the details for your event</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-5">
          {/* Basic Info */}
          <div className="card p-5 space-y-4">
            <h2 className="section-title">Basic information</h2>
            <div>
              <label className="lbl">Event name <span className="text-red-400">*</span></label>
              <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. HackSphere 2025" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lbl">Category</label>
                <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="lbl">College name <span className="text-red-400">*</span></label>
                <input className="input-field" value={form.collegeName} onChange={e => set('collegeName', e.target.value)} placeholder="Your college name" required />
              </div>
            </div>
            <div>
              <label className="lbl">Description <span className="text-red-400">*</span></label>
              <textarea className="input-field min-h-24 resize-none" value={form.description}
                onChange={e => set('description', e.target.value)} placeholder="Describe your event..." required />
            </div>
          </div>

          {/* Date & Venue */}
          <div className="card p-5 space-y-4">
            <h2 className="section-title">Date & Venue</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lbl">Date <span className="text-red-400">*</span></label>
                <input type="date" className="input-field" value={form.date} onChange={e => set('date', e.target.value)} required />
              </div>
              <div>
                <label className="lbl">Time</label>
                <input type="time" className="input-field" value={form.time} onChange={e => set('time', e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" id="online" checked={form.isOnline} onChange={e => set('isOnline', e.target.checked)} className="accent-blue-600" />
              <label htmlFor="online" className="text-sm text-gray-600 cursor-pointer">This is an online event</label>
            </div>
            {!form.isOnline && (
              <div>
                <label className="lbl">Venue <span className="text-red-400">*</span></label>
                <input className="input-field" value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="e.g. Main Auditorium, VIT Pune" />
              </div>
            )}
            <div>
              <label className="lbl">Registration deadline <span className="text-red-400">*</span></label>
              <input type="date" className="input-field" value={form.deadline} onChange={e => set('deadline', e.target.value)} required />
            </div>
          </div>

          {/* Registration */}
          <div className="card p-5 space-y-4">
            <h2 className="section-title">Registration details</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={form.isTeam} onChange={() => set('isTeam', true)} className="accent-blue-600" />
                <span className="text-sm text-gray-700">Team event</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!form.isTeam} onChange={() => set('isTeam', false)} className="accent-blue-600" />
                <span className="text-sm text-gray-700">Individual event</span>
              </label>
            </div>
            {form.isTeam && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lbl">Min team size</label>
                  <input type="number" min="1" className="input-field" value={form.minTeam} onChange={e => set('minTeam', e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Max team size</label>
                  <input type="number" min="1" className="input-field" value={form.maxTeam} onChange={e => set('maxTeam', e.target.value)} />
                </div>
              </div>
            )}
            <div>
              <label className="lbl">Max seats (total registrations allowed)</label>
              <input type="number" min="1" className="input-field" value={form.maxSeats} onChange={e => set('maxSeats', e.target.value)} />
            </div>
          </div>

          {/* Prize & Fee */}
          <div className="card p-5 space-y-4">
            <h2 className="section-title">Prize & Fee</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lbl">Registration fee (₹)</label>
                <input type="number" min="0" className="input-field" value={form.fee} onChange={e => set('fee', e.target.value)} placeholder="0 for free" />
              </div>
              <div>
                <label className="lbl">Total prize pool (₹)</label>
                <input type="number" min="0" className="input-field" value={form.prize} onChange={e => set('prize', e.target.value)} placeholder="e.g. 50000" />
              </div>
            </div>
            {form.fee > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-xs text-orange-700">
                💡 Payment will be collected offline at venue. Students are informed of this during registration.
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="card p-5">
            <h2 className="section-title mb-3">Contact information</h2>
            <input className="input-field" value={form.contact} onChange={e => set('contact', e.target.value)}
              placeholder="e.g. Prof. Sharma · +91 98765 43210" />
          </div>

          <div className="flex gap-3 pb-8">
            <button type="button" onClick={() => navigate(-1)} className="btn-outline flex-1 py-3 rounded-xl">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 rounded-xl">
              {loading ? 'Posting...' : '📅 Post Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
