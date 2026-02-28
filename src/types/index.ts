// Types for HabitLab

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  personality?: string
  xp_points: number
  knowledge_score: number
  is_admin: boolean
  is_public: boolean
  created_at: string
}

export interface Habit {
  id: string
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
  is_active: boolean
  created_at: string
}

export type HabitCategory = 'fitness' | 'study' | 'focus' | 'eco' | 'health' | 'mindset'

export interface DailyLog {
  id: string
  habit_id: string
  user_id: string
  log_date: string
  completed: boolean
  completion_time?: string
  mood_rating?: number
  energy_rating?: number
  notes?: string
  failure_reason?: FailureReason
  failure_notes?: string
  created_at: string
}

export type FailureReason = 'tired' | 'busy' | 'forgot' | 'low_motivation' | 'other'

export interface Streak {
  id: string
  habit_id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_completed?: string
  freeze_available: number
  updated_at: string
}

export interface ExperimentResult {
  id: string
  habit_id: string
  user_id: string
  summary?: string
  conclusion?: string
  avg_mood?: number
  avg_energy?: number
  completion_rate?: number
  total_days?: number
  generated_at: string
}

export interface Video {
  id: string
  youtube_id: string
  title: string
  summary?: string
  habit_category?: string
  trigger_type: string
  added_by?: string
  created_at: string
}

export interface VideoWatchLog {
  id: string
  user_id: string
  video_id: string
  watched_at: string
  quiz_passed: boolean
}

export interface Badge {
  id: string
  name: string
  description?: string
  icon_url?: string
  condition: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  badge?: Badge
}

export interface Book {
  id: string
  title: string
  author?: string
  description?: string
  why_it_helps?: string
  category?: string
  external_link?: string
  cover_url?: string
  added_by?: string
  created_at: string
}

export interface Insight {
  type: 'info' | 'warning' | 'success'
  message: string
  severity: 'low' | 'medium' | 'high'
}

export interface ImpactMetric {
  metric: string
  perDay: number
  unit: string
}

export interface Challenge {
  id: string
  title: string
  description?: string
  creator_id: string
  category?: string
  duration_days: number
  is_public: boolean
  is_ai_generated: boolean
  start_date?: string
  end_date?: string
  created_at: string
}

export interface ChallengeParticipant {
  id: string
  challenge_id: string
  user_id: string
  joined_at: string
  completed_days: number
  last_check_in?: string
}

// Friend system
export interface FriendRequest {
  id: string
  from_user_id: string
  to_user_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export interface Friend {
  id: string
  user_id: string
  friend_id: string
  created_at: string
  // populated
  friend_profile?: User
}

// Streak milestone
export interface StreakMilestone {
  streak: number
  celebrated: boolean
  celebrated_at?: string
}

// Notification & Reminder types
export type ReminderFrequency = 'once' | 'every_30min' | 'every_1hr' | 'every_2hr' | 'every_4hr' | 'custom'

export interface HabitReminder {
  id: string
  habit_id: string
  habit_title: string
  enabled: boolean
  frequency: ReminderFrequency
  custom_interval_min?: number   // for 'custom' frequency
  start_time: string             // HH:MM format — when reminders begin each day
  end_time: string               // HH:MM format — when they stop
  days_of_week: number[]         // 0=Sun, 1=Mon, ... 6=Sat
  created_at: string
}

export interface AppNotification {
  id: string
  type: 'reminder' | 'streak' | 'badge' | 'challenge' | 'system' | 'motivation' | 'roast' | 'friend'
  title: string
  message: string
  habit_id?: string
  read: boolean
  created_at: string
}

// Badge tiers
export interface BadgeTier {
  level: number
  name: string
  icon: string
  requirement: number
}

// Learn recommendation
export interface LearnRecommendation {
  type: 'video' | 'book' | 'audiobook'
  title: string
  url?: string
  youtube_id?: string
  author?: string
  description: string
  category: string
  thumbnail?: string
}

// Habit prediction
export interface HabitPrediction {
  days_continued: number
  benefits: string[]
  science_fact: string
}
