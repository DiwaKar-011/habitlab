'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Beaker, Eye, EyeOff, UserCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from '@/components/AuthProvider'

export default function SignInPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleResendConfirmation = async () => {
    if (!email) return
    setResending(true)
    setResent(false)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setResending(false)
    if (!error) setResent(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShowResend(false)
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        // Friendly error messages
        if (signInError.message.toLowerCase().includes('email not confirmed')) {
          setError('Your email is not confirmed yet. Please check your inbox (and spam folder) for the confirmation link.')
          setShowResend(true)
        } else if (signInError.message.toLowerCase().includes('invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else {
          setError(signInError.message)
        }
        setLoading(false)
        return
      }

      // Ensure profile exists (non-blocking)
      if (data.user) {
        try {
          await supabase.from('profiles').upsert(
            {
              id: data.user.id,
              email: data.user.email,
              name:
                data.user.user_metadata?.full_name ||
                data.user.user_metadata?.name ||
                data.user.email?.split('@')[0] || 'User',
              avatar_url:
                data.user.user_metadata?.avatar_url ||
                data.user.user_metadata?.picture || null,
            },
            { onConflict: 'id' }
          )
        } catch {
          // Profile upsert is non-blocking – don't break the sign-in flow
        }
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleGitHubSignIn = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center">
              <Beaker size={22} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800">HabitLab</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-500">Continue your experiments</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {/* GitHub Sign In */}
          <button
            type="button"
            onClick={handleGitHubSignIn}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 border border-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-all mb-6"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-slate-400">or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
                {error}
                {showResend && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resending}
                    className="block mt-2 text-brand-600 font-medium hover:underline disabled:opacity-50"
                  >
                    {resending ? 'Resending...' : resent ? 'Confirmation email resent!' : 'Resend confirmation email'}
                  </button>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 transition-all"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-brand-600 font-medium hover:underline">
              Sign Up
            </Link>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-slate-400">or</span>
            </div>
          </div>

          {/* Guest Sign In */}
          <GuestButton />
        </div>
      </div>
    </div>
  )
}

function GuestButton() {
  const { signInAsGuest } = useAuth()
  return (
    <button
      type="button"
      onClick={signInAsGuest}
      className="w-full flex items-center justify-center gap-2 bg-slate-100 border border-slate-200 text-slate-600 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-all"
    >
      <UserCircle size={20} />
      Continue as Guest
    </button>
  )
}
