'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FlaskConical, Target, BarChart3 } from 'lucide-react'
import { mockHabits, getLogsForHabit, getStreakForHabit } from '@/lib/mockData'
import { calculateHabitStrength, calculateConsistency } from '@/lib/scoring'
import { analyzeFailures } from '@/lib/failureAnalysis'
import { generateInsights } from '@/lib/insights'
import { categoryColors, categoryIcons } from '@/lib/utils'
import HeatmapCalendar from '@/components/analytics/HeatmapCalendar'
import FailureChart from '@/components/analytics/FailureChart'
import StreakFire from '@/components/gamification/StreakFire'
import NeuralPathwayBar from '@/components/gamification/NeuralPathwayBar'

export default function HabitDetailPage() {
  const params = useParams()
  const habitId = params.id as string
  const habit = mockHabits.find((h) => h.id === habitId)

  if (!habit) {
    return (
      <div className="text-center py-20 text-slate-500">
        Habit not found. <Link href="/dashboard" className="text-brand-600 hover:underline">Go back</Link>
      </div>
    )
  }

  const logs = getLogsForHabit(habitId)
  const streak = getStreakForHabit(habitId)
  const completed = logs.filter((l) => l.completed).length
  const consistency = calculateConsistency(completed, logs.length)
  const strength = calculateHabitStrength(consistency, streak?.current_streak || 0, habit.difficulty)
  const failures = analyzeFailures(logs)
  const insights = generateInsights(logs)
  const habitAge = Math.floor((Date.now() - new Date(habit.created_at).getTime()) / 86400000)

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{categoryIcons[habit.category]}</span>
              <h1 className="text-2xl font-bold text-slate-900">{habit.title}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[habit.category]}`}>
                {habit.category}
              </span>
            </div>
            <p className="text-sm text-slate-500">{habit.description}</p>
          </div>
          <StreakFire streakCount={streak?.current_streak || 0} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Strength', value: strength },
            { label: 'Consistency', value: `${consistency}%` },
            { label: 'Current Streak', value: `${streak?.current_streak || 0}d` },
            { label: 'Longest Streak', value: `${streak?.longest_streak || 0}d` },
          ].map((s, i) => (
            <div key={i} className="text-center bg-slate-50 rounded-lg p-3">
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <NeuralPathwayBar habitAge={habitAge} totalCompletions={completed} />
        </div>
      </div>

      {/* Experiment Setup */}
      {habit.hypothesis && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical size={18} className="text-brand-500" />
            <h2 className="text-lg font-semibold text-slate-800">Experiment Setup</h2>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-xs font-medium text-slate-400">Hypothesis</span>
              <p className="text-sm text-slate-700">{habit.hypothesis}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-slate-400">Independent Variable</span>
                <p className="text-sm text-slate-700">{habit.independent_var}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400">Dependent Variable</span>
                <p className="text-sm text-slate-700">{habit.dependent_var}</p>
              </div>
            </div>
            {habit.control_vars && habit.control_vars.length > 0 && (
              <div>
                <span className="text-xs font-medium text-slate-400">Control Variables</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {habit.control_vars.map((v, i) => (
                    <span key={i} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className="text-xs font-medium text-slate-400">Target Duration</span>
              <p className="text-sm text-slate-700">{habit.target_days} days</p>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap */}
      <HeatmapCalendar logs={logs} days={60} />

      {/* Smart Insights */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-brand-500" />
          <h2 className="text-lg font-semibold text-slate-800">Smart Insights</h2>
        </div>
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg text-sm ${
                insight.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-100'
                  : insight.type === 'warning'
                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                  : 'bg-blue-50 text-blue-700 border border-blue-100'
              }`}
            >
              {insight.type === 'success' ? '✅' : insight.type === 'warning' ? '⚠️' : 'ℹ️'}{' '}
              {insight.message}
            </div>
          ))}
        </div>
      </div>

      {/* Failure Analysis */}
      <div className="grid md:grid-cols-2 gap-4">
        <FailureChart reasons={failures.reasons} />
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-700 mb-3">💡 Suggestions</h3>
          <div className="space-y-2">
            {failures.suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <Target size={14} className="flex-shrink-0 mt-0.5 text-brand-500" />
                {s}
              </div>
            ))}
          </div>
          {failures.weekendEffect && (
            <div className="mt-3 p-2 bg-amber-50 rounded-lg text-xs text-amber-700">
              📊 Weekend effect detected: You miss more on weekends.
            </div>
          )}
        </div>
      </div>

      {/* Log button */}
      <div className="text-center">
        <Link
          href={`/habits/${habitId}/log`}
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
        >
          📝 Log Today&apos;s Entry
        </Link>
      </div>
    </div>
  )
}
