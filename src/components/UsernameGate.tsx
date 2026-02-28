'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Beaker, Check, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { getProfile, upsertProfile, isUsernameTaken } from '@/lib/db'

export default function UsernameGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, isGuest } = useAuth()
  const [checking, setChecking] = useState(true)
  const [needsUsername, setNeedsUsername] = useState(false)
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [checkingAvail, setCheckingAvail] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user || isGuest) {
      setChecking(false)
      return
    }

    const checkProfile = async () => {
      try {
        const profile = await getProfile(user.id)
        if (!profile?.username) {
          setNeedsUsername(true)
        }
      } catch (err) {
        console.error('Username check error:', err)
      }
      setChecking(false)
    }
    checkProfile()
  }, [user, authLoading, isGuest])

  const validateUsername = (un: string) => {
    if (un.length < 3) return 'Username must be at least 3 characters'
    if (un.length > 20) return 'Username must be at most 20 characters'
    if (!/^[a-z0-9._]+$/.test(un)) return 'Only lowercase letters, numbers, . and _ allowed'
    if (/^[._]/.test(un) || /[._]$/.test(un)) return 'Cannot start or end with . or _'
    if (/[._]{2}/.test(un)) return 'Cannot have consecutive . or _ characters'
    return null
  }

  const handleSetUsername = async () => {
    if (!user) return
    const un = username.toLowerCase().trim()
    const validationError = validateUsername(un)
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')
    try {
      const taken = await isUsernameTaken(un)
      if (taken) {
        setError('This username is already taken. Try another one!')
        setSaving(false)
        return
      }

      await upsertProfile({ id: user.id, username: un })
      setNeedsUsername(false)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
    }
    setSaving(false)
  }

  const handleUsernameBlur = async () => {
    if (username.length < 3) return
    const validationError = validateUsername(username)
    if (validationError) { setError(validationError); return }
    setCheckingAvail(true)
    try {
      const taken = await isUsernameTaken(username.toLowerCase().trim())
      if (taken) setError('This username is already taken')
      else setError('')
    } catch {}
    setCheckingAvail(false)
  }

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mx-auto mb-3"></div>
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (needsUsername && user && !isGuest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50/30 to-purple-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Beaker size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome to HabitLab!</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Before you start, choose a unique username. Your friends will use this to find and add you.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Choose your username
            </label>
            <div className="relative mb-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '')
                  setUsername(val)
                  setError('')
                }}
                onBlur={handleUsernameBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleSetUsername()}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-slate-900 dark:text-white dark:bg-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition text-lg ${
                  error ? 'border-red-400' : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="your_username"
                maxLength={20}
                autoFocus
              />
              {checkingAvail && (
                <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
              )}
            </div>

            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1 mb-3">
                <AlertCircle size={14} /> {error}
              </p>
            )}
            {!error && username.length >= 3 && !checkingAvail && (
              <p className="text-sm text-green-500 flex items-center gap-1 mb-3">
                <Check size={14} /> Username available!
              </p>
            )}

            <p className="text-xs text-slate-400 mb-4">
              3-20 characters. Lowercase letters, numbers, . and _ only. This is permanent and cannot be changed.
            </p>

            <button
              onClick={handleSetUsername}
              disabled={saving || username.length < 3 || !!error}
              className="w-full bg-gradient-to-r from-brand-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-brand-700 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-lg"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Setting up...
                </>
              ) : (
                <>
                  <Check size={18} /> Continue to HabitLab
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Your username is how friends will find you. Make it memorable!
          </p>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}
