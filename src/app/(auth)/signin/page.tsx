'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Beaker, Eye, EyeOff, UserCircle } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, GithubAuthProvider, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { upsertProfile } from '@/lib/db'
import { useAuth } from '@/components/AuthProvider'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resending, setResending] = useState(false)
  const [forgotPassword, setForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)

      // Check email verification for email/password users
      if (!cred.user.emailVerified) {
        setNeedsVerification(true)
        setLoading(false)
        return
      }

      // Ensure profile exists (non-blocking)
      try {
        await upsertProfile({
          id: cred.user.uid,
          email: cred.user.email || email,
          name: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
          avatar_url: cred.user.photoURL || undefined,
        })
      } catch {
        // Profile upsert is non-blocking
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      const code = err?.code || ''
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Invalid email or password. Please check your credentials and try again.')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError(err?.message || 'Something went wrong. Please try again.')
      }
      setLoading(false)
    }
  }

  const handleGitHubSignIn = async () => {
    setError('')
    try {
      const provider = new GithubAuthProvider()
      const result = await signInWithPopup(auth, provider)
      // Ensure profile exists
      try {
        await upsertProfile({
          id: result.user.uid,
          email: result.user.email || '',
          name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          avatar_url: result.user.photoURL || undefined,
        })
      } catch {}
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'GitHub sign-in failed.')
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      try {
        await upsertProfile({
          id: result.user.uid,
          email: result.user.email || '',
          name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          avatar_url: result.user.photoURL || undefined,
        })
      } catch {}
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed.')
    }
  }

  const handleResendVerification = async () => {
    const currentUser = auth.currentUser
    if (!currentUser) return
    setResending(true)
    try {
      await sendEmailVerification(currentUser)
      setError('')
    } catch {
      setError('Failed to resend. Please wait a moment and try again.')
    }
    setResending(false)
  }

  const handleContinueAfterVerification = async () => {
    const currentUser = auth.currentUser
    if (!currentUser) return
    await currentUser.reload()
    if (currentUser.emailVerified) {
      // Ensure profile exists
      try {
        await upsertProfile({
          id: currentUser.uid,
          email: currentUser.email || email,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          avatar_url: currentUser.photoURL || undefined,
        })
      } catch {}
      router.push('/dashboard')
      router.refresh()
    } else {
      setError('Email not verified yet. Please check your inbox and click the verification link.')
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError('')
    if (!resetEmail.trim()) {
      setResetError('Please enter your email address.')
      return
    }
    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim())
      setResetSent(true)
    } catch (err: any) {
      const code = err?.code || ''
      if (code === 'auth/user-not-found') {
        setResetError('No account found with this email.')
      } else if (code === 'auth/invalid-email') {
        setResetError('Please enter a valid email address.')
      } else if (code === 'auth/too-many-requests') {
        setResetError('Too many attempts. Please try again later.')
      } else {
        setResetError(err?.message || 'Something went wrong. Please try again.')
      }
    }
    setResetLoading(false)
  }

  if (forgotPassword) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center">
                <Beaker size={22} className="text-white" />
              </div>
              <span className="font-bold text-xl text-slate-800">HabitLab</span>
            </Link>
            <h1 className="mt-6 text-2xl font-bold text-slate-900">Reset Password</h1>
            <p className="mt-2 text-sm text-slate-500">
              {resetSent ? 'Check your email for the reset link' : 'Enter your email to receive a reset link'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            {resetSent ? (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-green-600">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <polyline points="22,4 12,13 2,4" />
                  </svg>
                </div>
                <p className="text-slate-700 font-medium mb-2">Reset Email Sent!</p>
                <p className="text-slate-500 text-sm mb-6">
                  We&apos;ve sent a password reset link to <span className="font-semibold text-brand-600">{resetEmail}</span>. Click the link in the email to set a new password.
                </p>
                <button
                  onClick={() => { setForgotPassword(false); setResetSent(false); setResetEmail(''); setResetError('') }}
                  className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-semibold hover:bg-brand-700 transition-all"
                >
                  Back to Sign In
                </button>
                <p className="text-xs text-slate-400 mt-4">Don&apos;t see it? Check your spam folder.</p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                {resetError && (
                  <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
                    {resetError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                    placeholder="you@example.com"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 transition-all"
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => { setForgotPassword(false); setResetError('') }}
                  className="w-full text-slate-500 py-2 rounded-lg font-medium hover:bg-slate-50 transition-all text-sm"
                >
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Beaker size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Verify Your Email</h1>
            <p className="mt-2 text-sm text-slate-500">Your email is not verified yet.</p>
            <p className="text-sm font-semibold text-brand-600 mt-1">{email}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-brand-50 rounded-full flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-600">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <polyline points="22,4 12,13 2,4" />
              </svg>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              Please verify your email to sign in. Check your inbox for the verification link.
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleContinueAfterVerification}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-semibold hover:bg-brand-700 transition-all mb-3"
            >
              I&apos;ve Verified — Continue
            </button>

            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="w-full text-brand-600 py-2.5 rounded-lg font-medium hover:bg-brand-50 transition-all text-sm disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </button>

            <p className="text-xs text-slate-400 mt-4">
              Don&apos;t see the email? Check your spam folder.
            </p>
          </div>
        </div>
      </div>
    )
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
          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-all mb-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

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
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => { setForgotPassword(true); setResetEmail(email) }}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium hover:underline"
                >
                  Forgot Password?
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
