'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  BellRing,
  Clock,
  Calendar,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Volume2,
  VolumeX,
  Settings,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HabitReminder, ReminderFrequency } from '@/types'
import { mockHabits } from '@/lib/mockData'
import {
  getReminders,
  saveReminder,
  deleteReminder,
  getPermissionStatus,
  requestNotificationPermission,
  sendBrowserNotification,
  addNotification,
  getNotifications,
  clearNotifications,
} from '@/lib/notificationStore'
import { checkAndFireReminders } from '@/lib/reminderScheduler'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const FREQUENCY_OPTIONS: { value: ReminderFrequency; label: string; desc: string }[] = [
  { value: 'once', label: 'Once a day', desc: 'Single reminder per day' },
  { value: 'every_30min', label: 'Every 30 min', desc: 'Frequent check-ins' },
  { value: 'every_1hr', label: 'Every hour', desc: 'Hourly nudges' },
  { value: 'every_2hr', label: 'Every 2 hours', desc: 'Moderate frequency' },
  { value: 'every_4hr', label: 'Every 4 hours', desc: 'Light reminders' },
  { value: 'custom', label: 'Custom interval', desc: 'Set your own timing' },
]

export default function NotificationsPage() {
  const [reminders, setReminders] = useState<HabitReminder[]>([])
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [showAdd, setShowAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [recentNotifs, setRecentNotifs] = useState(0)

  // Form state for new reminder
  const [newHabitId, setNewHabitId] = useState('')
  const [newFreq, setNewFreq] = useState<ReminderFrequency>('every_2hr')
  const [newCustomMin, setNewCustomMin] = useState(90)
  const [newStartTime, setNewStartTime] = useState('08:00')
  const [newEndTime, setNewEndTime] = useState('21:00')
  const [newDays, setNewDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])

  const refresh = useCallback(() => {
    setReminders(getReminders())
    setRecentNotifs(getNotifications().length)
  }, [])

  useEffect(() => {
    setPermission(getPermissionStatus())
    refresh()
  }, [refresh])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
    if (result === 'granted') {
      showToast('Browser notifications enabled! 🎉')
      sendBrowserNotification('HabitLab Notifications', 'You will now receive habit reminders! 🧪')
    } else if (result === 'denied') {
      showToast('Permission denied. Enable in browser settings.')
    }
  }

  const handleAddReminder = () => {
    if (!newHabitId) {
      showToast('Please select a habit first')
      return
    }
    const habit = mockHabits.find(h => h.id === newHabitId)
    if (!habit) return

    // Check if reminder already exists for this habit
    if (reminders.some(r => r.habit_id === newHabitId)) {
      showToast('Reminder already exists for this habit')
      return
    }

    const reminder: HabitReminder = {
      id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      habit_id: habit.id,
      habit_title: habit.title,
      enabled: true,
      frequency: newFreq,
      custom_interval_min: newFreq === 'custom' ? newCustomMin : undefined,
      start_time: newStartTime,
      end_time: newEndTime,
      days_of_week: newDays,
      created_at: new Date().toISOString(),
    }

    saveReminder(reminder)
    setShowAdd(false)
    setNewHabitId('')
    refresh()
    showToast(`Reminder set for "${habit.title}" ⏰`)
  }

  const handleToggle = (reminder: HabitReminder) => {
    saveReminder({ ...reminder, enabled: !reminder.enabled })
    refresh()
    showToast(reminder.enabled ? 'Reminder paused' : 'Reminder activated ⏰')
  }

  const handleDelete = (id: string) => {
    deleteReminder(id)
    refresh()
    showToast('Reminder deleted')
  }

  const handleUpdateReminder = (reminder: HabitReminder, updates: Partial<HabitReminder>) => {
    saveReminder({ ...reminder, ...updates })
    refresh()
    showToast('Reminder updated ✓')
  }

  const handleTestNotification = () => {
    addNotification({
      type: 'system',
      title: '🔔 Test Notification',
      message: 'This is a test! Your notifications are working correctly.',
    })
    sendBrowserNotification('🔔 HabitLab Test', 'Notifications are working! You\'ll receive habit reminders here.')
    refresh()
    showToast('Test notification sent!')
  }

  const habitsWithoutReminder = mockHabits.filter(
    h => h.is_active && !reminders.some(r => r.habit_id === h.id)
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[100] bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BellRing className="text-brand-500" size={28} />
            Notifications & Reminders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Set up smart reminders to never miss your habits. Your brain needs consistent cues!
          </p>
        </div>
      </div>

      {/* Permission Card */}
      <div className={cn(
        'rounded-xl border p-5',
        permission === 'granted'
          ? 'bg-green-50 border-green-200'
          : permission === 'denied'
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
      )}>
        <div className="flex items-start gap-4">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            permission === 'granted' ? 'bg-green-100' : permission === 'denied' ? 'bg-red-100' : 'bg-amber-100'
          )}>
            {permission === 'granted' ? (
              <Volume2 size={20} className="text-green-600" />
            ) : permission === 'denied' ? (
              <VolumeX size={20} className="text-red-600" />
            ) : (
              <Bell size={20} className="text-amber-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">
              {permission === 'granted'
                ? 'Browser Notifications Enabled ✓'
                : permission === 'denied'
                  ? 'Browser Notifications Blocked'
                  : permission === 'unsupported'
                    ? 'Browser Notifications Not Supported'
                    : 'Enable Browser Notifications'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {permission === 'granted'
                ? 'You\'ll receive push notifications even when the tab is in the background.'
                : permission === 'denied'
                  ? 'Go to your browser settings to re-enable notifications for this site.'
                  : permission === 'unsupported'
                    ? 'Your browser doesn\'t support notifications. In-app reminders will still work.'
                    : 'Allow notifications to get reminded even when the browser tab is not active.'}
            </p>
          </div>
          <div className="flex-shrink-0 flex gap-2">
            {permission !== 'granted' && permission !== 'unsupported' && (
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition"
              >
                Enable
              </button>
            )}
            <button
              onClick={handleTestNotification}
              className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition"
            >
              Test
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-brand-600">{reminders.filter(r => r.enabled).length}</p>
          <p className="text-xs text-slate-500 mt-1">Active Reminders</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-accent-600">{reminders.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Reminders</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">{recentNotifs}</p>
          <p className="text-xs text-slate-500 mt-1">Notifications Sent</p>
        </div>
      </div>

      {/* Existing Reminders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Your Reminders</h2>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition"
          >
            <Plus size={16} />
            Add Reminder
          </button>
        </div>

        {reminders.length === 0 && !showAdd && (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <Clock size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No reminders set up yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Add reminders for your habits to stay on track
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition"
            >
              Set Your First Reminder
            </button>
          </div>
        )}

        {/* Reminder Cards */}
        {reminders.map((rem) => (
          <motion.div
            key={rem.id}
            layout
            className={cn(
              'bg-white rounded-xl border overflow-hidden transition-colors',
              rem.enabled ? 'border-slate-200' : 'border-slate-100 opacity-60'
            )}
          >
            {/* Summary Row */}
            <div className="flex items-center gap-4 p-4">
              <button
                onClick={() => handleToggle(rem)}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition',
                  rem.enabled
                    ? 'bg-brand-100 text-brand-600 hover:bg-brand-200'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                )}
              >
                {rem.enabled ? <Power size={18} /> : <PowerOff size={18} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{rem.habit_title}</p>
                <p className="text-xs text-slate-500">
                  {FREQUENCY_OPTIONS.find(f => f.value === rem.frequency)?.label || rem.frequency}
                  {' · '}
                  {rem.start_time} – {rem.end_time}
                  {' · '}
                  {rem.days_of_week.length === 7
                    ? 'Every day'
                    : rem.days_of_week.map(d => DAYS[d]).join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setExpandedId(expandedId === rem.id ? null : rem.id)}
                  className="p-2 rounded-md hover:bg-slate-100 transition"
                >
                  {expandedId === rem.id ? (
                    <ChevronUp size={16} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-400" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(rem.id)}
                  className="p-2 rounded-md hover:bg-red-50 transition text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Expanded Edit Section */}
            <AnimatePresence>
              {expandedId === rem.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100"
                >
                  <div className="p-4 space-y-4 bg-slate-50">
                    {/* Frequency */}
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Frequency</label>
                      <div className="grid grid-cols-3 gap-2">
                        {FREQUENCY_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => handleUpdateReminder(rem, { frequency: opt.value })}
                            className={cn(
                              'px-3 py-2 rounded-lg text-xs font-medium border transition',
                              rem.frequency === opt.value
                                ? 'bg-brand-50 border-brand-300 text-brand-700'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {rem.frequency === 'custom' && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-slate-500">Every</span>
                          <input
                            type="number"
                            min={5}
                            max={480}
                            value={rem.custom_interval_min || 60}
                            onChange={(e) => handleUpdateReminder(rem, { custom_interval_min: Number(e.target.value) })}
                            className="w-20 px-2 py-1 rounded border border-slate-300 text-sm"
                          />
                          <span className="text-xs text-slate-500">minutes</span>
                        </div>
                      )}
                    </div>

                    {/* Time Window */}
                    <div className="flex gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Start Time</label>
                        <input
                          type="time"
                          value={rem.start_time}
                          onChange={e => handleUpdateReminder(rem, { start_time: e.target.value })}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">End Time</label>
                        <input
                          type="time"
                          value={rem.end_time}
                          onChange={e => handleUpdateReminder(rem, { end_time: e.target.value })}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                        />
                      </div>
                    </div>

                    {/* Days */}
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Active Days</label>
                      <div className="flex gap-1.5">
                        {DAYS.map((day, i) => (
                          <button
                            key={day}
                            onClick={() => {
                              const newDays = rem.days_of_week.includes(i)
                                ? rem.days_of_week.filter(d => d !== i)
                                : [...rem.days_of_week, i].sort()
                              if (newDays.length > 0) {
                                handleUpdateReminder(rem, { days_of_week: newDays })
                              }
                            }}
                            className={cn(
                              'w-10 h-10 rounded-full text-xs font-medium transition',
                              rem.days_of_week.includes(i)
                                ? 'bg-brand-500 text-white'
                                : 'bg-white border border-slate-200 text-slate-500 hover:border-brand-300'
                            )}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Add New Reminder Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-xl border border-brand-200 p-5 space-y-4"
          >
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Plus size={18} className="text-brand-500" />
              New Reminder
            </h3>

            {/* Habit Select */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Select Habit</label>
              {habitsWithoutReminder.length > 0 ? (
                <select
                  value={newHabitId}
                  onChange={(e) => setNewHabitId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value="">Choose a habit...</option>
                  {habitsWithoutReminder.map(h => (
                    <option key={h.id} value={h.id}>{h.title}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-slate-400 italic">All habits already have reminders set up!</p>
              )}
            </div>

            {/* Frequency */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">How often?</label>
              <div className="grid grid-cols-3 gap-2">
                {FREQUENCY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setNewFreq(opt.value)}
                    className={cn(
                      'px-3 py-2.5 rounded-lg text-xs font-medium border transition text-left',
                      newFreq === opt.value
                        ? 'bg-brand-50 border-brand-300 text-brand-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <span className="block">{opt.label}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
              {newFreq === 'custom' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500">Every</span>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={newCustomMin}
                    onChange={(e) => setNewCustomMin(Number(e.target.value))}
                    className="w-20 px-2 py-1 rounded border border-slate-300 text-sm"
                  />
                  <span className="text-xs text-slate-500">minutes</span>
                </div>
              )}
            </div>

            {/* Time Window */}
            <div className="flex gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Remind from</label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={e => setNewStartTime(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Until</label>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={e => setNewEndTime(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
            </div>

            {/* Days */}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-2 block">Which days?</label>
              <div className="flex gap-1.5">
                {DAYS.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => {
                      setNewDays(prev =>
                        prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i].sort()
                      )
                    }}
                    className={cn(
                      'w-10 h-10 rounded-full text-xs font-medium transition',
                      newDays.includes(i)
                        ? 'bg-brand-500 text-white'
                        : 'bg-white border border-slate-200 text-slate-500 hover:border-brand-300'
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReminder}
                className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition flex items-center gap-2"
              >
                <Bell size={16} />
                Save Reminder
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Science Info Box */}
      <div className="bg-gradient-to-br from-accent-50 to-brand-50 rounded-xl border border-accent-200 p-5">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
          <AlertCircle size={16} className="text-accent-500" />
          The Science of Reminders
        </h3>
        <div className="mt-3 space-y-2 text-xs text-slate-600">
          <p>
            <strong>Cue-Routine-Reward:</strong> Reminders act as external cues in the habit loop.
            Over time, your brain learns to associate the cue with the behavior automatically.
          </p>
          <p>
            <strong>Implementation Intentions:</strong> Research by Peter Gollwitzer shows that planning
            when and where you&apos;ll act increases follow-through by 2-3x.
          </p>
          <p>
            <strong>Spaced Reminders:</strong> Multiple gentle nudges throughout the day are more effective
            than a single reminder — they leverage the spacing effect from memory science.
          </p>
          <p>
            <strong>Tip:</strong> Start with frequent reminders (every 1-2 hours), then reduce them as your
            habit becomes automatic — usually after 21-66 days according to research.
          </p>
        </div>
      </div>

      {/* Clear All Notifications */}
      {recentNotifs > 0 && (
        <div className="text-center">
          <button
            onClick={() => {
              clearNotifications()
              refresh()
              showToast('All notifications cleared')
            }}
            className="text-xs text-slate-400 hover:text-red-500 transition"
          >
            Clear all {recentNotifs} notifications from history
          </button>
        </div>
      )}
    </div>
  )
}
