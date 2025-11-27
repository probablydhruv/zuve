import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, enableMultiTabIndexedDbPersistence, onSnapshotsInSync } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'

// Firebase configuration for zuve-jewellery project
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export const storage = getStorage(app)

// Secondary Firebase app for Cloud Functions (zuvestudio50)
// The AI functions are deployed to zuvestudio50, not zuve-jewellery
const functionsConfig = {
  apiKey: process.env.NEXT_PUBLIC_FUNCTIONS_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FUNCTIONS_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FUNCTIONS_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FUNCTIONS_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FUNCTIONS_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FUNCTIONS_APP_ID,
}

// Initialize a separate app for functions, or get existing one
const functionsApp = getApps().find(a => a.name === 'functionsApp') 
  || initializeApp(functionsConfig, 'functionsApp')

export const functions = getFunctions(functionsApp, 'asia-south1')

// Enable multi-tab persistence for Firestore (supports multiple tabs)
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      // This is expected and handled gracefully
      console.warn('Firestore persistence: Multiple tabs detected (this is normal)')
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required
      console.warn('Firestore persistence is not available in this browser')
    } else {
      console.error('Error enabling Firestore persistence:', err)
    }
  })
}

// Monitor Firestore connection status
if (typeof window !== 'undefined') {
  onSnapshotsInSync(db, () => {
    console.log('Firestore is in sync (connected)')
  })
}

export const initAnalytics = () => {
  if (typeof window === 'undefined') return
  import('firebase/analytics').then(({ getAnalytics }) => {
    try { getAnalytics(app) } catch {}
  })
}


