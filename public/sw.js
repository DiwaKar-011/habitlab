// HabitLab Service Worker — enables push notifications on Android
// Supports both local notifications AND Web Push (offline) notifications
// This file must be served from the root scope (/)

const CACHE_NAME = 'habitlab-sw-v1'

// Track scheduled reminder timeouts so we can clear them on update
let scheduledTimers = []

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// ─── Periodic Background Sync ─────────────────────────────────
// This fires periodically (even when the website is completely closed)
// on supported browsers (Chrome Android). It calls the server to check
// if any reminders need to send push notifications.
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'habitlab-push-check') {
    event.waitUntil(
      fetch('/api/push/send')
        .then((res) => res.json())
        .then((data) => {
          console.log('[SW] Periodic sync push check:', data)
        })
        .catch((err) => {
          console.error('[SW] Periodic sync error:', err)
        })
    )
  }
})

// ─── Regular Background Sync (one-time, fires when back online) ──
self.addEventListener('sync', (event) => {
  if (event.tag === 'habitlab-push-check') {
    event.waitUntil(
      fetch('/api/push/send')
        .then((res) => res.json())
        .catch(() => {})
    )
  }
})

// ─── Web Push: fires even when the website is completely closed ───
self.addEventListener('push', (event) => {
  let data = { title: 'HabitLab', body: 'Time to check your habits!', url: '/dashboard' }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch {
      data.body = event.data.text() || data.body
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || `habitlab-push-${Date.now()}`,
    vibrate: [200, 100, 200],
    requireInteraction: false,
    data: { url: data.url || '/dashboard' },
    actions: [
      { action: 'open', title: 'Open HabitLab' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Listen for notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/dashboard'

  // Handle action buttons
  if (event.action === 'dismiss') return

  // Open or focus the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window tab is already open, focus it
      for (const client of clientList) {
        if (client.url.includes('/dashboard') || client.url.includes('/habits') || client.url.includes('/notifications')) {
          return client.focus()
        }
      }
      // Otherwise open a new tab
      return self.clients.openWindow(url)
    })
  )
})

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag } = event.data
    self.registration.showNotification(title, {
      body: body || '',
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag || `habitlab-${Date.now()}`,
      vibrate: [200, 100, 200],
      requireInteraction: false,
    })
  }

  // Schedule future notifications so they fire even when the tab is backgrounded
  if (event.data && event.data.type === 'SCHEDULE_REMINDERS') {
    // Clear any previously scheduled timers
    for (const tid of scheduledTimers) {
      clearTimeout(tid)
    }
    scheduledTimers = []

    const reminders = event.data.reminders || []
    const now = Date.now()

    for (const r of reminders) {
      const delay = r.fireAt - now
      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        // Schedule notification to fire at the right time
        const tid = setTimeout(() => {
          self.registration.showNotification(r.title || 'HabitLab Reminder', {
            body: r.body || '',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: r.tag || `habitlab-scheduled-${Date.now()}`,
            vibrate: [200, 100, 200],
            requireInteraction: false,
          })
        }, delay)
        scheduledTimers.push(tid)
      }
    }
  }
})
