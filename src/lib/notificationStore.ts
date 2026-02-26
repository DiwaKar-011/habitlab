// Notification store — persisted in localStorage
import { AppNotification, HabitReminder } from '@/types'

const NOTIF_KEY = 'habitlab_notifications'
const REMINDER_KEY = 'habitlab_reminders'
const PERMISSION_KEY = 'habitlab_notif_permission'

// ─── Notifications ────────────────────────────────────

export function getNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(NOTIF_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addNotification(notif: Omit<AppNotification, 'id' | 'created_at' | 'read'>): AppNotification {
  const all = getNotifications()
  const full: AppNotification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    read: false,
    created_at: new Date().toISOString(),
  }
  all.unshift(full) // newest first
  // keep max 50
  const trimmed = all.slice(0, 50)
  localStorage.setItem(NOTIF_KEY, JSON.stringify(trimmed))
  return full
}

export function markNotificationRead(id: string) {
  const all = getNotifications()
  const updated = all.map(n => n.id === id ? { ...n, read: true } : n)
  localStorage.setItem(NOTIF_KEY, JSON.stringify(updated))
}

export function markAllRead() {
  const all = getNotifications()
  const updated = all.map(n => ({ ...n, read: true }))
  localStorage.setItem(NOTIF_KEY, JSON.stringify(updated))
}

export function clearNotifications() {
  localStorage.setItem(NOTIF_KEY, JSON.stringify([]))
}

export function getUnreadCount(): number {
  return getNotifications().filter(n => !n.read).length
}

// ─── Reminders ────────────────────────────────────────

export function getReminders(): HabitReminder[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(REMINDER_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveReminder(reminder: HabitReminder) {
  const all = getReminders()
  const idx = all.findIndex(r => r.id === reminder.id)
  if (idx >= 0) {
    all[idx] = reminder
  } else {
    all.push(reminder)
  }
  localStorage.setItem(REMINDER_KEY, JSON.stringify(all))
}

export function deleteReminder(id: string) {
  const all = getReminders().filter(r => r.id !== id)
  localStorage.setItem(REMINDER_KEY, JSON.stringify(all))
}

export function getReminderForHabit(habitId: string): HabitReminder | undefined {
  return getReminders().find(r => r.habit_id === habitId)
}

// ─── Browser Permission ───────────────────────────────

export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  const result = await Notification.requestPermission()
  localStorage.setItem(PERMISSION_KEY, result)
  return result
}

export function sendBrowserNotification(title: string, body: string, icon?: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const notif = new Notification(title, {
    body,
    icon: icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: `habitlab-${Date.now()}`,
    requireInteraction: false,
  })

  // auto-close after 8s
  setTimeout(() => notif.close(), 8000)

  notif.onclick = () => {
    window.focus()
    notif.close()
  }
}
