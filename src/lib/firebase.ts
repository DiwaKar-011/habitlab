// Firebase client-side SDK initialization
// IMPORTANT: This module must only be imported in 'use client' components.
// Server-side code must NOT import this module, or build-time errors will occur.

const firebaseConfig = {
  apiKey: "AIzaSyD4Tz6twoJnxCfEWJ5y2adTGKl9J-B1vCU",
  authDomain: "habittracker-aa99a.firebaseapp.com",
  projectId: "habittracker-aa99a",
  storageBucket: "habittracker-aa99a.firebasestorage.app",
  messagingSenderId: "575767047413",
  appId: "1:575767047413:web:64599e23e3ce828ecd29bc",
  measurementId: "G-2LT91X58P9"
}

const hasConfig = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined'

let app: any = null
let auth: any = null
let db: any = null

if (hasConfig && typeof window !== 'undefined') {
  try {
    const { initializeApp, getApps, getApp } = require('firebase/app')
    const { getAuth } = require('firebase/auth')
    const { getFirestore } = require('firebase/firestore')

    app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
  } catch (e) {
    // Firebase initialization failed — log silently
    console.warn('[HabitLab] Firebase init error:', e)
  }
}

// Export nulls for SSR/build context — pages using these are 'use client'
// with guards like 'if (!user) return', so they won't call methods during SSG
export { app, auth, db }