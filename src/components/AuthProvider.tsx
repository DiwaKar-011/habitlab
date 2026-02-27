'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth'
import { useRouter } from 'next/navigation'

const GUEST_KEY = 'habitlab_guest'

// Extend FirebaseUser with an `id` alias so existing code using user.id keeps working
type AppUser = FirebaseUser & { id: string }

function wrapUser(firebaseUser: FirebaseUser): AppUser {
  const wrapped = firebaseUser as AppUser
  // Firebase uses .uid – alias it to .id for compatibility
  // Use direct assignment for reliability across React re-renders
  ;(wrapped as any).id = firebaseUser.uid
  return wrapped
}

interface AuthState {
  user: AppUser | null
  loading: boolean
  isGuest: boolean
  signOut: () => Promise<void>
  signInAsGuest: () => void
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isGuest: false,
  signOut: async () => {},
  signInAsGuest: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Guard: if Firebase isn't initialized (e.g. during build/SSG), skip
    if (!auth) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser ? wrapUser(firebaseUser) : null)
      // Set/clear a cookie so the middleware can detect auth state
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken()
        document.cookie = `firebaseAuthToken=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        setIsGuest(false)
        if (typeof window !== 'undefined') localStorage.removeItem(GUEST_KEY)
      } else {
        document.cookie = `firebaseAuthToken=; path=/; max-age=0`
        // If no real user, check for guest
        const guestFlag = typeof window !== 'undefined' && localStorage.getItem(GUEST_KEY)
        setIsGuest(guestFlag === 'true')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const signInAsGuest = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_KEY, 'true')
      // Set a cookie so middleware can detect guest mode
      document.cookie = `${GUEST_KEY}=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
    }
    setIsGuest(true)
    router.push('/dashboard')
  }

  const signOut = async () => {
    // Clear all auth cookies FIRST to prevent middleware redirect loops
    if (typeof window !== 'undefined') {
      document.cookie = 'firebaseAuthToken=; path=/; max-age=0'
      document.cookie = `${GUEST_KEY}=; path=/; max-age=0`
    }
    if (isGuest) {
      setIsGuest(false)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_KEY)
      }
      router.push('/signin')
      router.refresh()
      return
    }
    try {
      await firebaseSignOut(auth!)
    } catch (e) {
      console.error('Sign out error:', e)
    }
    setUser(null)
    router.push('/signin')
    router.refresh()
  }

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, signOut, signInAsGuest }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
