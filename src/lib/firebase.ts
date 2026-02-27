// Firebase client-side SDK initialization
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyD4Tz6twoJnxCfEWJ5y2adTGKl9J-B1vCU",
  authDomain: "habittracker-aa99a.firebaseapp.com",
  projectId: "habittracker-aa99a",
  storageBucket: "habittracker-aa99a.firebasestorage.app",
  messagingSenderId: "575767047413",
  appId: "1:575767047413:web:64599e23e3ce828ecd29bc",
  measurementId: "G-2LT91X58P9"
};
// Only initialize if we have a real API key (prevents build/SSG crash)
const hasConfig = !!firebaseConfig.apiKey

let app: FirebaseApp | undefined
let auth: Auth
let db: Firestore

if (hasConfig) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
} else {
  // During build / SSG: export placeholders – they won't be called at build time
  // because all pages using them are 'use client' with guards like `if (!user) return`
  auth = null as unknown as Auth
  db = null as unknown as Firestore
}

export { app, auth, db }
