'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Flame,
  CheckCircle2,
  ArrowRight,
  Zap,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import StreakFire from '@/components/gamification/StreakFire'
import DopamineMeter from '@/components/gamification/DopamineMeter'
import NeuralPathwayBar from '@/components/gamification/NeuralPathwayBar'
import { getHabits, getAllStreaks, getAllLogs, getLogsForHabit, getStreak, getProfile } from '@/lib/db'
import { calculateHabitStrength, calculateConsistency } from '@/lib/scoring'
import { categoryColors, categoryIcons } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'
import type { Habit, Streak, DailyLog } from '@/types'

export default function DashboardPage() {
  const { user: authUser, loading: authLoading } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [allLogs, setAllLogs] = useState<DailyLog[]>([])
  const [xpPoints, setXpPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const displayName =
    authUser?.displayName ||
    authUser?.email?.split('@')[0] ||
    'User'
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (authLoading) return
    if (!authUser) { setLoading(false); return }
    const load = async () => {
      try {
        const [h, s, l, p] = await Promise.all([
          getHabits(authUser.id),
          getAllStreaks(authUser.id),
          getAllLogs(authUser.id),
          getProfile(authUser.id),
        ])
        setHabits(h)
        setStreaks(s)
        setAllLogs(l)
        setXpPoints(p?.xp_points || 0)
      } catch (err: any) {
        console.error('Dashboard load error:', err)
        const msg = err?.message || 'Unknown error'
        if (msg.includes('index')) {
          setError('Firestore needs a composite index. Check the browser console for a direct link to create it, or go to Firebase Console → Firestore → Indexes and create the required indexes.')
        } else {
          setError(`Failed to load dashboard: ${msg}`)
        }
      }
      setLoading(false)
    }
    load()
  }, [authUser, authLoading])

  // Today's stats
  const todayLogs = allLogs.filter((l) => l.log_date === today)
  const completedToday = todayLogs.filter((l) => l.completed).length
  const totalStreaks = streaks.reduce((a, s) => a + s.current_streak, 0)

  const getStreakForHabit = (habitId: string) => streaks.find((s) => s.habit_id === habitId)
  const getLogsForHabitLocal = (habitId: string) =>
    allLogs.filter((l) => l.habit_id === habitId).sort((a, b) => a.log_date.localeCompare(b.log_date))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Welcome back, {displayName.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Track your experiments and build lasting habits.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Flame,
            label: 'Active Habits',
            value: habits.filter((h) => h.is_active).length,
            color: 'text-orange-500 bg-orange-50',
          },
          {
            icon: CheckCircle2,
            label: "Today's Progress",
            value: `${completedToday}/${habits.length}`,
            color: 'text-green-500 bg-green-50',
          },
          {
            icon: TrendingUp,
            label: 'Total Streak Days',
            value: totalStreaks,
            color: 'text-blue-500 bg-blue-50',
          },
          {
            icon: Zap,
            label: 'Total XP',
            value: xpPoints,
            color: 'text-purple-500 bg-purple-50',
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Dopamine Meter */}
      <DopamineMeter completedToday={completedToday} totalHabits={habits.length} />

      {/* Habit Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Your Experiments</h2>
          <Link
            href="/habits/create"
            className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1"
          >
            New Experiment <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {habits.map((habit, i) => {
            const streak = getStreakForHabit(habit.id)
            const logs = getLogsForHabitLocal(habit.id)
            const completed = logs.filter((l) => l.completed).length
            const consistency = calculateConsistency(completed, logs.length)
            const strength = calculateHabitStrength(
              consistency,
              streak?.current_streak || 0,
              habit.difficulty
            )
            const todayLog = logs.find((l) => l.log_date === today)
            const habitAge = Math.floor(
              (Date.now() - new Date(habit.created_at).getTime()) / 86400000
            )

            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {categoryIcons[habit.category] || '📋'}
                    </span>
                    <div>
                      <Link
                        href={`/habits/${habit.id}`}
                        className="font-semibold text-slate-800 dark:text-slate-100 hover:text-brand-600 transition-colors"
                      >
                        {habit.title}
                      </Link>
                      <span
                        className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          categoryColors[habit.category] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {habit.category}
                      </span>
                    </div>
                  </div>
                  <StreakFire streakCount={streak?.current_streak || 0} />
                </div>

                <p className="text-xs text-slate-400 mb-3 line-clamp-1">
                  {habit.hypothesis || habit.description}
                </p>

                <div className="flex items-center gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{strength}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Strength</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{consistency}%</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Consistency</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                      {streak?.current_streak || 0}d
                    </p>
                    <p className="text-[10px] text-slate-400">Streak</p>
                  </div>
                </div>

                <NeuralPathwayBar habitAge={habitAge} totalCompletions={completed} />

                <div className="mt-4 flex items-center justify-between">
                  {todayLog ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                      <CheckCircle2 size={14} />
                      Logged Today
                    </span>
                  ) : (
                    <Link
                      href={`/habits/${habit.id}/log`}
                      className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-all"
                    >
                      <Calendar size={12} />
                      Log Today
                    </Link>
                  )}
                  <Link
                    href={`/habits/${habit.id}`}
                    className="text-xs text-slate-400 hover:text-brand-600 transition-colors"
                  >
                    View Details →
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
