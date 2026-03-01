// Reminder scheduler — runs in the browser, checks every minute
// whether any habit reminders should fire based on user settings

import { HabitReminder } from '@/types'
import {
  getReminders,
  addNotification,
  sendBrowserNotification,
  resolveStylePrefs,
} from './notificationStore'
import { getRandomQuote, getRandomRoast } from './motivationQuotes'
import { getWaterSettings, getRandomWaterMessage } from './waterStore'

const LAST_FIRED_KEY = 'habitlab_reminder_last_fired'

function getLastFired(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LAST_FIRED_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setLastFired(reminderId: string, ts: number) {
  const all = getLastFired()
  all[reminderId] = ts
  localStorage.setItem(LAST_FIRED_KEY, JSON.stringify(all))
}

function getIntervalMs(reminder: HabitReminder): number {
  switch (reminder.frequency) {
    case 'once':
      return 24 * 60 * 60 * 1000 // only once per day
    case 'every_30min':
      return 30 * 60 * 1000
    case 'every_1hr':
      return 60 * 60 * 1000
    case 'every_2hr':
      return 2 * 60 * 60 * 1000
    case 'every_4hr':
      return 4 * 60 * 60 * 1000
    case 'custom':
      return (reminder.custom_interval_min || 60) * 60 * 1000
    default:
      return 60 * 60 * 1000
  }
}

function parseTime(timeStr: string): { h: number; m: number } {
  const [h, m] = timeStr.split(':').map(Number)
  return { h: h || 0, m: m || 0 }
}

function isWithinTimeWindow(reminder: HabitReminder, now: Date): boolean {
  const { h: sh, m: sm } = parseTime(reminder.start_time)
  const { h: eh, m: em } = parseTime(reminder.end_time)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  const nowMin = now.getHours() * 60 + now.getMinutes()
  return nowMin >= startMin && nowMin <= endMin
}

function isTodayEnabled(reminder: HabitReminder, now: Date): boolean {
  return reminder.days_of_week.includes(now.getDay())
}

function shouldFire(reminder: HabitReminder, now: Date, lastFired: Record<string, number>): boolean {
  if (!reminder.enabled) return false
  if (!isTodayEnabled(reminder, now)) return false

  const mode = reminder.mode || 'recurring'

  if (mode === 'scheduled') {
    // Scheduled mode — fire at each exact scheduled time
    const times = reminder.scheduled_times || []
    const nowMin = now.getHours() * 60 + now.getMinutes()

    for (const t of times) {
      const { h, m } = parseTime(t)
      const schedMin = h * 60 + m
      // Fire if we're within ±1 minute window of the scheduled time
      // (or if scheduled time has passed but hasn't been fired today — catch-up)
      const diff = nowMin - schedMin
      const isNearSchedule = Math.abs(diff) <= 1
      const isMissedToday = diff > 1 && diff <= 60 // missed within the last hour (catch-up window)
      
      if (isNearSchedule || isMissedToday) {
        // Build a unique key per time slot so each fires independently
        const slotKey = `${reminder.id}__${t}`
        const last = lastFired[slotKey] || 0
        // Only fire once per day per slot (at least 12h gap)
        if (now.getTime() - last >= 12 * 60 * 60 * 1000) {
          return true
        }
      }
    }
    return false
  }

  // Recurring mode — interval-based
  if (!isWithinTimeWindow(reminder, now)) return false
  const last = lastFired[reminder.id] || 0
  const interval = getIntervalMs(reminder)
  return (now.getTime() - last) >= interval
}

function getScheduledSlotKey(reminder: HabitReminder, now: Date): string {
  // For scheduled mode, find the matching time slot
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const times = reminder.scheduled_times || []
  for (const t of times) {
    const { h, m } = parseTime(t)
    if (h * 60 + m === nowMin) return `${reminder.id}__${t}`
  }
  return reminder.id
}

const motivationalMessages = [
  "🧪 Time to work on your habit! Small steps lead to big changes.",
  "🧠 Your brain is building new neural pathways — keep going!",
  "🔥 Don't break the streak! Log your habit now.",
  "💪 Science says consistency beats intensity. You got this!",
  "⭐ Your future self will thank you. Complete your habit!",
  "📊 Remember your hypothesis? Let's collect more data today.",
  "🔔 The habit loop needs a trigger — this is yours!",
  "🛤️ Every repetition strengthens your neural pathway.",
]

function getRandomMessage(): string {
  return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
}

function getRoastOrMotivation(reminder?: HabitReminder): { type: 'roast' | 'motivation' | 'reminder'; title: string; message: string } {
  const prefs = resolveStylePrefs(reminder)
  
  // Build pool of allowed styles
  const pool: Array<'roast' | 'motivation' | 'plain'> = []
  if (prefs.roast) pool.push('roast')
  if (prefs.motivation) pool.push('motivation')
  if (prefs.plain) pool.push('plain')
  
  // If nothing is enabled, default to plain
  if (pool.length === 0) pool.push('plain')
  
  const pick = pool[Math.floor(Math.random() * pool.length)]
  
  if (pick === 'roast') {
    return { type: 'roast', title: 'Habit Roast 🔥', message: getRandomRoast() }
  } else if (pick === 'motivation') {
    return { type: 'motivation', title: '✨ Quick Motivation', message: getRandomQuote() }
  }
  return { type: 'reminder', title: '', message: getRandomMessage() }
}

let intervalId: ReturnType<typeof setInterval> | null = null
let lastCheckTimestamp: number = 0
let listenersAttached = false

function checkWaterReminder(now: Date, lastFired: Record<string, number>) {
  const settings = getWaterSettings()
  if (!settings.enabled || !settings.reminder_enabled) return

  // Build a virtual HabitReminder for the water reminder
  const waterReminder: HabitReminder = {
    id: 'water-reminder',
    habit_id: 'water',
    habit_title: 'Drink Water',
    enabled: true,
    mode: 'recurring',
    frequency: settings.reminder_frequency,
    custom_interval_min: settings.custom_interval_min,
    start_time: settings.start_time,
    end_time: settings.end_time,
    days_of_week: settings.days_of_week,
    created_at: '',
  }

  if (shouldFire(waterReminder, now, lastFired)) {
    const msg = getRandomWaterMessage()
    addNotification({
      type: 'reminder',
      title: '💧 Drink Water',
      message: msg,
    })
    sendBrowserNotification('💧 Drink Water', msg)
    setLastFired('water-reminder', now.getTime())
  }
}

export function checkAndFireReminders() {
  const now = new Date()
  lastCheckTimestamp = now.getTime()
  const reminders = getReminders()
  const lastFired = getLastFired()

  for (const reminder of reminders) {
    if (shouldFire(reminder, now, lastFired)) {
      const variation = getRoastOrMotivation(reminder)
      const notifTitle = variation.type === 'reminder' ? `⏰ ${reminder.habit_title}` : variation.title
      const notifMessage = variation.message

      // Fire in-app notification
      addNotification({
        type: variation.type,
        title: notifTitle,
        message: notifMessage,
        habit_id: reminder.habit_id,
      })

      // Fire browser notification
      sendBrowserNotification(notifTitle, notifMessage)

      // Use slot key for scheduled mode, regular id for recurring
      const fireKey = (reminder.mode === 'scheduled')
        ? getScheduledSlotKey(reminder, now)
        : reminder.id
      setLastFired(fireKey, now.getTime())
    }
  }

  // Also check water reminders
  checkWaterReminder(now, lastFired)
}

/**
 * Sync upcoming reminders to the Service Worker so notifications
 * can fire even when the tab is backgrounded / throttled.
 */
export function syncRemindersToServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  const now = new Date()
  const reminders = getReminders()
  const lastFired = getLastFired()
  const upcoming: Array<{ title: string; body: string; fireAt: number; tag: string }> = []

  for (const reminder of reminders) {
    if (!reminder.enabled) continue
    if (!isTodayEnabled(reminder, now)) continue

    if (reminder.mode === 'scheduled') {
      // For scheduled reminders, compute exact fire times today
      const times = reminder.scheduled_times || []
      for (const t of times) {
        const { h, m } = parseTime(t)
        const fireDate = new Date(now)
        fireDate.setHours(h, m, 0, 0)
        const slotKey = `${reminder.id}__${t}`
        const last = lastFired[slotKey] || 0
        // Only schedule if it's in the future and hasn't fired today
        if (fireDate.getTime() > now.getTime() && now.getTime() - last >= 12 * 60 * 60 * 1000) {
          const variation = getRoastOrMotivation(reminder)
          upcoming.push({
            title: variation.type === 'reminder' ? `⏰ ${reminder.habit_title}` : variation.title,
            body: variation.message,
            fireAt: fireDate.getTime(),
            tag: `reminder-${slotKey}`,
          })
        }
      }
    } else {
      // For recurring reminders, compute the next fire time
      const last = lastFired[reminder.id] || 0
      const interval = getIntervalMs(reminder)
      const nextFire = last === 0 ? now.getTime() + 60000 : last + interval
      if (nextFire > now.getTime() && isWithinTimeWindow(reminder, new Date(nextFire))) {
        const variation = getRoastOrMotivation(reminder)
        upcoming.push({
          title: variation.type === 'reminder' ? `⏰ ${reminder.habit_title}` : variation.title,
          body: variation.message,
          fireAt: nextFire,
          tag: `reminder-${reminder.id}`,
        })
      }
    }
  }

  // Send to service worker
  const sw = navigator.serviceWorker.controller
  if (sw) {
    sw.postMessage({ type: 'SCHEDULE_REMINDERS', reminders: upcoming })
  } else {
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({ type: 'SCHEDULE_REMINDERS', reminders: upcoming })
    }).catch(() => {})
  }
}

/**
 * Called when the page regains visibility or focus.
 * Catches up on any reminders missed while the tab was backgrounded.
 */
function onTabResume() {
  const now = Date.now()
  // If more than 70s since last check, the interval was likely throttled
  if (now - lastCheckTimestamp > 70_000) {
    console.log('[HabitLab] Tab resumed after background — catching up on reminders')
    checkAndFireReminders()
    syncRemindersToServiceWorker()
  }
}

function attachLifecycleListeners() {
  if (listenersAttached || typeof document === 'undefined') return
  listenersAttached = true

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      onTabResume()
      // Restart interval in case it was killed
      ensureIntervalRunning()
    } else {
      // Tab going to background — sync to SW so it can fire notifications
      syncRemindersToServiceWorker()
    }
  })

  window.addEventListener('focus', () => {
    onTabResume()
    ensureIntervalRunning()
  })
}

function ensureIntervalRunning() {
  if (intervalId) return
  intervalId = setInterval(checkAndFireReminders, 60 * 1000)
}

export function startReminderScheduler() {
  if (intervalId) return // already running

  // Check immediately
  checkAndFireReminders()

  // Then check every 60 seconds
  intervalId = setInterval(checkAndFireReminders, 60 * 1000)

  // Attach lifecycle listeners to catch up after background
  attachLifecycleListeners()

  // Sync upcoming reminders to the service worker
  syncRemindersToServiceWorker()
}

export function stopReminderScheduler() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

export function isSchedulerRunning(): boolean {
  return intervalId !== null
}
