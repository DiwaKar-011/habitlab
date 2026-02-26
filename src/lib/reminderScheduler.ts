// Reminder scheduler — runs in the browser, checks every minute
// whether any habit reminders should fire based on user settings

import { HabitReminder } from '@/types'
import {
  getReminders,
  addNotification,
  sendBrowserNotification,
} from './notificationStore'

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
  "Time to work on your habit! Small steps lead to big changes 🧪",
  "Your brain is building new neural pathways — keep going! 🧠",
  "Don't break the streak! Log your habit now 🔥",
  "Science says consistency beats intensity. You got this! 💪",
  "Your future self will thank you. Complete your habit! ⭐",
  "Remember your hypothesis? Let's collect more data today 📊",
  "The habit loop needs a trigger — this is yours! 🔔",
  "Every repetition strengthens your neural pathway 🛤️",
]

function getRandomMessage(): string {
  return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
}

let intervalId: ReturnType<typeof setInterval> | null = null

export function checkAndFireReminders() {
  const now = new Date()
  const reminders = getReminders()
  const lastFired = getLastFired()

  for (const reminder of reminders) {
    if (shouldFire(reminder, now, lastFired)) {
      // Fire in-app notification
      addNotification({
        type: 'reminder',
        title: `⏰ ${reminder.habit_title}`,
        message: getRandomMessage(),
        habit_id: reminder.habit_id,
      })

      // Fire browser notification
      sendBrowserNotification(
        `⏰ ${reminder.habit_title}`,
        getRandomMessage()
      )

      setLastFired(reminder.id, now.getTime())
    }
  }
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
