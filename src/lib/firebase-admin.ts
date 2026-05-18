// Firebase Admin SDK for server-side operations
// IMPORTANT: Lazy initialization prevents build-time crashes when env vars are missing.
// On Vercel, env vars are set before build, so this initializes correctly.
// Locally, we guard against missing vars.

let _adminDb: any = null
let _adminAuth: any = null

function initFirebaseAdmin() {
  if (_adminDb) return

  const { initializeApp, getApps } = require('firebase-admin/app')
  const { getFirestore } = require('firebase-admin/firestore')
  const { getAuth } = require('firebase-admin/auth')

  if (!getApps().length) {
    const { cert } = require('firebase-admin/app')
    const projectId = process.env.FIREBASE_PROJECT_ID
    if (projectId) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
      })
    }
  }

  _adminDb = getFirestore()
  _adminAuth = getAuth()
}

export const adminDb = new Proxy({} as any, {
  get(_target, prop) {
    initFirebaseAdmin()
    return (_adminDb as any)[prop]
  },
})

export const adminAuth = new Proxy({} as any, {
  get(_target, prop) {
    initFirebaseAdmin()
    return (_adminAuth as any)[prop]
  },
})