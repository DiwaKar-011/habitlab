// Push subscription management — subscribes the browser to Web Push
// so notifications can arrive even when the website is completely closed.

const PUSH_SUB_KEY = 'habitlab_push_subscribed'

/**
 * Convert a base64-URL string to a Uint8Array (needed for applicationServerKey)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Subscribe the current browser to Web Push notifications.
 * Sends the subscription to our server so it can push later.
 */
export async function subscribeToPush(userId: string): Promise<PushSubscription | null> {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[HabitLab] Push notifications not supported in this browser')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.warn('[HabitLab] VAPID public key not configured')
        return null
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      })

      console.log('[HabitLab] Push subscription created')
    }

    // Send subscription to server
    await saveSubscriptionToServer(userId, subscription)
    localStorage.setItem(PUSH_SUB_KEY, 'true')
    // Store userId for auto-sync of reminders
    localStorage.setItem('habitlab_push_uid', userId)

    return subscription
  } catch (err) {
    console.error('[HabitLab] Failed to subscribe to push:', err)
    return null
  }
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribeFromPush(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
      console.log('[HabitLab] Push subscription removed')
    }
    localStorage.removeItem(PUSH_SUB_KEY)
  } catch (err) {
    console.error('[HabitLab] Failed to unsubscribe from push:', err)
  }
}

/**
 * Check if the browser is currently subscribed to push.
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return !!subscription
  } catch {
    return false
  }
}

/**
 * Save the push subscription to our server (Firestore via API route).
 */
async function saveSubscriptionToServer(userId: string, subscription: PushSubscription) {
  try {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON(),
      }),
    })
    if (!res.ok) {
      console.error('[HabitLab] Failed to save push subscription:', await res.text())
    }
  } catch (err) {
    console.error('[HabitLab] Error saving push subscription:', err)
  }
}

/**
 * Sync the user's reminders to the server so they can trigger push
 * notifications even when the browser is closed.
 */
export async function syncRemindersToServer(userId: string) {
  if (typeof window === 'undefined') return

  try {
    const { getReminders } = await import('./notificationStore')
    const reminders = getReminders()

    const res = await fetch('/api/push/sync-reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, reminders }),
    })
    if (!res.ok) {
      console.error('[HabitLab] Failed to sync reminders:', await res.text())
    }
  } catch (err) {
    console.error('[HabitLab] Error syncing reminders:', err)
  }
}
