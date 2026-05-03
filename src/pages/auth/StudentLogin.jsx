import { useState } from 'react'
import { signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../../firebase/config'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function StudentLogin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login') // login | signup
  const [form, setForm] = useState({ name: '', college: '', year: '', branch: '', phone: '' })

  const handleGoogle = async () => {
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const { user } = result
      const userRef = doc(db, 'users', user.uid)
      const snap = await getDoc(userRef)
      if (!snap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || '',
          email: user.email,
          photo: user.photoURL || '',
          college: '',
          year: '',
          branch: '',
          phone: '',
          role: 'user',
          bookmarks: [],
          createdAt: new Date(),
        })
        toast.success('Account created! Please complete your profile.')
      } else {
        toast.success('Welcome back!')
      }
      navigate('/app/events')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M2 14s1-1 4-1 5 2 5 2" /><circle cx="8" cy="6" r="3" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-blue-600">CampusConnect</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          {/* Top bar */}
          <div className="h-1 bg-blue-600 -mx-8 -mt-8 mb-8 rounded-t-2xl" />

          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            {mode === 'login'
              ? 'Sign in to explore events across all colleges'
              : 'Join CampusConnect to discover and register for events'}
          </p>

          {/* Google Button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">Google login recommended</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
            <p className="text-xs text-blue-700 text-center">
              Google login is the fastest and most secure way to sign in. Your college email works too!
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Are you a college admin?{' '}
            <Link to="/admin/login" className="text-blue-600 font-medium hover:underline">
              Admin login →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
