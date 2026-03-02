// API route: Sync user reminders to Firestore for server-side push
// POST /api/push/sync-reminders
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const { userId, reminders } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Store all user reminders in a single Firestore document
    await adminDb.collection('user_reminders').doc(userId).set({
      userId,
      reminders: reminders || [],
      updatedAt: new Date().toISOString(),
    }, { merge: true })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Sync Reminders] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
