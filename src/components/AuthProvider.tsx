'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const GUEST_KEY = 'habitlab_guest'

interface AuthState {
  user: SupabaseUser | null
  session: Session | null
  loading: boolean
  isGuest: boolean
  signOut: () => Promise<void>
  signInAsGuest: () => void
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  isGuest: false,
  signOut: async () => {},
  signInAsGuest: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      // If no real session, check for guest
      if (!session?.user) {
        const guestFlag = typeof window !== 'undefined' && localStorage.getItem(GUEST_KEY)
        setIsGuest(guestFlag === 'true')
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      // If user signs in for real, clear guest flag
      if (session?.user) {
        setIsGuest(false)
        if (typeof window !== 'undefined') localStorage.removeItem(GUEST_KEY)
      }
      setLoading(false)
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

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
    if (isGuest) {
      setIsGuest(false)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_KEY)
        document.cookie = `${GUEST_KEY}=; path=/; max-age=0`
      }
      router.push('/signin')
      return
    }
    await supabase.auth.signOut()
    router.push('/signin')
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, isGuest, signOut, signInAsGuest }}>
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
