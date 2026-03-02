// API route: Trigger push notifications for due reminders
// GET /api/push/send   (called by Vercel cron, external cron, or periodic sync)
//
// This checks all user_reminders in Firestore and sends Web Push
// notifications to subscribed browsers — works even when the website is closed.
//
// Supports a CATCH-UP window: if the endpoint hasn't been called for a while,
// it sends notifications for ALL reminders that were missed since the last check.

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
// @ts-expect-error — web-push has no bundled types
import webpush from 'web-push'

// Configure web-push with VAPID keys
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.NEXT_PUBLIC_APP_URL || 'https://habitlab.vercel.app'

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(
      `mailto:noreply@${new URL(VAPID_SUBJECT).hostname}`,
      VAPID_PUBLIC,
      VAPID_PRIVATE
    )
  } catch {
    console.warn('[Push] Failed to set VAPID details')
  }
}

// ─── Motivational messages pool ────────────────────────────────
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

// ─── Time helpers ──────────────────────────────────────────────
function parseTime(timeStr: string): { h: number; m: number } {
  const [h, m] = (timeStr || '08:00').split(':').map(Number)
  return { h: h || 0, m: m || 0 }
}

function timeToMinutes(h: number, m: number): number {
  return h * 60 + m
}

function isWithinTimeWindow(reminder: any, nowMin: number): boolean {
  const { h: sh, m: sm } = parseTime(reminder.start_time || '08:00')
  const { h: eh, m: em } = parseTime(reminder.end_time || '22:00')
  return nowMin >= timeToMinutes(sh, sm) && nowMin <= timeToMinutes(eh, em)
}

function isTodayEnabled(reminder: any, dayOfWeek: number): boolean {
  const days = reminder.days_of_week || [0, 1, 2, 3, 4, 5, 6]
  return days.includes(dayOfWeek)
}

function getIntervalMs(reminder: any): number {
  switch (reminder.frequency) {
    case 'once': return 24 * 60 * 60 * 1000
    case 'every_30min': return 30 * 60 * 1000
    case 'every_1hr': return 60 * 60 * 1000
    case 'every_2hr': return 2 * 60 * 60 * 1000
    case 'every_4hr': return 4 * 60 * 60 * 1000
    case 'custom': return (reminder.custom_interval_min || 60) * 60 * 1000
    default: return 60 * 60 * 1000
  }
}

/**
 * Check if a reminder should fire NOW, with a catch-up window.
 * catchUpMinutes: how far back to look for missed reminders (default 30 min).
 */
function shouldFire(
  reminder: any,
  now: Date,
  lastFired: Record<string, number>,
  catchUpMinutes = 30
): Array<{ key: string; title: string }> {
  if (!reminder.enabled) return []
  if (!isTodayEnabled(reminder, now.getDay())) return []

  const results: Array<{ key: string; title: string }> = []
  const nowMs = now.getTime()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const mode = reminder.mode || 'recurring'

  if (mode === 'scheduled') {
    const times = reminder.scheduled_times || []
    for (const t of times) {
      const { h, m } = parseTime(t)
      const schedMin = timeToMinutes(h, m)
      const diff = nowMin - schedMin

      // Fire if within catch-up window (missed up to catchUpMinutes ago)
      if (diff >= -1 && diff <= catchUpMinutes) {
        const slotKey = `${reminder.id}__${t}`
        const last = lastFired[slotKey] || 0
        if (nowMs - last >= 10 * 60 * 60 * 1000) {
          results.push({ key: slotKey, title: reminder.habit_title || 'HabitLab Reminder' })
        }
      }
    }
    return results
  }

  // Recurring mode — interval-based with catch-up
  if (!isWithinTimeWindow(reminder, nowMin)) return []
  const last = lastFired[reminder.id] || 0
  const interval = getIntervalMs(reminder)
  if (nowMs - last >= interval) {
    results.push({ key: reminder.id, title: reminder.habit_title || 'HabitLab Reminder' })
  }
  return results
}

// ─── Main handler ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
  }

  try {
    const now = new Date()
    let totalSent = 0
    let totalErrors = 0

    // Get all user reminders from Firestore
    const remindersSnap = await adminDb.collection('user_reminders').get()

    for (const userDoc of remindersSnap.docs) {
      const data = userDoc.data()
      const userId = data.userId
      const reminders = data.reminders || []
      const lastFired: Record<string, number> = data.lastFired || {}

      if (reminders.length === 0) continue

      // Check which reminders should fire (with 30-min catch-up window)
      const toFire: Array<{ key: string; title: string; reminder: any }> = []
      for (const reminder of reminders) {
        const hits = shouldFire(reminder, now, lastFired, 30)
        for (const hit of hits) {
          toFire.push({ ...hit, reminder })
        }
      }

      if (toFire.length === 0) continue

      // Get all push subscriptions for this user
      const subsSnap = await adminDb
        .collection('push_subscriptions')
        .where('userId', '==', userId)
        .get()

      if (subsSnap.empty) continue

      // Send push for each due reminder
      for (const { reminder, key, title } of toFire) {
        const message = getRandomMessage()
        const payload = JSON.stringify({
          title: `⏰ ${title}`,
          body: message,
          icon: '/favicon.ico',
          tag: `push-${key}`,
          url: reminder.habit_id ? `/habits/${reminder.habit_id}` : '/dashboard',
        })

        // Send to all subscriptions of this user
        for (const subDoc of subsSnap.docs) {
          const subData = subDoc.data()
          try {
            await webpush.sendNotification(subData.subscription, payload)
            totalSent++
          } catch (err: any) {
            totalErrors++
            if (err.statusCode === 410 || err.statusCode === 404) {
              await adminDb.collection('push_subscriptions').doc(subDoc.id).delete()
            } else {
              console.error(`[Push] Error for ${subDoc.id}:`, err.statusCode || err.message)
            }
          }
        }

        // Mark as fired
        lastFired[key] = now.getTime()
      }

      // Save updated lastFired
      await adminDb.collection('user_reminders').doc(userDoc.id).update({ lastFired })
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
      errors: totalErrors,
      checkedAt: now.toISOString(),
    })
  } catch (err: any) {
    console.error('[Push Send] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
