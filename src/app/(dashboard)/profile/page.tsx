'use client'

import { motion } from 'framer-motion'
import { User, Award, Zap, Target, BookOpen } from 'lucide-react'
import { mockUser, mockHabits, mockLogs, mockUserBadges, mockStreaks } from '@/lib/mockData'
import { assignPersonality } from '@/lib/profileEngine'
import { calculateConsistency } from '@/lib/scoring'

const personalityIcons: Record<string, string> = {
  'The Scientist': '🔬',
  'The Performer': '🏅',
  'The Night Owl': '🦉',
  'The Scholar': '📚',
  'The Eco Hero': '🌍',
}

export default function ProfilePage() {
  const user = mockUser
  const personality = assignPersonality(mockHabits, mockLogs, user.knowledge_score)
  const totalCompleted = mockLogs.filter((l) => l.completed).length
  const totalLogs = mockLogs.length
  const consistency = calculateConsistency(totalCompleted, totalLogs)

  // XP progress bar
  const currentLevel = Math.floor(user.xp_points / 100) + 1
  const xpInLevel = user.xp_points % 100
  const xpNeeded = 100

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900">Your Profile</h1>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-brand-600 to-accent-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl">
            {personalityIcons[personality.type] || '👤'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-brand-100 text-sm">{user.email}</p>
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
          { icon: Zap, label: 'Total XP', value: user.xp_points, color: 'text-purple-500 bg-purple-50' },
          { icon: Target, label: 'Consistency', value: `${consistency}%`, color: 'text-green-500 bg-green-50' },
          { icon: Award, label: 'Badges', value: mockUserBadges.length, color: 'text-amber-500 bg-amber-50' },
          { icon: BookOpen, label: 'Knowledge', value: user.knowledge_score, color: 'text-blue-500 bg-blue-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <p className="text-xl font-bold text-slate-800">{stat.value}</p>
            <p className="text-xs text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">🏅 Badges Earned</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {mockUserBadges.map((ub) => (
            <div
              key={ub.id}
              className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 rounded-xl p-4 text-center"
            >
              <span className="text-3xl">{ub.badge?.icon_url}</span>
              <p className="font-semibold text-slate-800 text-sm mt-2">{ub.badge?.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{ub.badge?.description}</p>
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
              className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center opacity-50"
            >
              <span className="text-3xl grayscale">{badge.icon}</span>
              <p className="font-semibold text-slate-500 text-sm mt-2">{badge.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{badge.desc}</p>
              <span className="text-[10px] text-slate-300 mt-1 block">🔒 Locked</span>
            </div>
          ))}
        </div>
      </div>

      {/* Habit Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">📊 Habit Stats</h2>
        <div className="space-y-3">
          {mockHabits.map((habit) => {
            const logs = mockLogs.filter((l) => l.habit_id === habit.id)
            const completed = logs.filter((l) => l.completed).length
            const pct = logs.length > 0 ? Math.round((completed / logs.length) * 100) : 0
            const streak = mockStreaks.find((s) => s.habit_id === habit.id)

            return (
              <div key={habit.id} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-slate-700 truncate">
                  {habit.title}
                </div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-12 text-right">{pct}%</span>
                <span className="text-xs text-slate-400 w-16 text-right">
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
