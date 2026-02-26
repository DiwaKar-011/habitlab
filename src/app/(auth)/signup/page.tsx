'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Beaker, Eye, EyeOff } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validatePassword = (pw: string) => {
    if (pw.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(pw)) return 'Password must contain at least 1 uppercase letter'
    if (!/[0-9]/.test(pw)) return 'Password must contain at least 1 number'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const pwError = validatePassword(password)
    if (pwError) {
      setError(pwError)
      return
    }

    setLoading(true)

    // In production, call supabase.auth.signUp({ email, password, options: { data: { name } } })
    // For demo, simulate signup
    setTimeout(() => {
      setLoading(false)
      router.push('/dashboard')
    }, 1000)
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
          <h1 className="mt-6 text-2xl font-bold text-slate-900">Create Your Account</h1>
          <p className="mt-2 text-sm text-slate-500">Start your first behavior experiment</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                placeholder="Alex Chen"
              />
            </div>

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
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Min 8 characters, 1 uppercase, 1 number
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 transition-all"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/signin" className="text-brand-600 font-medium hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
