'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, XCircle, Smile, Frown, Meh, Sparkles, TrendingUp, Flame, Trophy } from 'lucide-react'
import Link from 'next/link'
import { getHabit, getStreak, createLog, recalculateStreak, updateProfileXP, checkAndAwardBadges, celebrateStreakMilestone } from '@/lib/db'
import { addNotification, sendBrowserNotification, getPermissionStatus } from '@/lib/notificationStore'
import { predictHabitBenefits, getStreakMilestoneMessage, getRandomRoast } from '@/lib/motivationQuotes'
import { calculateXPForLog } from '@/lib/scoring'
import { useAuth } from '@/components/AuthProvider'
import type { Habit, Streak } from '@/types'

const moodEmojis = [
  { value: 1, emoji: '--', label: 'Terrible' },
  { value: 2, emoji: '-', label: 'Bad' },
  { value: 3, emoji: '~', label: 'Okay' },
  { value: 4, emoji: '+', label: 'Good' },
  { value: 5, emoji: '++', label: 'Great' },
]

const failureReasons = [
  { value: 'tired', label: 'Tired' },
  { value: 'busy', label: 'Busy' },
  { value: 'forgot', label: 'Forgot' },
  { value: 'low_motivation', label: 'Low Motivation' },
  { value: 'other', label: 'Other' },
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
  const [prediction, setPrediction] = useState<{ nextMilestone: number; benefits: string[]; scienceFact: string } | null>(null)
  const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null)
  const [newBadgeIds, setNewBadgeIds] = useState<string[]>([])
  const [xpEarned, setXpEarned] = useState(0)
  const [error, setError] = useState<string | null>(null)

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
    if (!user) {
      setError('You must be signed in to log. Please sign in first.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const today = new Date().toISOString().split('T')[0]
      const completed = step === 'yes'
      await createLog({
        habit_id: habitId,
        user_id: user.id,
        log_date: today,
        completed,
        completion_time: completed ? completionTime || undefined : undefined,
        mood_rating: moodRating,
        energy_rating: completed ? energyRating : undefined,
        notes: notes || undefined,
        failure_reason: !completed ? failureReason || undefined : undefined,
        failure_notes: !completed ? failureNotes || undefined : undefined,
      })

      // Recalculate streak
      await recalculateStreak(habitId, user.id)
      const updatedStreakData = await getStreak(habitId)
      const newStreakCount = updatedStreakData?.current_streak || (streak?.current_streak || 0) + (completed ? 1 : 0)

      // Award XP
      const xp = calculateXPForLog(completed, newStreakCount)
      if (xp > 0) {
        await updateProfileXP(user.id, xp)
        setXpEarned(xp)
      }

      // Check streak milestones
      if (completed) {
        const msg = getStreakMilestoneMessage(newStreakCount)
        if (msg) {
          setMilestoneMessage(msg)
          await celebrateStreakMilestone(user.id, habitId, newStreakCount)
          addNotification({
            type: 'streak',
            title: `${newStreakCount}-Day Streak!`,
            message: msg,
            habit_id: habitId,
          })
          if (getPermissionStatus() === 'granted') {
            sendBrowserNotification(`${newStreakCount}-Day Streak!`, msg)
          }
        }

        // Habit continuation prediction
        if (habit) {
          const pred = predictHabitBenefits(habit.category, newStreakCount)
          setPrediction(pred)
        }
      } else {
        // Send a roast for missed day
        const roast = getRandomRoast()
        addNotification({
          type: 'roast',
          title: 'Missed Day Roast',
          message: roast,
          habit_id: habitId,
        })
        if (getPermissionStatus() === 'granted') {
          sendBrowserNotification('Missed Day?', roast)
        }
      }

      // Check for new badges
      const awarded = await checkAndAwardBadges(user.id)
      if (awarded.length > 0) {
        setNewBadgeIds(awarded)
        for (const badgeId of awarded) {
          addNotification({
            type: 'badge',
            title: 'New Badge Earned!',
            message: `You earned the "${badgeId}" badge!`,
          })
        }
      }

      setStep('done')
    } catch (err: any) {
      console.error('Failed to log', err)
      setError(`Failed to log: ${err?.message || 'Unknown error'}`)
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

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{habit.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        {streak && (
          <p className="text-xs text-slate-400 mt-1">
            Current streak: {streak.current_streak} days
          </p>
        )}
      </div>

      {/* Step: Choice */}
      {step === 'choice' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-lg font-semibold text-center text-slate-700 dark:text-slate-200 mb-6">
            Did you complete this habit today?
          </h2>

          {/* Honesty Motivation */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-center mb-2">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Be honest — only genuine effort rewires your brain. Fake check-ins = zero real progress.
            </p>
          </div>

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
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
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
            {loading ? 'Saving...' : 'Log Completion'}
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
            {loading ? 'Saving...' : 'Log Entry'}
          </button>
        </motion.div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Log Saved!</h2>
          <p className="text-slate-500 dark:text-slate-400">Your data has been recorded for your experiment.</p>

          {/* Anti-fake motivation */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 max-w-sm mx-auto">
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              Remember: Every honest log builds a real habit. Consistency with integrity is what creates lasting change — not just streaks on a screen.
            </p>
          </div>

          {/* XP Earned */}
          {xpEarned > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full font-semibold text-sm"
            >
              <Sparkles size={16} /> +{xpEarned} XP earned!
            </motion.div>
          )}

          {/* Streak Milestone Celebration */}
          {milestoneMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg"
            >
              <motion.div
                animate={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-4xl mb-2"
              >
                <Flame className="mx-auto" size={40} />
              </motion.div>
              <p className="text-lg font-bold">{milestoneMessage}</p>
            </motion.div>
          )}

          {/* Badge Earned */}
          {newBadgeIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-4 text-white"
            >
              <Trophy className="mx-auto mb-1" size={28} />
              <p className="font-bold">New Badge{newBadgeIds.length > 1 ? 's' : ''} Earned!</p>
              <p className="text-sm opacity-90">{newBadgeIds.join(', ')}</p>
            </motion.div>
          )}

          {/* Habit Continuation Prediction */}
          {prediction && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 text-left"
            >
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-green-500" />
                If you keep going to day {prediction.nextMilestone}...
              </h3>
              <ul className="space-y-1.5">
                {prediction.benefits.map((b, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.15 }}
                    className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                  >
                    <span className="text-green-500 mt-0.5">✓</span>
                    {b}
                  </motion.li>
                ))}
              </ul>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-3 text-xs text-slate-400 italic border-t border-slate-100 dark:border-slate-800 pt-2"
              >
                {prediction.scienceFact}
              </motion.p>
            </motion.div>
          )}

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
