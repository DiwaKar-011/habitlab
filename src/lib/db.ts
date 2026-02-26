// Database layer – replaces all mock data with real Supabase queries
import { createClient } from '@/lib/supabase-browser'
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

// ── helper ──────────────────────────────────────────────────
function supabase() {
  return createClient()
}

// ── PROFILE ─────────────────────────────────────────────────
export async function getProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return data as User
}

export async function upsertProfile(profile: Partial<User> & { id: string }) {
  const { data, error } = await supabase()
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data as User
}

export async function updateProfileXP(userId: string, xpToAdd: number) {
  // Fetch current, then update (RLS prevents .rpc for now)
  const profile = await getProfile(userId)
  if (!profile) return
  const { error } = await supabase()
    .from('profiles')
    .update({ xp_points: (profile.xp_points || 0) + xpToAdd })
    .eq('id', userId)
  if (error) throw error
}

export async function getLeaderboard(limit = 20) {
  const { data, error } = await supabase()
    .from('profiles')
    .select('id, name, avatar_url, xp_points, personality')
    .eq('is_public', true)
    .order('xp_points', { ascending: false })
    .limit(limit)
  if (error) return []
  return data
}

// ── HABITS ──────────────────────────────────────────────────
export async function getHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase()
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return []
  return data as Habit[]
}

export async function getHabit(habitId: string): Promise<Habit | null> {
  const { data, error } = await supabase()
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .single()
  if (error || !data) return null
  return data as Habit
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
  const { data, error } = await supabase()
    .from('habits')
    .insert(habit)
    .select()
    .single()
  if (error) throw error

  // Also create streak row
  await supabase().from('streaks').insert({
    habit_id: data.id,
    user_id: habit.user_id,
    current_streak: 0,
    longest_streak: 0,
    freeze_available: 1,
  })

  return data as Habit
}

export async function deleteHabit(habitId: string) {
  const { error } = await supabase().from('habits').delete().eq('id', habitId)
  if (error) throw error
}

// ── DAILY LOGS ──────────────────────────────────────────────
export async function getLogsForHabit(habitId: string): Promise<DailyLog[]> {
  const { data, error } = await supabase()
    .from('daily_logs')
    .select('*')
    .eq('habit_id', habitId)
    .order('log_date', { ascending: true })
  if (error) return []
  return data as DailyLog[]
}

export async function getAllLogs(userId: string): Promise<DailyLog[]> {
  const { data, error } = await supabase()
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: true })
  if (error) return []
  return data as DailyLog[]
}

export async function getTodayLogs(userId: string): Promise<DailyLog[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase()
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', today)
  if (error) return []
  return data as DailyLog[]
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
  const { data, error } = await supabase()
    .from('daily_logs')
    .upsert(log, { onConflict: 'habit_id,log_date' })
    .select()
    .single()
  if (error) throw error

  // Update streak
  await recalculateStreak(log.habit_id, log.user_id)

  // Award XP: +10 for completion, +2 for logging a miss
  const xp = log.completed ? 10 : 2
  await updateProfileXP(log.user_id, xp)

  return data as DailyLog
}

// ── STREAKS ─────────────────────────────────────────────────
export async function getStreak(habitId: string): Promise<Streak | null> {
  const { data, error } = await supabase()
    .from('streaks')
    .select('*')
    .eq('habit_id', habitId)
    .single()
  if (error || !data) return null
  return data as Streak
}

export async function getAllStreaks(userId: string): Promise<Streak[]> {
  const { data, error } = await supabase()
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
  if (error) return []
  return data as Streak[]
}

async function recalculateStreak(habitId: string, userId: string) {
  // Get all completed logs sorted descending
  const { data: logs } = await supabase()
    .from('daily_logs')
    .select('log_date, completed')
    .eq('habit_id', habitId)
    .order('log_date', { ascending: false })

  if (!logs || logs.length === 0) return

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
      // Today not logged yet is OK, skip
      // But if logged and not completed, break
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

  await supabase()
    .from('streaks')
    .upsert(
      {
        habit_id: habitId,
        user_id: userId,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_completed: lastCompleted,
        freeze_available: existing?.freeze_available ?? 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'habit_id' }
    )
}

// ── BADGES ──────────────────────────────────────────────────
export async function getAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase()
    .from('badges')
    .select('*')
  if (error) return []
  return data as Badge[]
}

export async function getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
  const { data, error } = await supabase()
    .from('user_badges')
    .select('*, badge:badges(*)')
    .eq('user_id', userId)
  if (error) return []
  return data as (UserBadge & { badge: Badge })[]
}

export async function awardBadge(userId: string, badgeId: string) {
  const { error } = await supabase()
    .from('user_badges')
    .upsert({ user_id: userId, badge_id: badgeId }, { onConflict: 'user_id,badge_id' })
  if (error) throw error
}

// ── VIDEOS ──────────────────────────────────────────────────
export async function addVideo(video: {
  youtube_id: string
  title: string
  summary?: string
  habit_category?: string
  added_by?: string
}) {
  const { data, error } = await supabase()
    .from('videos')
    .insert(video)
    .select()
    .single()
  if (error) throw error
  return data as Video
}

export async function getVideos(): Promise<Video[]> {
  const { data, error } = await supabase()
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data as Video[]
}

export async function getVideoWatchLogs(userId: string): Promise<VideoWatchLog[]> {
  const { data, error } = await supabase()
    .from('video_watch_logs')
    .select('*')
    .eq('user_id', userId)
  if (error) return []
  return data as VideoWatchLog[]
}

export async function logVideoWatch(userId: string, videoId: string, quizPassed: boolean) {
  const { error } = await supabase()
    .from('video_watch_logs')
    .insert({ user_id: userId, video_id: videoId, quiz_passed: quizPassed })
  if (error) throw error
  if (quizPassed) {
    await updateProfileXP(userId, 15)
    // Also bump knowledge score
    const profile = await getProfile(userId)
    if (profile) {
      await supabase()
        .from('profiles')
        .update({ knowledge_score: (profile.knowledge_score || 0) + 5 })
        .eq('id', userId)
    }
  }
}

// ── CHALLENGES ──────────────────────────────────────────────
export async function getChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase()
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data as Challenge[]
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
  const { data, error } = await supabase()
    .from('challenges')
    .insert({ ...challenge, end_date: end.toISOString().split('T')[0] })
    .select()
    .single()
  if (error) throw error
  return data as Challenge
}

export async function getParticipants(challengeId: string): Promise<ChallengeParticipant[]> {
  const { data, error } = await supabase()
    .from('challenge_participants')
    .select('*')
    .eq('challenge_id', challengeId)
  if (error) return []
  return data as ChallengeParticipant[]
}

export async function getMyParticipations(userId: string): Promise<ChallengeParticipant[]> {
  const { data, error } = await supabase()
    .from('challenge_participants')
    .select('*')
    .eq('user_id', userId)
  if (error) return []
  return data as ChallengeParticipant[]
}

export async function joinChallenge(challengeId: string, userId: string) {
  const { data, error } = await supabase()
    .from('challenge_participants')
    .insert({ challenge_id: challengeId, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data as ChallengeParticipant
}

export async function leaveChallenge(challengeId: string, userId: string) {
  const { error } = await supabase()
    .from('challenge_participants')
    .delete()
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function checkInChallenge(challengeId: string, userId: string) {
  const today = new Date().toISOString().split('T')[0]
  // Get current participation
  const { data: existing } = await supabase()
    .from('challenge_participants')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .single()
  if (!existing) throw new Error('Not joined')
  if (existing.last_check_in === today) return existing as ChallengeParticipant // already checked in
  const { data, error } = await supabase()
    .from('challenge_participants')
    .update({ completed_days: (existing.completed_days || 0) + 1, last_check_in: today })
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  // Award XP
  await updateProfileXP(userId, 10)
  return data as ChallengeParticipant
}

export async function getParticipantCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase()
    .from('challenge_participants')
    .select('challenge_id')
  if (error || !data) return {}
  const counts: Record<string, number> = {}
  data.forEach((row: any) => {
    counts[row.challenge_id] = (counts[row.challenge_id] || 0) + 1
  })
  return counts
}
