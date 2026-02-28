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

// ── USERNAME UNIQUENESS ─────────────────────────────────────
export async function isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean> {
  const normalised = username.toLowerCase().trim()
  const q = query(
    collection(db, 'profiles'),
    where('username', '==', normalised),
    firestoreLimit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return false
  // If the only match is the user themselves, it's not "taken"
  if (excludeUserId && snap.docs.length === 1 && snap.docs[0].id === excludeUserId) return false
  return true
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const normalised = username.toLowerCase().trim()
  if (!normalised) return null

  // Primary: exact match query
  const q = query(
    collection(db, 'profiles'),
    where('username', '==', normalised),
    firestoreLimit(1)
  )
  const snap = await getDocs(q)
  if (!snap.empty) return docToObj<User>(snap.docs[0])

  // Fallback: scan all profiles for case-insensitive match
  // (handles older accounts where username was stored with mixed case)
  const allSnap = await getDocs(collection(db, 'profiles'))
  for (const d of allSnap.docs) {
    const data = d.data()
    if (data.username && data.username.toLowerCase().trim() === normalised) {
      return { id: d.id, ...data } as User
    }
  }

  return null
}

export async function updateProfileXP(userId: string, xpToAdd: number) {
  const profile = await getProfile(userId)
  if (!profile) return
  await updateDoc(doc(db, 'profiles', userId), {
    xp_points: (profile.xp_points || 0) + xpToAdd,
  })
}

export async function getLeaderboard(limitNum = 50) {
  try {
    // Try ordered query with is_public filter first
    const q = query(
      collection(db, 'profiles'),
      where('is_public', '==', true),
      orderBy('xp_points', 'desc'),
      firestoreLimit(limitNum)
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err: any) {
    // Fallback: get all profiles without composite index requirement
    if (err?.message?.includes('index') || err?.code === 'failed-precondition') {
      console.warn('Leaderboard index missing, falling back')
      const snap = await getDocs(collection(db, 'profiles'))
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any))
      return all
        .sort((a: any, b: any) => (b.xp_points || 0) - (a.xp_points || 0))
        .slice(0, limitNum)
    }
    throw err
  }
}

export async function getTotalUserCount(): Promise<number> {
  const snap = await getDocs(collection(db, 'profiles'))
  return snap.size
}

export async function getUserRank(userId: string): Promise<number> {
  const snap = await getDocs(collection(db, 'profiles'))
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any))
    .sort((a: any, b: any) => (b.xp_points || 0) - (a.xp_points || 0))
  const index = all.findIndex((u: any) => u.id === userId)
  return index >= 0 ? index + 1 : all.length + 1
}

// ── HABITS ──────────────────────────────────────────────────
export async function getHabits(userId: string): Promise<Habit[]> {
  try {
    const q = query(
      collection(db, 'habits'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => docToObj<Habit>(d))
  } catch (err: any) {
    // If composite index is missing, fall back to simpler query
    if (err?.message?.includes('index') || err?.code === 'failed-precondition') {
      console.warn('Composite index missing for habits, falling back to unordered query')
      const q = query(collection(db, 'habits'), where('user_id', '==', userId))
      const snap = await getDocs(q)
      const habits = snap.docs.map((d) => docToObj<Habit>(d))
      return habits.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    }
    throw err
  }
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
  // Strip undefined values – Firestore rejects them
  const raw: Record<string, any> = { ...habit, is_active: true, created_at: now }
  const habitData = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined))
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
  try {
    const q = query(
      collection(db, 'daily_logs'),
      where('habit_id', '==', habitId),
      orderBy('log_date', 'asc')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => docToObj<DailyLog>(d))
  } catch (err: any) {
    if (err?.message?.includes('index') || err?.code === 'failed-precondition') {
      const q = query(collection(db, 'daily_logs'), where('habit_id', '==', habitId))
      const snap = await getDocs(q)
      const logs = snap.docs.map((d) => docToObj<DailyLog>(d))
      return logs.sort((a, b) => (a.log_date || '').localeCompare(b.log_date || ''))
    }
    throw err
  }
}

export async function getAllLogs(userId: string): Promise<DailyLog[]> {
  try {
    const q = query(
      collection(db, 'daily_logs'),
      where('user_id', '==', userId),
      orderBy('log_date', 'asc')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => docToObj<DailyLog>(d))
  } catch (err: any) {
    if (err?.message?.includes('index') || err?.code === 'failed-precondition') {
      console.warn('Composite index missing for daily_logs, falling back to unordered query')
      const q = query(collection(db, 'daily_logs'), where('user_id', '==', userId))
      const snap = await getDocs(q)
      const logs = snap.docs.map((d) => docToObj<DailyLog>(d))
      return logs.sort((a, b) => (a.log_date || '').localeCompare(b.log_date || ''))
    }
    throw err
  }
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
  // Strip undefined values – Firestore rejects them
  const raw: Record<string, any> = { ...log, created_at: new Date().toISOString() }
  const logData = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined))
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

export async function recalculateStreak(habitId: string, userId: string) {
  // Get all logs for this habit
  let logs: any[]
  try {
    const q = query(
      collection(db, 'daily_logs'),
      where('habit_id', '==', habitId),
      orderBy('log_date', 'desc')
    )
    const snap = await getDocs(q)
    logs = snap.docs.map((d) => d.data())
  } catch (err: any) {
    // Fallback if composite index is missing
    if (err?.message?.includes('index') || err?.code === 'failed-precondition') {
      console.warn('Index missing for recalculateStreak, falling back')
      const q = query(collection(db, 'daily_logs'), where('habit_id', '==', habitId))
      const snap = await getDocs(q)
      logs = snap.docs.map((d) => d.data()).sort((a, b) => (b.log_date || '').localeCompare(a.log_date || ''))
    } else {
      throw err
    }
  }

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

// ── FRIENDS ─────────────────────────────────────────────────
export async function sendFriendRequest(fromUserId: string, toUserId: string) {
  const compositeId = [fromUserId, toUserId].sort().join('_')
  await setDoc(doc(db, 'friend_requests', compositeId), {
    from_user_id: fromUserId,
    to_user_id: toUserId,
    status: 'pending',
    created_at: new Date().toISOString(),
  })
}

export async function getFriendRequests(userId: string) {
  const q = query(
    collection(db, 'friend_requests'),
    where('to_user_id', '==', userId),
    where('status', '==', 'pending')
  )
  const snap = await getDocs(q)
  const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  // Populate sender profiles
  const populated = []
  for (const req of requests) {
    const profile = await getProfile((req as any).from_user_id)
    populated.push({ ...req, from_profile: profile })
  }
  return populated
}

export async function acceptFriendRequest(fromUserId: string, toUserId: string) {
  const compositeId = [fromUserId, toUserId].sort().join('_')
  await updateDoc(doc(db, 'friend_requests', compositeId), { status: 'accepted' })
  // Create bidirectional friendship
  const now = new Date().toISOString()
  await setDoc(doc(db, 'friends', `${fromUserId}_${toUserId}`), {
    user_id: fromUserId,
    friend_id: toUserId,
    created_at: now,
  })
  await setDoc(doc(db, 'friends', `${toUserId}_${fromUserId}`), {
    user_id: toUserId,
    friend_id: fromUserId,
    created_at: now,
  })
}

export async function rejectFriendRequest(fromUserId: string, toUserId: string) {
  const compositeId = [fromUserId, toUserId].sort().join('_')
  await updateDoc(doc(db, 'friend_requests', compositeId), { status: 'rejected' })
}

export async function removeFriend(userId: string, friendId: string) {
  await deleteDoc(doc(db, 'friends', `${userId}_${friendId}`))
  await deleteDoc(doc(db, 'friends', `${friendId}_${userId}`))
  const compositeId = [userId, friendId].sort().join('_')
  await deleteDoc(doc(db, 'friend_requests', compositeId))
}

export async function getFriends(userId: string): Promise<any[]> {
  const q = query(collection(db, 'friends'), where('user_id', '==', userId))
  const snap = await getDocs(q)
  const friendships = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  // Populate friend profiles
  const populated = []
  for (const f of friendships) {
    const profile = await getProfile((f as any).friend_id)
    if (profile) populated.push({ ...f, friend_profile: profile })
  }
  return populated
}

export async function getFriendStats(friendId: string) {
  const [profile, habits, logs, streaks, badges] = await Promise.all([
    getProfile(friendId),
    getHabits(friendId),
    getAllLogs(friendId),
    getAllStreaks(friendId),
    getUserBadges(friendId),
  ])
  return { profile, habits, logs, streaks, badges }
}

export async function searchUsers(searchTerm: string, currentUserId: string): Promise<User[]> {
  const term = searchTerm.toLowerCase().trim()
  if (!term) return []
  const results: User[] = []
  const seenIds = new Set<string>()
  const searchTermClean = term.startsWith('@') ? term.slice(1) : term

  try {
    // 1) Exact username lookup
    const exactMatch = await getUserByUsername(searchTermClean)
    if (exactMatch && exactMatch.id !== currentUserId) {
      results.push(exactMatch)
      seenIds.add(exactMatch.id)
    }
  } catch (err) {
    console.warn('Exact username lookup failed:', err)
  }

  try {
    // 2) Full scan of all profiles — match by username, name, or email
    const allSnap = await getDocs(collection(db, 'profiles'))
    for (const d of allSnap.docs) {
      const raw = d.data()
      const u = { id: d.id, ...raw } as User
      if (u.id === currentUserId || seenIds.has(u.id)) continue

      const uName = (u.name || '').toLowerCase()
      const uUsername = (u.username || '').toLowerCase()
      const uEmail = (u.email || '').toLowerCase()
      // Also check any extra display name fields
      const uDisplayName = ((raw as any).display_name || (raw as any).displayName || '').toLowerCase()

      if (
        uUsername.includes(searchTermClean) ||
        uName.includes(term) ||
        uDisplayName.includes(term) ||
        uEmail.includes(term)
      ) {
        results.push(u)
        seenIds.add(u.id)
      }
    }
  } catch (err) {
    console.warn('Profile scan failed, trying name query:', err)
    // 3) Fallback: try a targeted Firestore query by name
    try {
      const nameSnap = await getDocs(
        query(collection(db, 'profiles'), firestoreLimit(200))
      )
      for (const d of nameSnap.docs) {
        const raw = d.data()
        const u = { id: d.id, ...raw } as User
        if (u.id === currentUserId || seenIds.has(u.id)) continue
        const uName = (u.name || '').toLowerCase()
        const uUsername = (u.username || '').toLowerCase()
        if (uUsername.includes(searchTermClean) || uName.includes(term)) {
          results.push(u)
          seenIds.add(u.id)
        }
      }
    } catch (err2) {
      console.error('All search methods failed:', err2)
    }
  }

  return results
}

// ── PROFILE PIC ─────────────────────────────────────────────
export async function updateProfilePic(userId: string, avatarUrl: string) {
  await updateDoc(doc(db, 'profiles', userId), { avatar_url: avatarUrl })
}

// ── STREAK MILESTONES ───────────────────────────────────────
export async function getStreakMilestones(userId: string): Promise<Record<string, number[]>> {
  const snap = await getDoc(doc(db, 'streak_milestones', userId))
  if (!snap.exists()) return {}
  return snap.data() as Record<string, number[]>
}

export async function celebrateStreakMilestone(userId: string, habitId: string, milestone: number) {
  const existing = await getStreakMilestones(userId)
  const habitMilestones = existing[habitId] || []
  if (!habitMilestones.includes(milestone)) {
    habitMilestones.push(milestone)
    await setDoc(doc(db, 'streak_milestones', userId), {
      ...existing,
      [habitId]: habitMilestones,
    }, { merge: true })
  }
}

// ── SEED BADGES (expanded) ──────────────────────────────────
const BADGE_DEFINITIONS = [
  // Streak badges
  { id: 'streak_7', name: 'Flame Initiate', description: 'Survive a 7-day streak', icon_url: '🔥', condition: 'streak_7', category: 'streak', tier: 1 },
  { id: 'streak_14', name: 'Blaze Runner', description: 'Forge a 14-day streak', icon_url: '🔥🔥', condition: 'streak_14', category: 'streak', tier: 2 },
  { id: 'streak_30', name: 'Inferno Warden', description: 'Conquer a 30-day streak', icon_url: '🏆', condition: 'streak_30', category: 'streak', tier: 3 },
  { id: 'streak_50', name: 'Phoenix Ascendant', description: 'Blaze through 50 days', icon_url: '⚡', condition: 'streak_50', category: 'streak', tier: 4 },
  { id: 'streak_100', name: 'Eternal Flame Lord', description: 'Legendary 100-day streak', icon_url: '👑', condition: 'streak_100', category: 'streak', tier: 5 },
  // Fitness badges
  { id: 'fitness_10', name: 'Iron Recruit', description: 'Complete 10 fitness quests', icon_url: '💪', condition: 'fitness_10', category: 'fitness', tier: 1 },
  { id: 'fitness_50', name: 'Steel Gladiator', description: 'Complete 50 fitness quests', icon_url: '🏋️', condition: 'fitness_50', category: 'fitness', tier: 2 },
  { id: 'fitness_100', name: 'Titan of Strength', description: 'Complete 100 fitness quests', icon_url: '🥇', condition: 'fitness_100', category: 'fitness', tier: 3 },
  // Study badges
  { id: 'study_10', name: 'Scroll Seeker', description: 'Complete 10 study quests', icon_url: '📖', condition: 'study_10', category: 'study', tier: 1 },
  { id: 'study_50', name: 'Lore Keeper', description: 'Complete 50 study quests', icon_url: '📚', condition: 'study_50', category: 'study', tier: 2 },
  { id: 'study_100', name: 'Arcane Scholar', description: 'Complete 100 study quests', icon_url: '🎓', condition: 'study_100', category: 'study', tier: 3 },
  // Mindset badges
  { id: 'mindset_10', name: 'Mind Spark', description: 'Complete 10 mindset quests', icon_url: '🧠', condition: 'mindset_10', category: 'mindset', tier: 1 },
  { id: 'mindset_50', name: 'Zen Overlord', description: 'Complete 50 mindset quests', icon_url: '🧘', condition: 'mindset_50', category: 'mindset', tier: 2 },
  // Eco badges
  { id: 'eco_10', name: 'Sapling Guardian', description: 'Complete 10 eco quests', icon_url: '🌱', condition: 'eco_10', category: 'eco', tier: 1 },
  { id: 'eco_50', name: 'Earth Sentinel', description: 'Complete 50 eco quests', icon_url: '🌍', condition: 'eco_50', category: 'eco', tier: 2 },
  // Health badges
  { id: 'health_10', name: 'Vitality Spark', description: 'Complete 10 health quests', icon_url: '❤️', condition: 'health_10', category: 'health', tier: 1 },
  { id: 'health_50', name: 'Heart Guardian', description: 'Complete 50 health quests', icon_url: '💖', condition: 'health_50', category: 'health', tier: 2 },
  // Focus badges
  { id: 'focus_10', name: 'Sharpshooter', description: 'Complete 10 focus quests', icon_url: '🎯', condition: 'focus_10', category: 'focus', tier: 1 },
  { id: 'focus_50', name: 'Laser Mind', description: 'Complete 50 focus quests', icon_url: '🔬', condition: 'focus_50', category: 'focus', tier: 2 },
  // Special badges
  { id: 'consistency_90', name: 'Clockwork Phantom', description: '90%+ weekly completion', icon_url: '⏱️', condition: 'consistency_90', category: 'special', tier: 3 },
  { id: 'experiment_complete', name: 'Lab Pioneer', description: 'Complete your first experiment', icon_url: '🧪', condition: 'experiment_complete', category: 'special', tier: 1 },
  // Learning badges
  { id: 'videos_5', name: 'Curious Wanderer', description: 'Watch 5 videos', icon_url: '📺', condition: 'videos_5', category: 'learning', tier: 1 },
  { id: 'videos_10', name: 'Knowledge Sage', description: 'Watch 10 videos', icon_url: '📚', condition: 'videos_10', category: 'learning', tier: 2 },
  // Social badges
  { id: 'friend_1', name: 'Alliance Forged', description: 'Add your first friend', icon_url: '🤝', condition: 'friend_1', category: 'social', tier: 1 },
  { id: 'friend_5', name: 'Guild Commander', description: 'Have 5 friends', icon_url: '👥', condition: 'friend_5', category: 'social', tier: 2 },
  // XP badges
  { id: 'xp_500', name: 'XP Scavenger', description: 'Earn 500 XP', icon_url: '⚡', condition: 'xp_500', category: 'xp', tier: 1 },
  { id: 'xp_1000', name: 'XP Warlord', description: 'Earn 1000 XP', icon_url: '💫', condition: 'xp_1000', category: 'xp', tier: 2 },
  { id: 'xp_5000', name: 'XP Demi-God', description: 'Earn 5000 XP', icon_url: '🌟', condition: 'xp_5000', category: 'xp', tier: 3 },
  // First log badge
  { id: 'first_log', name: 'Genesis Strike', description: 'Log your very first day', icon_url: '✨', condition: 'first_log', category: 'special', tier: 1 },
  // Multi-habit badge
  { id: 'multi_habit_3', name: 'Multi-Tasker', description: 'Run 3 active habits', icon_url: '🎪', condition: 'multi_habit_3', category: 'special', tier: 2 },
]

export async function seedBadges() {
  for (const b of BADGE_DEFINITIONS) {
    await setDoc(doc(db, 'badges', b.id), b, { merge: true })
  }
}

export async function checkAndAwardBadges(userId: string) {
  // Auto-seed badges if they don't exist yet
  const allBadgesSnap = await getDocs(collection(db, 'badges'))
  if (allBadgesSnap.size < BADGE_DEFINITIONS.length) {
    await seedBadges()
  }

  const [profile, habits, logs, streaks, friends, watchLogs] = await Promise.all([
    getProfile(userId),
    getHabits(userId),
    getAllLogs(userId),
    getAllStreaks(userId),
    getFriends(userId),
    getVideoWatchLogs(userId),
  ])
  if (!profile) return []

  const existingBadges = await getUserBadges(userId)
  const existingIds = existingBadges.map((b) => b.badge_id)
  const newlyAwarded: string[] = []

  const maxStreak = Math.max(...streaks.map((s) => s.current_streak), 0)
  const completedLogs = logs.filter((l) => l.completed)
  const xp = profile.xp_points || 0
  const activeHabits = habits.filter((h) => h.is_active).length

  // Category completion counts
  const catCounts: Record<string, number> = {}
  for (const log of completedLogs) {
    const habit = habits.find((h) => h.id === log.habit_id)
    if (habit) {
      catCounts[habit.category] = (catCounts[habit.category] || 0) + 1
    }
  }

  // Weekly consistency
  const last7 = logs.filter((l) => {
    const d = new Date(l.log_date)
    const now = new Date()
    return (now.getTime() - d.getTime()) / 86400000 <= 7
  })
  const weeklyConsistency = last7.length > 0 ? (last7.filter((l) => l.completed).length / last7.length) * 100 : 0

  const checks: [string, boolean][] = [
    ['streak_7', maxStreak >= 7],
    ['streak_14', maxStreak >= 14],
    ['streak_30', maxStreak >= 30],
    ['streak_50', maxStreak >= 50],
    ['streak_100', maxStreak >= 100],
    ['fitness_10', (catCounts['fitness'] || 0) >= 10],
    ['fitness_50', (catCounts['fitness'] || 0) >= 50],
    ['fitness_100', (catCounts['fitness'] || 0) >= 100],
    ['study_10', (catCounts['study'] || 0) >= 10],
    ['study_50', (catCounts['study'] || 0) >= 50],
    ['study_100', (catCounts['study'] || 0) >= 100],
    ['mindset_10', (catCounts['mindset'] || 0) >= 10],
    ['mindset_50', (catCounts['mindset'] || 0) >= 50],
    ['eco_10', (catCounts['eco'] || 0) >= 10],
    ['eco_50', (catCounts['eco'] || 0) >= 50],
    ['health_10', (catCounts['health'] || 0) >= 10],
    ['health_50', (catCounts['health'] || 0) >= 50],
    ['focus_10', (catCounts['focus'] || 0) >= 10],
    ['focus_50', (catCounts['focus'] || 0) >= 50],
    ['consistency_90', weeklyConsistency >= 90],
    ['experiment_complete', habits.some((h) => logs.filter((l) => l.habit_id === h.id && l.completed).length >= h.target_days)],
    ['videos_5', watchLogs.length >= 5],
    ['videos_10', watchLogs.length >= 10],
    ['friend_1', friends.length >= 1],
    ['friend_5', friends.length >= 5],
    ['xp_500', xp >= 500],
    ['xp_1000', xp >= 1000],
    ['xp_5000', xp >= 5000],
    ['first_log', logs.length >= 1],
    ['multi_habit_3', activeHabits >= 3],
  ]

  for (const [badgeId, earned] of checks) {
    if (earned && !existingIds.includes(badgeId)) {
      await awardBadge(userId, badgeId)
      newlyAwarded.push(badgeId)
    }
  }

  return newlyAwarded
}

// ── Delete Account ──

async function deleteCollectionDocs(collectionName: string, fieldName: string, userId: string) {
  const q = query(collection(db, collectionName), where(fieldName, '==', userId))
  const snap = await getDocs(q)
  const deletePromises = snap.docs.map((d) => deleteDoc(doc(db, collectionName, d.id)))
  await Promise.all(deletePromises)
}

export async function deleteUserAccount(userId: string) {
  // Delete all user data from every collection
  await Promise.all([
    deleteCollectionDocs('habits', 'user_id', userId),
    deleteCollectionDocs('daily_logs', 'user_id', userId),
    deleteCollectionDocs('streaks', 'user_id', userId),
    deleteCollectionDocs('user_badges', 'user_id', userId),
    deleteCollectionDocs('friends', 'user_id', userId),
    deleteCollectionDocs('friend_requests', 'from_user_id', userId),
    deleteCollectionDocs('friend_requests', 'to_user_id', userId),
    deleteCollectionDocs('video_watch_logs', 'user_id', userId),
    deleteCollectionDocs('challenge_participants', 'user_id', userId),
    deleteCollectionDocs('streak_milestones', 'user_id', userId),
    deleteCollectionDocs('notifications', 'user_id', userId),
  ])

  // Also delete the reverse side of friendships
  const friendsQ = query(collection(db, 'friends'), where('friend_id', '==', userId))
  const friendsSnap = await getDocs(friendsQ)
  await Promise.all(friendsSnap.docs.map((d) => deleteDoc(doc(db, 'friends', d.id))))

  // Delete profile last
  await deleteDoc(doc(db, 'profiles', userId))
}
