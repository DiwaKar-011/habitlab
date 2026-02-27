'use client'

import Link from 'next/link'
import { Lock, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

/**
 * Wrap any page that guests cannot access.
 * Shows a sign-in / sign-up prompt if the current user is a guest.
 */
export default function GuestGuard({
  children,
  feature = 'this feature',
}: {
  children: React.ReactNode
  feature?: string
}) {
  const { isGuest, loading } = useAuth()

  if (loading) return null

  if (!isGuest) return <>{children}</>

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <Lock size={28} className="text-amber-600 dark:text-amber-400" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Sign in to unlock {feature}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            You&apos;re browsing as a guest. Create a free account or sign in to access {feature} and save your progress.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/signin"
              className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-2.5 rounded-lg font-semibold hover:bg-brand-700 transition-all"
              onClick={() => {
                // Clear guest state before navigating
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('habitlab_guest')
                  document.cookie = 'habitlab_guest=; path=/; max-age=0'
                }
              }}
            >
              <LogIn size={18} />
              Sign In
            </Link>
            <Link
              href="/signup"
              className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('habitlab_guest')
                  document.cookie = 'habitlab_guest=; path=/; max-age=0'
                }
              }}
            >
              <UserPlus size={18} />
              Create Free Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
