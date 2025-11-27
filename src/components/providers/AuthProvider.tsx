'use client'

import { ReactNode, useEffect, useState, createContext, useContext } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebaseClient'
import { getUserProfile, createUserProfile, UserProfile } from '@/lib/firestore'
import { TierType } from '@/lib/usageTracker'

type AuthContextType = {
  user: User | null
  userProfile: UserProfile | null
  tier: TierType
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [tier, setTier] = useState<TierType>('free')
  const [loading, setLoading] = useState(true)

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string, email?: string, displayName?: string) => {
    try {
      let profile = await getUserProfile(uid)
      
      // If profile doesn't exist, create one with Free tier
      if (!profile) {
        console.log('Creating new user profile with Free tier')
        profile = await createUserProfile(uid, { 
          tier: 'free',
          email: email || '',
          displayName: displayName || ''
        })
      }
      
      setUserProfile(profile)
      setTier(profile.tier || 'free')
      console.log('User tier loaded from Firebase:', profile.tier)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Default to free tier on error
      setTier('free')
    }
  }

  // Refresh user profile (call after purchase)
  const refreshUserProfile = async () => {
    if (!user) return
    await fetchUserProfile(user.uid, user.email || undefined, user.displayName || undefined)
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      
      if (u) {
        // User logged in - fetch their profile and tier
        await fetchUserProfile(u.uid, u.email || undefined, u.displayName || undefined)
      } else {
        // User logged out
        setUserProfile(null)
        setTier('free')
      }
      
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider)
    // Profile will be fetched by onAuthStateChanged
  }

  const signOutUser = async () => {
    await signOut(auth)
    setUserProfile(null)
    setTier('free')
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile,
      tier,
      loading, 
      signInWithGoogle, 
      signOutUser,
      refreshUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


