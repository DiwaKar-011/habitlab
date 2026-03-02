// API route: Trigger push notifications for due reminders
// GET /api/push/send   (called by cron job or client-side keep-alive)
//
// This checks all user_reminders in Firestore and sends Web Push
// notifications to subscribed browsers — works even when the website is closed.

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
// @ts-expect-error — web-push has no bundled types
import webpush from 'web-push'

// Configure web-push with VAPID keys
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(`mailto:habitlab@${new URL(VAPID_SUBJECT).hostname}`, VAPID_PUBLIC, VAPID_PRIVATE)
}

// Motivational messages pool
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

function parseTime(timeStr: string): { h: number; m: number } {
  const [h, m] = timeStr.split(':').map(Number)
  return { h: h || 0, m: m || 0 }
}

function isWithinTimeWindow(reminder: any, now: Date): boolean {
  const { h: sh, m: sm } = parseTime(reminder.start_time || '08:00')
  const { h: eh, m: em } = parseTime(reminder.end_time || '22:00')
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  const nowMin = now.getHours() * 60 + now.getMinutes()
  return nowMin >= startMin && nowMin <= endMin
}

function isTodayEnabled(reminder: any, now: Date): boolean {
  const days = reminder.days_of_week || [0, 1, 2, 3, 4, 5, 6]
  return days.includes(now.getDay())
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

function shouldFire(reminder: any, now: Date, lastFired: Record<string, number>): { fire: boolean; key: string } {
  if (!reminder.enabled) return { fire: false, key: reminder.id }
  if (!isTodayEnabled(reminder, now)) return { fire: false, key: reminder.id }

  const mode = reminder.mode || 'recurring'

  if (mode === 'scheduled') {
    const times = reminder.scheduled_times || []
    const nowMin = now.getHours() * 60 + now.getMinutes()
    for (const t of times) {
      const { h, m } = parseTime(t)
      const schedMin = h * 60 + m
      const diff = nowMin - schedMin
      if (Math.abs(diff) <= 2) {  // ±2 minute window for cron timing
        const slotKey = `${reminder.id}__${t}`
        const last = lastFired[slotKey] || 0
        if (now.getTime() - last >= 12 * 60 * 60 * 1000) {
          return { fire: true, key: slotKey }
        }
      }
    }
    return { fire: false, key: reminder.id }
  }

  // Recurring mode
  if (!isWithinTimeWindow(reminder, now)) return { fire: false, key: reminder.id }
  const last = lastFired[reminder.id] || 0
  const interval = getIntervalMs(reminder)
  return { fire: (now.getTime() - last) >= interval, key: reminder.id }
}

export async function GET(req: NextRequest) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
  }

  try {
    const now = new Date()
    let totalSent = 0
    let totalErrors = 0

    // Get all user reminders
    const remindersSnap = await adminDb.collection('user_reminders').get()

    for (const userDoc of remindersSnap.docs) {
      const data = userDoc.data()
      const userId = data.userId
      const reminders = data.reminders || []
      const lastFired: Record<string, number> = data.lastFired || {}

      if (reminders.length === 0) continue

      // Check which reminders should fire
      const toFire: Array<{ reminder: any; key: string }> = []
      for (const reminder of reminders) {
        const result = shouldFire(reminder, now, lastFired)
        if (result.fire) {
          toFire.push({ reminder, key: result.key })
        }
      }

      if (toFire.length === 0) continue

      // Get push subscriptions for this user
      const subsSnap = await adminDb
        .collection('push_subscriptions')
        .where('userId', '==', userId)
        .get()

      if (subsSnap.empty) continue

      // Send push for each due reminder
      for (const { reminder, key } of toFire) {
        const message = getRandomMessage()
        const payload = JSON.stringify({
          title: `⏰ ${reminder.habit_title || 'HabitLab Reminder'}`,
          body: message,
          icon: '/favicon.ico',
          tag: `push-${key}-${now.getTime()}`,
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
            // If subscription expired (410 Gone), remove it
            if (err.statusCode === 410 || err.statusCode === 404) {
              await adminDb.collection('push_subscriptions').doc(subDoc.id).delete()
              console.log(`[Push] Removed expired subscription: ${subDoc.id}`)
            } else {
              console.error(`[Push] Send error:`, err.message)
            }
          }
        }

        // Update lastFired
        lastFired[key] = now.getTime()
      }

      // Save updated lastFired back to Firestore
      await adminDb.collection('user_reminders').doc(userDoc.id).update({
        lastFired,
      })
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
