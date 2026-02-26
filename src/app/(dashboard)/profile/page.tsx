'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Award, Zap, Target, BookOpen } from 'lucide-react'
import { getHabits, getAllLogs, getAllStreaks, getUserBadges, getProfile } from '@/lib/db'
import { assignPersonality } from '@/lib/profileEngine'
import { calculateConsistency } from '@/lib/scoring'
import { useAuth } from '@/components/AuthProvider'
import type { Habit, DailyLog, Streak, UserBadge, Badge } from '@/types'

const personalityIcons: Record<string, string> = {
  'The Scientist': '🔬',
  'The Performer': '🏅',
  'The Night Owl': '🦉',
  'The Scholar': '📚',
  'The Eco Hero': '🌍',
}

export default function ProfilePage() {
  const { user: authUser } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [allLogs, setAllLogs] = useState<DailyLog[]>([])
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [userBadges, setUserBadges] = useState<(UserBadge & { badge: Badge })[]>([])
  const [xpPoints, setXpPoints] = useState(0)
  const [knowledgeScore, setKnowledgeScore] = useState(0)
  const [loading, setLoading] = useState(true)

  // Build user info from Supabase auth
  const displayName =
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.name ||
    authUser?.email?.split('@')[0] ||
    'User'
  const userEmail = authUser?.email || ''
  const avatarUrl = authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture

  useEffect(() => {
    if (!authUser) return
    const load = async () => {
      const [h, l, s, ub, p] = await Promise.all([
        getHabits(authUser.id),
        getAllLogs(authUser.id),
        getAllStreaks(authUser.id),
        getUserBadges(authUser.id),
        getProfile(authUser.id),
      ])
      setHabits(h)
      setAllLogs(l)
      setStreaks(s)
      setUserBadges(ub)
      setXpPoints(p?.xp_points || 0)
      setKnowledgeScore(p?.knowledge_score || 0)
      setLoading(false)
    }
    load()
  }, [authUser])

  const personality = assignPersonality(habits, allLogs, knowledgeScore)
  const totalCompleted = allLogs.filter((l) => l.completed).length
  const totalLogs = allLogs.length
  const consistency = calculateConsistency(totalCompleted, totalLogs)

  // XP progress bar
  const currentLevel = Math.floor(xpPoints / 100) + 1
  const xpInLevel = xpPoints % 100
  const xpNeeded = 100

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your Profile</h1>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-brand-600 to-accent-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center">
                {personalityIcons[personality.type] || '👤'}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">{displayName}</h2>
            <p className="text-brand-100 text-sm">{userEmail}</p>
          </div>
        </div>

        {/* Personality Type */}
        <div className="bg-white/10 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-medium opacity-80 mb-1">Habit Personality</h3>
          <p className="text-lg font-bold">{personality.type}</p>
          <p className="text-sm opacity-80 mt-1">{personality.description}</p>
        </div>

        {/* XP Bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Level {currentLevel}</span>
            <span>{xpInLevel}/{xpNeeded} XP</span>
          </div>
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(xpInLevel / xpNeeded) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Zap, label: 'Total XP', value: xpPoints, color: 'text-purple-500 bg-purple-50' },
          { icon: Target, label: 'Consistency', value: `${consistency}%`, color: 'text-green-500 bg-green-50' },
          { icon: Award, label: 'Badges', value: userBadges.length, color: 'text-amber-500 bg-amber-50' },
          { icon: BookOpen, label: 'Knowledge', value: knowledgeScore, color: 'text-blue-500 bg-blue-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${stat.color} dark:bg-opacity-20`}>
              <stat.icon size={20} />
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stat.value}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">🏅 Badges Earned</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {userBadges.map((ub) => (
            <div
              key={ub.id}
              className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-100 dark:border-amber-900/50 rounded-xl p-3 sm:p-4 text-center"
            >
              <span className="text-3xl">{ub.badge?.icon_url}</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm mt-2">{ub.badge?.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{ub.badge?.description}</p>
            </div>
          ))}
          {/* Locked badges */}
          {[
            { name: 'Habit Champion', icon: '🏆', desc: 'Maintain a 30-day streak' },
            { name: 'Precision Performer', icon: '🎯', desc: 'Achieve 90% weekly completion' },
            { name: 'Scholar', icon: '📚', desc: 'Watch 10 habit videos' },
          ].map((badge, i) => (
            <div
              key={i}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-3 sm:p-4 text-center opacity-50"
            >
              <span className="text-3xl grayscale">{badge.icon}</span>
              <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm mt-2">{badge.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{badge.desc}</p>
              <span className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 block">🔒 Locked</span>
            </div>
          ))}
        </div>
      </div>

      {/* Habit Stats */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">📊 Habit Stats</h2>
        <div className="space-y-3">
          {habits.map((habit) => {
            const logs = allLogs.filter((l) => l.habit_id === habit.id)
            const completed = logs.filter((l) => l.completed).length
            const pct = logs.length > 0 ? Math.round((completed / logs.length) * 100) : 0
            const streak = streaks.find((s) => s.habit_id === habit.id)

            return (
              <div key={habit.id} className="flex items-center gap-2 sm:gap-4">
                <div className="w-20 sm:w-32 text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                  {habit.title}
                </div>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 w-10 sm:w-12 text-right">{pct}%</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 w-14 sm:w-16 text-right">
                  🔥 {streak?.current_streak || 0}d
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
