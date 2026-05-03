import { useState } from 'react'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../../firebase/config'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

export default function AdminLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleGoogle = async () => {
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const adminDoc = await getDoc(doc(db, 'admins', result.user.uid))
      if (!adminDoc.exists()) {
        toast.error('No admin account found. Contact Super Admin.')
        await auth.signOut()
        return
      }
      toast.success('Welcome back!')
      navigate('/admin/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password)
      toast.success('Welcome back!')
      navigate('/admin/dashboard')
    } catch (err) {
      toast.error('Invalid credentials. Contact Super Admin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5">
              <rect x="2" y="7" width="12" height="8" rx="1.5" />
              <path d="M5 7V5a3 3 0 016 0v2" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-slate-800">CampusConnect</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="h-1 bg-slate-800 -mx-8 -mt-8 mb-8 rounded-t-2xl" />

          <h2 className="text-xl font-semibold text-gray-900 mb-1">College admin portal</h2>
          <p className="text-sm text-gray-400 mb-6">Sign in to manage your college events</p>

          {/* Google Button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5">
            <p className="text-xs text-slate-600">
              Admin accounts are created by the Super Admin after your college is verified.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="lbl">Admin email</label>
              <input
                type="email"
                className="input-field"
                placeholder="admin@yourcollege.edu.in"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="lbl">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 text-white py-3 rounded-xl text-sm font-medium hover:bg-slate-900 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in to dashboard →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            Not an admin?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">Student login →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
