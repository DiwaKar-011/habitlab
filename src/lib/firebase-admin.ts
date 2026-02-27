// Firebase Admin SDK for server-side operations
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function getFirebaseAdmin() {
  if (getApps().length) {
    return {
      adminAuth: getAuth(),
      adminDb: getFirestore(),
    }
  }

  // Use service account from env vars
  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // The private key comes as a JSON-escaped string in env – unescape newlines
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }

  initializeApp({
    credential: cert(serviceAccount),
  })

  return {
    adminAuth: getAuth(),
    adminDb: getFirestore(),
  }
}

export const { adminAuth, adminDb } = getFirebaseAdmin()
