'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FlaskConical, Target, BarChart3, Bell, BellOff, Clock, Trash2 } from 'lucide-react'
import { getHabit, getLogsForHabit, getStreak } from '@/lib/db'
import { calculateHabitStrength, calculateConsistency } from '@/lib/scoring'
import { analyzeFailures } from '@/lib/failureAnalysis'
import { generateInsights } from '@/lib/insights'
import { categoryColors, categoryIcons } from '@/lib/utils'
import { getReminderForHabit, saveReminder, deleteReminder } from '@/lib/notificationStore'
import HeatmapCalendar from '@/components/analytics/HeatmapCalendar'
import FailureChart from '@/components/analytics/FailureChart'
import StreakFire from '@/components/gamification/StreakFire'
import NeuralPathwayBar from '@/components/gamification/NeuralPathwayBar'
import type { Habit, DailyLog, Streak as StreakType, HabitReminder, ReminderFrequency } from '@/types'

export default function HabitDetailPage() {
  const params = useParams()
  const habitId = params.id as string
  const [habit, setHabit] = useState<Habit | null>(null)
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [streak, setStreakData] = useState<StreakType | null>(null)
  const [loading, setLoading] = useState(true)

  // Reminder state
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [reminder, setReminder] = useState<HabitReminder | null>(null)
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>('every_1hr')
  const [reminderStartTime, setReminderStartTime] = useState('08:00')
  const [reminderEndTime, setReminderEndTime] = useState('21:00')
  const [reminderDays, setReminderDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [customIntervalMin, setCustomIntervalMin] = useState(60)

  useEffect(() => {
    const load = async () => {
      const [h, l, s] = await Promise.all([
        getHabit(habitId),
        getLogsForHabit(habitId),
        getStreak(habitId),
      ])
      setHabit(h)
      setLogs(l)
      setStreakData(s)

      // Load existing reminder for this habit
      const existingReminder = getReminderForHabit(habitId)
      if (existingReminder) {
        setReminder(existingReminder)
        setReminderFrequency(existingReminder.frequency)
        setReminderStartTime(existingReminder.start_time)
        setReminderEndTime(existingReminder.end_time)
        setReminderDays(existingReminder.days_of_week)
        if (existingReminder.custom_interval_min) setCustomIntervalMin(existingReminder.custom_interval_min)
      }

      setLoading(false)
    }
    load()
  }, [habitId])

  const handleSaveReminder = () => {
    if (!habit) return
    const newReminder: HabitReminder = {
      id: reminder?.id || `rem-${habitId}-${Date.now()}`,
      habit_id: habitId,
      habit_title: habit.title,
      enabled: true,
      frequency: reminderFrequency,
      custom_interval_min: reminderFrequency === 'custom' ? customIntervalMin : undefined,
      start_time: reminderStartTime,
      end_time: reminderEndTime,
      days_of_week: reminderDays,
      created_at: reminder?.created_at || new Date().toISOString(),
    }
    saveReminder(newReminder)
    setReminder(newReminder)
    setShowReminderForm(false)
  }

  const handleDeleteReminder = () => {
    if (reminder) {
      deleteReminder(reminder.id)
      setReminder(null)
      setShowReminderForm(false)
    }
  }

  const toggleDay = (day: number) => {
    setReminderDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    )
  }

  if (loading) {
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
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-2xl">{categoryIcons[habit.category]}</span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{habit.title}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[habit.category]}`}>
                {habit.category}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{habit.description}</p>
          </div>
          <StreakFire streakCount={streak?.current_streak || 0} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {[
            { label: 'Strength', value: strength },
            { label: 'Consistency', value: `${consistency}%` },
            { label: 'Current Streak', value: `${streak?.current_streak || 0}d` },
            { label: 'Longest Streak', value: `${streak?.longest_streak || 0}d` },
          ].map((s, i) => (
            <div key={i} className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <NeuralPathwayBar habitAge={habitAge} totalCompletions={completed} />
        </div>
      </div>

      {/* Experiment Setup */}
      {habit.hypothesis && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical size={18} className="text-brand-500" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Experiment Setup</h2>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Hypothesis</span>
              <p className="text-sm text-slate-700 dark:text-slate-300">{habit.hypothesis}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Independent Variable</span>
                <p className="text-sm text-slate-700 dark:text-slate-300">{habit.independent_var}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Dependent Variable</span>
                <p className="text-sm text-slate-700 dark:text-slate-300">{habit.dependent_var}</p>
              </div>
            </div>
            {habit.control_vars && habit.control_vars.length > 0 && (
              <div>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Control Variables</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {habit.control_vars.map((v, i) => (
                    <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Target Duration</span>
              <p className="text-sm text-slate-700 dark:text-slate-300">{habit.target_days} days</p>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap */}
      <HeatmapCalendar logs={logs} days={60} />

      {/* Smart Insights */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-brand-500" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Smart Insights</h2>
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">💡 Suggestions</h3>
          <div className="space-y-2">
            {failures.suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
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

      {/* Set Reminder */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-brand-500" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Reminder</h2>
          </div>
          {reminder ? (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full font-medium">
                ✅ Active
              </span>
              <button
                onClick={() => setShowReminderForm(!showReminderForm)}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                {showReminderForm ? 'Cancel' : 'Edit'}
              </button>
              <button
                onClick={handleDeleteReminder}
                className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-0.5"
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowReminderForm(!showReminderForm)}
              className="text-sm bg-brand-600 text-white px-4 py-1.5 rounded-lg hover:bg-brand-700 transition-colors font-medium flex items-center gap-1.5"
            >
              <Clock size={14} /> Set Reminder
            </button>
          )}
        </div>

        {/* Show current reminder summary */}
        {reminder && !showReminderForm && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Clock size={14} className="text-slate-400" />
              <span>
                {reminder.frequency === 'once' ? 'Once daily' :
                 reminder.frequency === 'every_30min' ? 'Every 30 min' :
                 reminder.frequency === 'every_1hr' ? 'Every hour' :
                 reminder.frequency === 'every_2hr' ? 'Every 2 hours' :
                 reminder.frequency === 'every_4hr' ? 'Every 4 hours' :
                 `Every ${reminder.custom_interval_min} min`}
                {' '} from {reminder.start_time} to {reminder.end_time}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <span
                  key={day}
                  className={`text-[10px] w-7 h-7 flex items-center justify-center rounded-full font-medium ${
                    reminder.days_of_week.includes(i)
                      ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reminder Form */}
        {showReminderForm && (
          <div className="space-y-4">
            {/* Frequency */}
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Frequency</label>
              <select
                value={reminderFrequency}
                onChange={(e) => setReminderFrequency(e.target.value as ReminderFrequency)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="once">Once daily</option>
                <option value="every_30min">Every 30 minutes</option>
                <option value="every_1hr">Every hour</option>
                <option value="every_2hr">Every 2 hours</option>
                <option value="every_4hr">Every 4 hours</option>
                <option value="custom">Custom interval</option>
              </select>
            </div>

            {/* Custom interval */}
            {reminderFrequency === 'custom' && (
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">
                  Custom interval (minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  max={480}
                  value={customIntervalMin}
                  onChange={(e) => setCustomIntervalMin(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}

            {/* Time window */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Start time</label>
                <input
                  type="time"
                  value={reminderStartTime}
                  onChange={(e) => setReminderStartTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">End time</label>
                <input
                  type="time"
                  value={reminderEndTime}
                  onChange={(e) => setReminderEndTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Days of week */}
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Days</label>
              <div className="flex items-center gap-1.5">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`text-xs w-9 h-9 flex items-center justify-center rounded-full font-medium transition-colors ${
                      reminderDays.includes(i)
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Save button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSaveReminder}
                disabled={reminderDays.length === 0}
                className="bg-brand-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Bell size={14} /> {reminder ? 'Update Reminder' : 'Save Reminder'}
              </button>
              <button
                onClick={() => setShowReminderForm(false)}
                className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* No reminder set message */}
        {!reminder && !showReminderForm && (
          <p className="text-sm text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <BellOff size={14} /> No reminder set. Tap &quot;Set Reminder&quot; to get notified about this habit.
          </p>
        )}
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
