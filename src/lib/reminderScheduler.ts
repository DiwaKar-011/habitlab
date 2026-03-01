// Reminder scheduler — runs in the browser, checks every minute
// whether any habit reminders should fire based on user settings

import { HabitReminder } from '@/types'
import {
  getReminders,
  addNotification,
  sendBrowserNotification,
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
  if (!isWithinTimeWindow(reminder, now)) return false

  const last = lastFired[reminder.id] || 0
  const interval = getIntervalMs(reminder)
  return (now.getTime() - last) >= interval
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

function getRoastOrMotivation(): { type: 'roast' | 'motivation' | 'reminder'; title: string; message: string } {
  const roll = Math.random()
  if (roll < 0.25) {
    // 25% chance of roast
    return { type: 'roast', title: 'Habit Roast 🔥', message: getRandomRoast() }
  } else if (roll < 0.5) {
    // 25% chance of motivation quote
    return { type: 'motivation', title: '✨ Quick Motivation', message: getRandomQuote() }
  }
  // 50% normal reminder
  return { type: 'reminder', title: '', message: getRandomMessage() }
}

let intervalId: ReturnType<typeof setInterval> | null = null

function checkWaterReminder(now: Date, lastFired: Record<string, number>) {
  const settings = getWaterSettings()
  if (!settings.enabled || !settings.reminder_enabled) return

  // Build a virtual HabitReminder for the water reminder
  const waterReminder: HabitReminder = {
    id: 'water-reminder',
    habit_id: 'water',
    habit_title: 'Drink Water',
    enabled: true,
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
  const reminders = getReminders()
  const lastFired = getLastFired()

  for (const reminder of reminders) {
    if (shouldFire(reminder, now, lastFired)) {
      const variation = getRoastOrMotivation()
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

      setLastFired(reminder.id, now.getTime())
    }
  }

  // Also check water reminders
  checkWaterReminder(now, lastFired)
}

export function startReminderScheduler() {
  if (intervalId) return // already running
  // Check immediately
  checkAndFireReminders()
  // Then check every 60 seconds
  intervalId = setInterval(checkAndFireReminders, 60 * 1000)
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
