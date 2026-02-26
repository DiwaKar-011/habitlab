'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, XCircle, Smile, Frown, Meh } from 'lucide-react'
import Link from 'next/link'
import { getHabit, getStreak, createLog } from '@/lib/db'
import { useAuth } from '@/components/AuthProvider'
import type { Habit, Streak } from '@/types'

const moodEmojis = [
  { value: 1, emoji: '😢', label: 'Terrible' },
  { value: 2, emoji: '😞', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
]

const failureReasons = [
  { value: 'tired', label: '😴 Tired' },
  { value: 'busy', label: '⏰ Busy' },
  { value: 'forgot', label: '🤔 Forgot' },
  { value: 'low_motivation', label: '😞 Low Motivation' },
  { value: 'other', label: '📝 Other' },
]

export default function DailyLogPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const habitId = params.id as string
  const [habit, setHabit] = useState<Habit | null>(null)
  const [streak, setStreakData] = useState<Streak | null>(null)
  const [pageLoading, setPageLoading] = useState(true)

  const [step, setStep] = useState<'choice' | 'yes' | 'no' | 'done'>('choice')
  const [completionTime, setCompletionTime] = useState('')
  const [moodRating, setMoodRating] = useState(3)
  const [energyRating, setEnergyRating] = useState(3)
  const [notes, setNotes] = useState('')
  const [failureReason, setFailureReason] = useState('')
  const [failureNotes, setFailureNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [h, s] = await Promise.all([getHabit(habitId), getStreak(habitId)])
      setHabit(h)
      setStreakData(s)
      setPageLoading(false)
    }
    load()
  }, [habitId])

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  if (!habit) {
    return (
      <div className="text-center py-20 text-slate-500">
        Habit not found. <Link href="/dashboard" className="text-brand-600 hover:underline">Go back</Link>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await createLog({
        habit_id: habitId,
        user_id: user.id,
        log_date: today,
        completed: step === 'yes',
        completion_time: step === 'yes' ? completionTime || undefined : undefined,
        mood_rating: moodRating,
        energy_rating: step === 'yes' ? energyRating : undefined,
        notes: notes || undefined,
        failure_reason: step === 'no' ? failureReason || undefined : undefined,
        failure_notes: step === 'no' ? failureNotes || undefined : undefined,
      })
      setStep('done')
    } catch (err) {
      console.error('Failed to log', err)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{habit.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        {streak && (
          <p className="text-xs text-slate-400 mt-1">
            Current streak: 🔥 {streak.current_streak} days
          </p>
        )}
      </div>

      {/* Step: Choice */}
      {step === 'choice' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-lg font-semibold text-center text-slate-700 dark:text-slate-200 mb-6">
            Did you complete this habit today?
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setStep('yes')}
              className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center hover:border-green-400 hover:bg-green-100 transition-all"
            >
              <CheckCircle size={40} className="mx-auto text-green-500 mb-2" />
              <span className="text-lg font-semibold text-green-700">Yes!</span>
              <p className="text-xs text-green-500 mt-1">I did it today</p>
            </button>
            <button
              onClick={() => setStep('no')}
              className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center hover:border-red-400 hover:bg-red-100 transition-all"
            >
              <XCircle size={40} className="mx-auto text-red-400 mb-2" />
              <span className="text-lg font-semibold text-red-600">No</span>
              <p className="text-xs text-red-400 mt-1">I missed today</p>
            </button>
          </div>
        </motion.div>
      )}

      {/* Step: Yes */}
      {step === 'yes' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                What time did you complete it?
              </label>
              <input
                type="time"
                value={completionTime}
                onChange={(e) => setCompletionTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Mood Rating
              </label>
              <div className="flex justify-between gap-1.5 sm:gap-2">
                {moodEmojis.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMoodRating(m.value)}
                    className={`flex-1 py-3 rounded-lg border text-center transition-all ${
                      moodRating === m.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{m.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Energy Rating: {energyRating}/5
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={energyRating}
                onChange={(e) => setEnergyRating(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Low ⚡</span>
                <span>Medium</span>
                <span>High ⚡⚡⚡</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
                placeholder="How did it go?"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-all"
          >
            {loading ? 'Saving...' : '✅ Log Completion'}
          </button>
        </motion.div>
      )}

      {/* Step: No */}
      {step === 'no' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                What got in the way?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {failureReasons.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setFailureReason(r.value)}
                    className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      failureReason === r.value
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {failureReason === 'other' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tell us more
                </label>
                <textarea
                  value={failureNotes}
                  onChange={(e) => setFailureNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
                  placeholder="What happened?"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mood Rating
              </label>
              <div className="flex justify-between gap-2">
                {moodEmojis.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMoodRating(m.value)}
                    className={`flex-1 py-3 rounded-lg border text-center transition-all ${
                      moodRating === m.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !failureReason}
            className="w-full bg-slate-700 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50 transition-all"
          >
            {loading ? 'Saving...' : '📝 Log Entry'}
          </button>
        </motion.div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Log Saved!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Your data has been recorded for your experiment.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-700 transition-all"
          >
            Back to Dashboard
          </Link>
        </motion.div>
      )}
    </div>
  )
}
