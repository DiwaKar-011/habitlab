// API route: Save a push subscription to Firestore
// POST /api/push/subscribe
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const { userId, subscription } = await req.json()

    if (!userId || !subscription) {
      return NextResponse.json({ error: 'Missing userId or subscription' }, { status: 400 })
    }

    // Store subscription in Firestore under push_subscriptions collection
    // Key by a hash of the endpoint to avoid duplicates from same browser
    const endpointHash = Buffer.from(subscription.endpoint).toString('base64url').slice(0, 40)
    const docId = `${userId}_${endpointHash}`

    await adminDb.collection('push_subscriptions').doc(docId).set({
      userId,
      subscription,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Push Subscribe] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
