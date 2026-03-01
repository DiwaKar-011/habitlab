'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FlaskConical, Target, BarChart3, Bell, BellOff, Clock, Trash2, Plus, X, CalendarClock, Repeat, MessageCircle, Flame, Zap, CheckCircle2, Circle } from 'lucide-react'
import { getHabit, getLogsForHabit, getStreak, getHabits, getAllLogs } from '@/lib/db'
import { calculateHabitStrength, calculateConsistency } from '@/lib/scoring'
import { analyzeFailures } from '@/lib/failureAnalysis'
import { generateInsights } from '@/lib/insights'
import { categoryColors, categoryIcons } from '@/lib/utils'
import { getReminderForHabit, saveReminder, deleteReminder, getGlobalNotificationStyle, saveGlobalNotificationStyle } from '@/lib/notificationStore'
import { syncRemindersToServiceWorker } from '@/lib/reminderScheduler'
import HeatmapCalendar from '@/components/analytics/HeatmapCalendar'
import FailureChart from '@/components/analytics/FailureChart'
import StreakFire from '@/components/gamification/StreakFire'
import NeuralPathwayBar from '@/components/gamification/NeuralPathwayBar'
import { useAuth } from '@/components/AuthProvider'
import type { Habit, DailyLog, Streak as StreakType, HabitReminder, ReminderFrequency, ReminderMode, NotificationStylePrefs } from '@/types'

export default function HabitDetailPage() {
  const params = useParams()
  const habitId = params.id as string
  const { user: authUser } = useAuth()
  const [habit, setHabit] = useState<Habit | null>(null)
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [streak, setStreakData] = useState<StreakType | null>(null)
  const [loading, setLoading] = useState(true)

  // All user habits & logs for "remaining tasks" display
  const [allHabits, setAllHabits] = useState<Habit[]>([])
  const [allLogs, setAllLogs] = useState<DailyLog[]>([])

  // Reminder state
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [reminder, setReminder] = useState<HabitReminder | null>(null)
  const [reminderMode, setReminderMode] = useState<ReminderMode>('scheduled')
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>('every_1hr')
  const [reminderStartTime, setReminderStartTime] = useState('08:00')
  const [reminderEndTime, setReminderEndTime] = useState('21:00')
  const [reminderDays, setReminderDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [customIntervalMin, setCustomIntervalMin] = useState(60)
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(['09:00'])
  const [newTime, setNewTime] = useState('12:00')

  // Notification style prefs
  const [notifStyle, setNotifStyle] = useState<NotificationStylePrefs>({ plain: true, motivation: true, roast: false })

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

      // Load all habits & logs for remaining tasks
      if (authUser) {
        const [ah, al] = await Promise.all([
          getHabits(authUser.id),
          getAllLogs(authUser.id),
        ])
        setAllHabits(ah)
        setAllLogs(al)
      }

      // Load existing reminder for this habit
      const existingReminder = getReminderForHabit(habitId)
      if (existingReminder) {
        setReminder(existingReminder)
        setReminderMode(existingReminder.mode || 'recurring')
        setReminderFrequency(existingReminder.frequency)
        setReminderStartTime(existingReminder.start_time)
        setReminderEndTime(existingReminder.end_time)
        setReminderDays(existingReminder.days_of_week)
        if (existingReminder.custom_interval_min) setCustomIntervalMin(existingReminder.custom_interval_min)
        if (existingReminder.scheduled_times?.length) setScheduledTimes(existingReminder.scheduled_times)
        if (existingReminder.notification_style) setNotifStyle(existingReminder.notification_style)
      } else {
        // Fall back to global style prefs
        setNotifStyle(getGlobalNotificationStyle())
      }

      setLoading(false)
    }
    load()
  }, [habitId, authUser])

  const handleSaveReminder = () => {
    if (!habit) return
    const newReminder: HabitReminder = {
      id: reminder?.id || `rem-${habitId}-${Date.now()}`,
      habit_id: habitId,
      habit_title: habit.title,
      enabled: true,
      mode: reminderMode,
      frequency: reminderFrequency,
      custom_interval_min: reminderFrequency === 'custom' ? customIntervalMin : undefined,
      start_time: reminderStartTime,
      end_time: reminderEndTime,
      scheduled_times: reminderMode === 'scheduled' ? scheduledTimes.sort() : undefined,
      days_of_week: reminderDays,
      notification_style: notifStyle,
      created_at: reminder?.created_at || new Date().toISOString(),
    }
    saveReminder(newReminder)
    setReminder(newReminder)
    // Also save as global default for future reminders
    saveGlobalNotificationStyle(notifStyle)
    // Sync to service worker so notifications fire even in background
    syncRemindersToServiceWorker()
    setShowReminderForm(false)
  }

  const handleDeleteReminder = () => {
    if (reminder) {
      deleteReminder(reminder.id)
      setReminder(null)
      setShowReminderForm(false)
      // Re-sync to service worker after deletion
      syncRemindersToServiceWorker()
    }
  }

  const toggleDay = (day: number) => {
    setReminderDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    )
  }

  const addScheduledTime = () => {
    if (newTime && !scheduledTimes.includes(newTime)) {
      setScheduledTimes(prev => [...prev, newTime].sort())
    }
  }

  const removeScheduledTime = (t: string) => {
    setScheduledTimes(prev => prev.filter(x => x !== t))
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
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              {(reminder.mode || 'recurring') === 'scheduled' ? (
                <CalendarClock size={14} className="text-brand-500" />
              ) : (
                <Repeat size={14} className="text-brand-500" />
              )}
              <span className="font-medium">
                {(reminder.mode || 'recurring') === 'scheduled' ? 'Scheduled' : 'Recurring'}
              </span>
            </div>
            {(reminder.mode || 'recurring') === 'scheduled' && reminder.scheduled_times?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {reminder.scheduled_times.map(t => (
                  <span key={t} className="text-xs bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2.5 py-1 rounded-full font-medium">
                    🕐 {t}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Clock size={14} className="text-slate-400" />
                <span>
                  {reminder.frequency === 'once' ? 'Once daily' :
                   reminder.frequency === 'every_30min' ? 'Every 30 min' :
                   reminder.frequency === 'every_1hr' ? 'Every hour' :
                   reminder.frequency === 'every_2hr' ? 'Every 2 hours' :
                   reminder.frequency === 'every_4hr' ? 'Every 4 hours' :
                   `Every ${reminder.custom_interval_min} min`}
                  {' · '}{reminder.start_time} – {reminder.end_time}
                </span>
              </div>
            )}
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
            {/* Notification style tags */}
            <div className="flex items-center gap-1.5 pt-1">
              <MessageCircle size={12} className="text-slate-400" />
              <span className="text-[10px] text-slate-400">Style:</span>
              {(reminder.notification_style?.plain ?? true) && (
                <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">Plain</span>
              )}
              {(reminder.notification_style?.motivation ?? true) && (
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">Motivation</span>
              )}
              {reminder.notification_style?.roast && (
                <span className="text-[10px] bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium">Roast 🔥</span>
              )}
            </div>
          </div>
        )}

        {/* Reminder Form */}
        {showReminderForm && (
          <div className="space-y-5">
            {/* Mode Selection */}
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">Notification Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReminderMode('scheduled')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    reminderMode === 'scheduled'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarClock size={16} className={reminderMode === 'scheduled' ? 'text-brand-600' : 'text-slate-400'} />
                    <span className={`text-sm font-semibold ${reminderMode === 'scheduled' ? 'text-brand-700 dark:text-brand-300' : 'text-slate-600 dark:text-slate-300'}`}>
                      Scheduled
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Pick exact times you want to be notified (e.g. 9:00 AM, 2:00 PM)
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setReminderMode('recurring')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    reminderMode === 'recurring'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Repeat size={16} className={reminderMode === 'recurring' ? 'text-brand-600' : 'text-slate-400'} />
                    <span className={`text-sm font-semibold ${reminderMode === 'recurring' ? 'text-brand-700 dark:text-brand-300' : 'text-slate-600 dark:text-slate-300'}`}>
                      Recurring
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Get notified at regular intervals (every 30min, 1hr, 2hr, etc.)
                  </p>
                </button>
              </div>
            </div>

            {/* Scheduled Mode — exact times */}
            {reminderMode === 'scheduled' && (
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">
                  Notification Times
                </label>
                <div className="space-y-2">
                  {/* Existing times */}
                  <div className="flex flex-wrap gap-1.5">
                    {scheduledTimes.map(t => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-medium px-2.5 py-1 rounded-full"
                      >
                        🕐 {t}
                        <button
                          type="button"
                          onClick={() => removeScheduledTime(t)}
                          className="text-brand-400 hover:text-red-500 transition-colors ml-0.5"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  {/* Add new time */}
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={addScheduledTime}
                      className="bg-brand-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  {scheduledTimes.length === 0 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">Add at least one time to receive notifications.</p>
                  )}
                </div>
              </div>
            )}

            {/* Recurring Mode — interval-based */}
            {reminderMode === 'recurring' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">How often?</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {[
                      { value: 'once' as ReminderFrequency, label: 'Once/day' },
                      { value: 'every_30min' as ReminderFrequency, label: '30 min' },
                      { value: 'every_1hr' as ReminderFrequency, label: '1 hour' },
                      { value: 'every_2hr' as ReminderFrequency, label: '2 hours' },
                      { value: 'every_4hr' as ReminderFrequency, label: '4 hours' },
                      { value: 'custom' as ReminderFrequency, label: 'Custom' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setReminderFrequency(opt.value)}
                        className={`text-xs py-2 px-1 rounded-lg font-medium text-center transition-colors ${
                          reminderFrequency === opt.value
                            ? 'bg-brand-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom interval */}
                {reminderFrequency === 'custom' && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">
                      Interval (minutes)
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
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Active window</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 mb-0.5 block">From</span>
                      <input
                        type="time"
                        value={reminderStartTime}
                        onChange={(e) => setReminderStartTime(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 mb-0.5 block">Until</span>
                      <input
                        type="time"
                        value={reminderEndTime}
                        onChange={(e) => setReminderEndTime(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Days of week — shared by both modes */}
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Active Days</label>
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

            {/* Notification Style Preferences */}
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">Notification Style</label>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-3">Pick your vibe — toggle one or more:</p>
              <div className="grid grid-cols-3 gap-3">
                {/* Plain */}
                <button
                  type="button"
                  onClick={() => setNotifStyle(prev => ({ ...prev, plain: !prev.plain }))}
                  className={`relative overflow-hidden rounded-2xl p-4 text-center transition-all duration-300 transform hover:scale-[1.03] active:scale-95 ${
                    notifStyle.plain
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="text-3xl mb-2">🔔</div>
                  <div className={`text-sm font-bold ${notifStyle.plain ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                    Plain
                  </div>
                  <div className={`text-[10px] mt-0.5 ${notifStyle.plain ? 'text-blue-100' : 'text-slate-400'}`}>
                    Simple & clean
                  </div>
                  {notifStyle.plain && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">✓</span>
                    </div>
                  )}
                </button>

                {/* Motivation */}
                <button
                  type="button"
                  onClick={() => setNotifStyle(prev => ({ ...prev, motivation: !prev.motivation }))}
                  className={`relative overflow-hidden rounded-2xl p-4 text-center transition-all duration-300 transform hover:scale-[1.03] active:scale-95 ${
                    notifStyle.motivation
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="text-3xl mb-2">💪</div>
                  <div className={`text-sm font-bold ${notifStyle.motivation ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                    Motivation
                  </div>
                  <div className={`text-[10px] mt-0.5 ${notifStyle.motivation ? 'text-emerald-100' : 'text-slate-400'}`}>
                    Inspiring quotes
                  </div>
                  {notifStyle.motivation && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">✓</span>
                    </div>
                  )}
                </button>

                {/* Roast */}
                <button
                  type="button"
                  onClick={() => setNotifStyle(prev => ({ ...prev, roast: !prev.roast }))}
                  className={`relative overflow-hidden rounded-2xl p-4 text-center transition-all duration-300 transform hover:scale-[1.03] active:scale-95 ${
                    notifStyle.roast
                      ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-400 animate-pulse-slow'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="text-3xl mb-2">🔥</div>
                  <div className={`text-sm font-bold ${notifStyle.roast ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                    Roast Me
                  </div>
                  <div className={`text-[10px] mt-0.5 ${notifStyle.roast ? 'text-orange-100' : 'text-slate-400'}`}>
                    Savage & funny
                  </div>
                  {notifStyle.roast && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">✓</span>
                    </div>
                  )}
                </button>
              </div>
              {!notifStyle.plain && !notifStyle.motivation && !notifStyle.roast && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">⚠️ Select at least one style — plain will be used as fallback.</p>
              )}
            </div>

            {/* Save button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSaveReminder}
                disabled={reminderDays.length === 0 || (reminderMode === 'scheduled' && scheduledTimes.length === 0)}
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
            <BellOff size={14} /> No reminder set. Tap &quot;Set Reminder&quot; to choose when and how often you get notified.
          </p>
        )}
      </div>

      {/* Remaining Tasks Today */}
      {allHabits.length > 0 && (() => {
        const today = new Date().toISOString().split('T')[0]
        const todayLogs = allLogs.filter(l => l.log_date === today)
        const completedIds = new Set(todayLogs.filter(l => l.completed).map(l => l.habit_id))
        const pending = allHabits.filter(h => h.is_active && !completedIds.has(h.id))
        const done = allHabits.filter(h => h.is_active && completedIds.has(h.id))
        const totalActive = allHabits.filter(h => h.is_active).length

        return (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-brand-500" />
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Today&apos;s Tasks</h2>
              </div>
              <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full">
                {done.length}/{totalActive} done
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-4">
              <div
                className="bg-gradient-to-r from-brand-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${totalActive > 0 ? (done.length / totalActive) * 100 : 0}%` }}
              />
            </div>

            {pending.length === 0 ? (
              <div className="text-center py-3">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">🎉 All experiments logged today!</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Amazing work — keep the momentum going.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Pending tasks */}
                {pending.map(h => (
                  <Link
                    key={h.id}
                    href={`/habits/${h.id}/log`}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors group"
                  >
                    <Circle size={16} className="text-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{h.title}</p>
                      <p className="text-[10px] text-amber-500 dark:text-amber-400">Pending — tap to log</p>
                    </div>
                    <span className="text-[10px] text-amber-500 group-hover:text-brand-600 transition-colors">Log →</span>
                  </Link>
                ))}
                {/* Completed tasks */}
                {done.map(h => (
                  <div
                    key={h.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30"
                  >
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate line-through">{h.title}</p>
                      <p className="text-[10px] text-emerald-500">Done ✓</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

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
