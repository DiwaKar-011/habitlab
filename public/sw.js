// HabitLab Service Worker — enables push notifications on Android
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

// Listen for notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

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
      return self.clients.openWindow('/dashboard')
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
