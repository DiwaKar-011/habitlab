// Database layer – Firebase Firestore queries
import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
} from 'firebase/firestore'
import type {
  Habit,
  DailyLog,
  Streak,
  User,
  Badge,
  UserBadge,
  Video,
  VideoWatchLog,
  HabitCategory,
  FailureReason,
  Challenge,
  ChallengeParticipant,
} from '@/types'

// ── helper: convert Firestore doc to plain object with id ───
function docToObj<T>(snap: any): T {
  return { id: snap.id, ...snap.data() } as T
}

// ── PROFILE ─────────────────────────────────────────────────
export async function getProfile(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'profiles', userId))
  if (!snap.exists()) return null
  return docToObj<User>(snap)
}

export async function upsertProfile(profile: Partial<User> & { id: string }) {
  const ref = doc(db, 'profiles', profile.id)
  await setDoc(ref, profile, { merge: true })
  const snap = await getDoc(ref)
  return docToObj<User>(snap)
}

export async function updateProfileXP(userId: string, xpToAdd: number) {
  const profile = await getProfile(userId)
  if (!profile) return
  await updateDoc(doc(db, 'profiles', userId), {
    xp_points: (profile.xp_points || 0) + xpToAdd,
  })
}

export async function getLeaderboard(limit = 20) {
  const q = query(
    collection(db, 'profiles'),
    where('is_public', '==', true),
    orderBy('xp_points', 'desc'),
    firestoreLimit(limit)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ── HABITS ──────────────────────────────────────────────────
export async function getHabits(userId: string): Promise<Habit[]> {
  const q = query(
    collection(db, 'habits'),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => docToObj<Habit>(d))
}

export async function getHabit(habitId: string): Promise<Habit | null> {
  const snap = await getDoc(doc(db, 'habits', habitId))
  if (!snap.exists()) return null
  return docToObj<Habit>(snap)
}

export async function createHabit(habit: {
  user_id: string
  title: string
  description?: string
  category: HabitCategory
  difficulty: number
  hypothesis?: string
  independent_var?: string
  dependent_var?: string
  control_vars?: string[]
  target_days: number
}): Promise<Habit> {
  const now = new Date().toISOString()
  const habitData = { ...habit, is_active: true, created_at: now }
  const ref = await addDoc(collection(db, 'habits'), habitData)

  // Also create streak row
  await setDoc(doc(db, 'streaks', ref.id), {
    habit_id: ref.id,
    user_id: habit.user_id,
    current_streak: 0,
    longest_streak: 0,
    freeze_available: 1,
    updated_at: now,
  })

  return { id: ref.id, ...habitData } as Habit
}

export async function deleteHabit(habitId: string) {
  await deleteDoc(doc(db, 'habits', habitId))
}

// ── DAILY LOGS ──────────────────────────────────────────────
export async function getLogsForHabit(habitId: string): Promise<DailyLog[]> {
  const q = query(
    collection(db, 'daily_logs'),
    where('habit_id', '==', habitId),
    orderBy('log_date', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => docToObj<DailyLog>(d))
}

export async function getAllLogs(userId: string): Promise<DailyLog[]> {
  const q = query(
    collection(db, 'daily_logs'),
    where('user_id', '==', userId),
    orderBy('log_date', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => docToObj<DailyLog>(d))
}

export async function getTodayLogs(userId: string): Promise<DailyLog[]> {
  const today = new Date().toISOString().split('T')[0]
  const q = query(
    collection(db, 'daily_logs'),
    where('user_id', '==', userId),
    where('log_date', '==', today)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => docToObj<DailyLog>(d))
}

export async function createLog(log: {
  habit_id: string
  user_id: string
  log_date: string
  completed: boolean
  completion_time?: string
  mood_rating?: number
  energy_rating?: number
  notes?: string
  failure_reason?: string
  failure_notes?: string
}): Promise<DailyLog> {
  // Use a composite key so upsert behaviour is achieved
  const compositeId = `${log.habit_id}_${log.log_date}`
  const logData = { ...log, created_at: new Date().toISOString() }
  await setDoc(doc(db, 'daily_logs', compositeId), logData, { merge: true })

  // Update streak
  await recalculateStreak(log.habit_id, log.user_id)

  // Award XP: +10 for completion, +2 for logging a miss
  const xp = log.completed ? 10 : 2
  await updateProfileXP(log.user_id, xp)

  return { id: compositeId, ...logData } as DailyLog
}

// ── STREAKS ─────────────────────────────────────────────────
export async function getStreak(habitId: string): Promise<Streak | null> {
  const snap = await getDoc(doc(db, 'streaks', habitId))
  if (!snap.exists()) return null
  return docToObj<Streak>(snap)
}

export async function getAllStreaks(userId: string): Promise<Streak[]> {
  const q = query(collection(db, 'streaks'), where('user_id', '==', userId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => docToObj<Streak>(d))
}

async function recalculateStreak(habitId: string, userId: string) {
  // Get all logs for this habit sorted descending
  const q = query(
    collection(db, 'daily_logs'),
    where('habit_id', '==', habitId),
    orderBy('log_date', 'desc')
  )
  const snap = await getDocs(q)
  const logs = snap.docs.map((d) => d.data())

  if (logs.length === 0) return

  // Calculate current streak from today backwards
  let currentStreak = 0
  const today = new Date()
  const checkDate = new Date(today)

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0]
    const log = logs.find((l: any) => l.log_date === dateStr)

    if (log && log.completed) {
      currentStreak++
    } else if (i === 0) {
      if (log && !log.completed) break
    } else {
      break
    }
    checkDate.setDate(checkDate.getDate() - 1)
  }

  // Get existing streak to preserve longest
  const existing = await getStreak(habitId)
  const longestStreak = Math.max(currentStreak, existing?.longest_streak || 0)
  const lastCompleted = logs.find((l: any) => l.completed)?.log_date || null

  await setDoc(doc(db, 'streaks', habitId), {
    habit_id: habitId,
    user_id: userId,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_completed: lastCompleted,
    freeze_available: existing?.freeze_available ?? 1,
    updated_at: new Date().toISOString(),
  }, { merge: true })
}

// ── BADGES ──────────────────────────────────────────────────
export async function getAllBadges(): Promise<Badge[]> {
  const snap = await getDocs(collection(db, 'badges'))
  return snap.docs.map((d) => docToObj<Badge>(d))
}

export async function getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
  const q = query(collection(db, 'user_badges'), where('user_id', '==', userId))
  const snap = await getDocs(q)
  const userBadges = snap.docs.map((d) => docToObj<UserBadge>(d))

  // Fetch each badge detail
  const results: (UserBadge & { badge: Badge })[] = []
  for (const ub of userBadges) {
    if (ub.badge_id) {
      const badgeSnap = await getDoc(doc(db, 'badges', ub.badge_id))
      if (badgeSnap.exists()) {
        results.push({ ...ub, badge: docToObj<Badge>(badgeSnap) })
      }
    }
  }
  return results
}

export async function awardBadge(userId: string, badgeId: string) {
  const compositeId = `${userId}_${badgeId}`
  await setDoc(doc(db, 'user_badges', compositeId), {
    user_id: userId,
    badge_id: badgeId,
    earned_at: new Date().toISOString(),
  }, { merge: true })
}

// ── VIDEOS ──────────────────────────────────────────────────
export async function addVideo(video: {
  youtube_id: string
  title: string
  summary?: string
  habit_category?: string
  added_by?: string
}) {
  const videoData = { ...video, trigger_type: 'manual', created_at: new Date().toISOString() }
  const ref = await addDoc(collection(db, 'videos'), videoData)
  return { id: ref.id, ...videoData } as Video
}

export async function getVideos(): Promise<Video[]> {
  const q = query(collection(db, 'videos'), orderBy('created_at', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => docToObj<Video>(d))
}

export async function getVideoWatchLogs(userId: string): Promise<VideoWatchLog[]> {
  const q = query(collection(db, 'video_watch_logs'), where('user_id', '==', userId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => docToObj<VideoWatchLog>(d))
}

export async function logVideoWatch(userId: string, videoId: string, quizPassed: boolean) {
  await addDoc(collection(db, 'video_watch_logs'), {
    user_id: userId,
    video_id: videoId,
    quiz_passed: quizPassed,
    watched_at: new Date().toISOString(),
  })
  if (quizPassed) {
    await updateProfileXP(userId, 15)
    const profile = await getProfile(userId)
    if (profile) {
      await updateDoc(doc(db, 'profiles', userId), {
        knowledge_score: (profile.knowledge_score || 0) + 5,
      })
    }
  }
}

// ── CHALLENGES ──────────────────────────────────────────────
export async function getChallenges(): Promise<Challenge[]> {
  const q = query(collection(db, 'challenges'), orderBy('created_at', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => docToObj<Challenge>(d))
}

export async function createChallenge(challenge: {
  title: string
  description?: string
  creator_id: string
  category?: string
  duration_days: number
  is_public?: boolean
  is_ai_generated?: boolean
  start_date?: string
}) {
  const end = new Date(challenge.start_date || new Date())
  end.setDate(end.getDate() + challenge.duration_days)
  const challengeData = {
    ...challenge,
    end_date: end.toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  }
  const ref = await addDoc(collection(db, 'challenges'), challengeData)
  return { id: ref.id, ...challengeData } as Challenge
}

export async function getParticipants(challengeId: string): Promise<ChallengeParticipant[]> {
  const q = query(
    collection(db, 'challenge_participants'),
    where('challenge_id', '==', challengeId)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => docToObj<ChallengeParticipant>(d))
}

export async function getMyParticipations(userId: string): Promise<ChallengeParticipant[]> {
  const q = query(
    collection(db, 'challenge_participants'),
    where('user_id', '==', userId)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => docToObj<ChallengeParticipant>(d))
}

export async function joinChallenge(challengeId: string, userId: string) {
  const compositeId = `${challengeId}_${userId}`
  const data = {
    challenge_id: challengeId,
    user_id: userId,
    joined_at: new Date().toISOString(),
    completed_days: 0,
  }
  await setDoc(doc(db, 'challenge_participants', compositeId), data)
  return { id: compositeId, ...data } as ChallengeParticipant
}

export async function leaveChallenge(challengeId: string, userId: string) {
  const compositeId = `${challengeId}_${userId}`
  await deleteDoc(doc(db, 'challenge_participants', compositeId))
}

export async function checkInChallenge(challengeId: string, userId: string) {
  const today = new Date().toISOString().split('T')[0]
  const compositeId = `${challengeId}_${userId}`
  const snap = await getDoc(doc(db, 'challenge_participants', compositeId))
  if (!snap.exists()) throw new Error('Not joined')
  const existing = snap.data() as ChallengeParticipant
  if (existing.last_check_in === today) return { ...existing, id: compositeId } as ChallengeParticipant

  const updated = {
    completed_days: (existing.completed_days || 0) + 1,
    last_check_in: today,
  }
  await updateDoc(doc(db, 'challenge_participants', compositeId), updated)
  await updateProfileXP(userId, 10)
  return { ...existing, ...updated, id: compositeId } as ChallengeParticipant
}

export async function getParticipantCounts(): Promise<Record<string, number>> {
  const snap = await getDocs(collection(db, 'challenge_participants'))
  const counts: Record<string, number> = {}
  snap.docs.forEach((d) => {
    const data = d.data()
    counts[data.challenge_id] = (counts[data.challenge_id] || 0) + 1
  })
  return counts
}
