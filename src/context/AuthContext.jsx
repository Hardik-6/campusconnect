import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [collegeId, setCollegeId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {

        // 1. Check if Super Admin by email
        if (firebaseUser.email === "hp303164@gmail.com")
 {
          setUser(firebaseUser)
          setRole('superadmin')
          setCollegeId(null)
          setLoading(false)
          return
        }

        // 2. Check admin collection by UID
        const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid))
        if (adminDoc.exists()) {
          setUser(firebaseUser)
          setRole('admin')
          setCollegeId(adminDoc.data().collegeId)
          setLoading(false)
          return
        }

        // 3. Check admin collection by email (for Google login)
        const adminQ = query(
          collection(db, 'admins'),
          where('email', '==', firebaseUser.email)
        )
        const adminSnap = await getDocs(adminQ)
        if (!adminSnap.empty) {
          const adminData = adminSnap.docs[0].data()
          setUser(firebaseUser)
          setRole('admin')
          setCollegeId(adminData.collegeId)
          setLoading(false)
          return
        }

        // 4. Regular student user
        const userRef = doc(db, 'users', firebaseUser.uid)
        const userDoc = await getDoc(userRef)
        if (userDoc.exists()) {
          setUser({ ...firebaseUser, ...userDoc.data() })
        } else {
          setUser(firebaseUser)
        }
        setRole('user')
        setCollegeId(null)

      } else {
        setUser(null)
        setRole(null)
        setCollegeId(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setRole(null)
    setCollegeId(null)
  }

  return (
    <AuthContext.Provider value={{ user, role, collegeId, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
