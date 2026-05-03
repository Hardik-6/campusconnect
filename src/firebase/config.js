import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyAiIvCDIQ5EpQiiyvPijB6ao9TYheioGfo",
  authDomain: "campusconnect-00.firebaseapp.com",
  projectId: "campusconnect-00",
  storageBucket: "campusconnect-00.firebasestorage.app",
  messagingSenderId: "202165603210",
  appId: "1:202165603210:web:74ebdb3f1fdf45c2c05673"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

export default app

