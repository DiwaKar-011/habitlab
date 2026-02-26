'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Flame } from 'lucide-react'

const mockLeaderboard = [
  { id: '1', rank: 1, name: 'Alex Chen', xp: 450, streak: 43, score: 385, badges: 4, isCurrentUser: true },
  { id: '2', rank: 2, name: 'Maya Johnson', xp: 520, streak: 38, score: 350, badges: 5, isCurrentUser: false },
  { id: '3', rank: 3, name: 'Liam Park', xp: 380, streak: 31, score: 290, badges: 3, isCurrentUser: false },
  { id: '4', rank: 4, name: 'Sophia Kim', xp: 340, streak: 25, score: 245, badges: 3, isCurrentUser: false },
  { id: '5', rank: 5, name: 'Carlos Rivera', xp: 300, streak: 22, score: 220, badges: 2, isCurrentUser: false },
  { id: '6', rank: 6, name: 'Emma Davis', xp: 280, streak: 18, score: 195, badges: 2, isCurrentUser: false },
  { id: '7', rank: 7, name: 'Noah Wilson', xp: 250, streak: 15, score: 170, badges: 1, isCurrentUser: false },
  { id: '8', rank: 8, name: 'Aisha Patel', xp: 220, streak: 12, score: 145, badges: 1, isCurrentUser: false },
]

const rankEmoji = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'global' | 'friends' | 'weekly'>('global')

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leaderboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          See how you rank among other habit scientists
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { value: 'global' as const, label: 'Global', icon: Trophy },
          { value: 'friends' as const, label: 'Friends', icon: Medal },
          { value: 'weekly' as const, label: 'Weekly Challenge', icon: Flame },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              tab === t.value
                ? 'bg-brand-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Top 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {mockLeaderboard.slice(0, 3).map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white dark:bg-slate-900 rounded-xl border p-5 text-center ${
              user.isCurrentUser ? 'border-brand-300 dark:border-brand-700 ring-2 ring-brand-100 dark:ring-brand-900' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <span className="text-3xl">{rankEmoji[i]}</span>
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mt-2 flex items-center justify-center text-lg font-bold text-slate-500 dark:text-slate-400">
              {user.name.charAt(0)}
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-100 mt-2 text-sm">{user.name}</p>
            <p className="text-xl font-bold text-brand-600 dark:text-brand-400 mt-1">{user.score}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Habit Strength</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>🔥 {user.streak}d</span>
              <span>⚡ {user.xp} XP</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Full List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
              <th className="text-left py-3 px-4">Rank</th>
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-right py-3 px-4">Score</th>
              <th className="text-right py-3 px-4 hidden sm:table-cell">Streak</th>
              <th className="text-right py-3 px-4 hidden sm:table-cell">XP</th>
              <th className="text-right py-3 px-4 hidden md:table-cell">Badges</th>
            </tr>
          </thead>
          <tbody>
            {mockLeaderboard.map((user, i) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className={`border-b border-slate-50 dark:border-slate-800 ${
                  user.isCurrentUser ? 'bg-brand-50 dark:bg-brand-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                  {rankEmoji[i] || `#${user.rank}`}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {user.name}
                      {user.isCurrentUser && (
                        <span className="ml-1 text-[10px] bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 px-1.5 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-200 text-right">{user.score}</td>
                <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 text-right hidden sm:table-cell">🔥 {user.streak}</td>
                <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 text-right hidden sm:table-cell">⚡ {user.xp}</td>
                <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 text-right hidden md:table-cell">🏅 {user.badges}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
