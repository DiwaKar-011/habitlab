'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Info, AlertTriangle, CheckCircle, TrendingUp, Target, Flame, Shield, Zap } from 'lucide-react'
import { getHabits, getAllLogs, getAllStreaks } from '@/lib/db'
import { generateInsights } from '@/lib/insights'
import LineGraph from '@/components/analytics/LineGraph'
import WeeklyComparisonChart from '@/components/analytics/WeeklyComparisonChart'
import { useAuth } from '@/components/AuthProvider'
import type { Habit, DailyLog } from '@/types'

export default function InsightsPage() {
  const { user, loading: authLoading } = useAuth()
  const [range, setRange] = useState<'7' | '30' | 'all'>('30')
  const [habits, setHabits] = useState<Habit[]>([])
  const [allLogs, setAllLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    const load = async () => {
      try {
        const [h, l] = await Promise.all([getHabits(user.id), getAllLogs(user.id)])
        setHabits(h)
        setAllLogs(l)
      } catch (err) {
        console.error('Insights load error:', err)
      }
      setLoading(false)
    }
    load()
  }, [user, authLoading])

  // Combine all insights
  const allInsights = habits.flatMap((habit) => {
    const logs = allLogs.filter((l) => l.habit_id === habit.id).sort((a, b) => a.log_date.localeCompare(b.log_date))
    return generateInsights(logs).map((insight) => ({
      ...insight,
      habitTitle: habit.title,
    }))
  })

  // Calculate global stats
  const totalLogs = allLogs.length
  const completedTotal = allLogs.filter((l) => l.completed).length
  const globalRate = totalLogs > 0 ? Math.round((completedTotal / totalLogs) * 100) : 0
  const activeHabits = habits.filter((h) => h.is_active).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Smart Insights</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          AI-powered analysis of your habit data
        </p>
      </div>

      {/* Quick Stats Row */}
      {totalLogs > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
            <Target size={20} className="mx-auto text-brand-500 mb-1" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{globalRate}%</p>
            <p className="text-xs text-slate-400">Overall Rate</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
            <Zap size={20} className="mx-auto text-purple-500 mb-1" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedTotal}</p>
            <p className="text-xs text-slate-400">Completions</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
            <Flame size={20} className="mx-auto text-orange-500 mb-1" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalLogs}</p>
            <p className="text-xs text-slate-400">Total Logs</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
            <TrendingUp size={20} className="mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeHabits}</p>
            <p className="text-xs text-slate-400">Active Habits</p>
          </div>
        </div>
      )}

      {/* Honesty Motivation Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex items-start gap-3">
        <Shield size={20} className="text-indigo-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">Honesty = Real Growth</p>
          <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-0.5">
            These insights are only as accurate as your logs. Doing the task genuinely builds real neural pathways — fake check-ins produce zero benefits. Be honest, and watch real transformation happen.
          </p>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { value: '7' as const, label: 'Last 7 days' },
          { value: '30' as const, label: 'Last 30 days' },
          { value: 'all' as const, label: 'All time' },
        ].map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              range === r.value
                ? 'bg-brand-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Insight cards */}
      <div className="space-y-3">
        {allInsights.map((insight, i) => (
          <div
            key={i}
            className={`bg-white dark:bg-slate-900 rounded-xl border p-4 flex items-start gap-3 ${
              insight.type === 'success'
                ? 'border-green-200 dark:border-green-800'
                : insight.type === 'warning'
                ? 'border-amber-200 dark:border-amber-800'
                : 'border-blue-200 dark:border-blue-800'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                insight.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-500'
                  : insight.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-500'
                  : 'bg-blue-50 dark:bg-blue-900/30 text-blue-500'
              }`}
            >
              {insight.type === 'success' ? (
                <CheckCircle size={16} />
              ) : insight.type === 'warning' ? (
                <AlertTriangle size={16} />
              ) : (
                <Info size={16} />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{insight.message}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">From: {insight.habitTitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LineGraph logs={allLogs} range={range} />
        <WeeklyComparisonChart habits={habits} logs={allLogs} />
      </div>
    </div>
  )
}
