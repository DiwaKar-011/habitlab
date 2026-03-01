// Notification store — persisted in localStorage
import { AppNotification, HabitReminder, NotificationStylePrefs } from '@/types'

const NOTIF_KEY = 'habitlab_notifications'
const REMINDER_KEY = 'habitlab_reminders'
const PERMISSION_KEY = 'habitlab_notif_permission'
const GLOBAL_STYLE_KEY = 'habitlab_notification_style'

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

  const tag = `habitlab-${Date.now()}`

  // Prefer Service Worker showNotification (required on Android Chrome)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      icon: icon || '/favicon.ico',
      tag,
    })
    return
  }

  // Also try via ready registration (SW may not have controller yet)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.showNotification(title, {
          body,
          icon: icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag,
          requireInteraction: false,
        } as NotificationOptions)
      })
      .catch(() => {
        // Fallback to Notification constructor (desktop only)
        fallbackNotification(title, body, icon, tag)
      })
    return
  }

  // Final fallback for desktop browsers without SW
  fallbackNotification(title, body, icon, tag)
}

function fallbackNotification(title: string, body: string, icon?: string, tag?: string) {
  try {
    const notif = new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag || `habitlab-${Date.now()}`,
      requireInteraction: false,
    })
    setTimeout(() => notif.close(), 8000)
    notif.onclick = () => {
      window.focus()
      notif.close()
    }
  } catch {
    // Notification constructor not supported (e.g. Android Chrome)
  }
}

// Register service worker for notification support
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    console.log('[HabitLab] Service Worker registered:', registration.scope)
    return registration
  } catch (err) {
    console.warn('[HabitLab] Service Worker registration failed:', err)
    return null
  }
}

// Request permission and register SW in one call
export async function initNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'

  // Register service worker first
  await registerServiceWorker()

  // Request permission
  const result = await Notification.requestPermission()
  localStorage.setItem(PERMISSION_KEY, result)
  return result
}

// ─── Global Notification Style Preferences ────────────────

const defaultStylePrefs: NotificationStylePrefs = {
  plain: true,
  motivation: true,
  roast: false,
}

export function getGlobalNotificationStyle(): NotificationStylePrefs {
  if (typeof window === 'undefined') return defaultStylePrefs
  try {
    const raw = localStorage.getItem(GLOBAL_STYLE_KEY)
    if (!raw) return defaultStylePrefs
    return { ...defaultStylePrefs, ...JSON.parse(raw) }
  } catch {
    return defaultStylePrefs
  }
}

export function saveGlobalNotificationStyle(prefs: NotificationStylePrefs) {
  localStorage.setItem(GLOBAL_STYLE_KEY, JSON.stringify(prefs))
}

/**
 * Resolve final style prefs — per-habit prefs override global if set.
 */
export function resolveStylePrefs(reminder?: HabitReminder): NotificationStylePrefs {
  const global = getGlobalNotificationStyle()
  if (reminder?.notification_style) {
    return reminder.notification_style
  }
  return global
}
