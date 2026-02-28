// Mock data store for HabitLab - replace with Supabase calls when ready
import { Habit, DailyLog, Streak, User, Badge, UserBadge, Video } from '@/types'

function getDaysAgoDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

export const mockUser: User = {
  id: 'user-1',
  email: 'demo@habitlab.io',
  name: 'Alex Chen',
  avatar_url: undefined,
  personality: 'The Scientist',
  xp_points: 450,
  knowledge_score: 35,
  is_admin: false,
  is_public: true,
  created_at: '2026-01-15T00:00:00Z',
}

export const mockHabits: Habit[] = [
  {
    id: 'habit-1',
    user_id: 'user-1',
    title: 'Morning Run',
    description: 'Run for 30 minutes every morning before school',
    category: 'fitness',
    difficulty: 4,
    hypothesis: 'If I run every morning, then my focus during school will improve',
    independent_var: 'Daily morning running',
    dependent_var: 'Focus level during school hours',
    control_vars: ['Sleep time', 'Diet', 'School schedule'],
    target_days: 21,
    is_active: true,
    created_at: '2026-01-20T00:00:00Z',
  },
  {
    id: 'habit-2',
    user_id: 'user-1',
    title: 'Read 30 Minutes',
    description: 'Read non-fiction for 30 minutes before bed',
    category: 'study',
    difficulty: 2,
    hypothesis: 'If I read daily, then my vocabulary test scores will increase',
    independent_var: 'Daily reading habit',
    dependent_var: 'Vocabulary test scores',
    control_vars: ['Book difficulty', 'Reading time'],
    target_days: 30,
    is_active: true,
    created_at: '2026-01-25T00:00:00Z',
  },
  {
    id: 'habit-3',
    user_id: 'user-1',
    title: 'No Single-Use Plastic',
    description: 'Avoid all single-use plastic items for the day',
    category: 'eco',
    difficulty: 3,
    hypothesis: 'If I avoid plastic daily, then I can reduce household waste by 50%',
    independent_var: 'Plastic avoidance behavior',
    dependent_var: 'Weekly waste weight',
    control_vars: ['Shopping habits', 'Meal prep'],
    target_days: 21,
    is_active: true,
    created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'habit-4',
    user_id: 'user-1',
    title: '5-Minute Meditation',
    description: 'Meditate for 5 minutes using guided breathing',
    category: 'mindset',
    difficulty: 1,
    hypothesis: 'If I meditate daily, then my stress levels will decrease',
    independent_var: 'Daily meditation practice',
    dependent_var: 'Self-reported stress levels',
    control_vars: ['Sleep quality', 'Caffeine intake'],
    target_days: 14,
    is_active: true,
    created_at: '2026-02-05T00:00:00Z',
  },
]

// Generate realistic mock logs for the past 25 days
function generateMockLogs(): DailyLog[] {
  const logs: DailyLog[] = []
  const failureReasons: Array<'tired' | 'busy' | 'forgot' | 'low_motivation'> = ['tired', 'busy', 'forgot', 'low_motivation']
  const moods = [3, 4, 5, 4, 3, 2, 4, 5, 4, 3]
  const energies = [4, 3, 5, 4, 2, 3, 4, 5, 3, 4]

  mockHabits.forEach((habit, hi) => {
    const daysToGenerate = Math.min(25, Math.floor((Date.now() - new Date(habit.created_at).getTime()) / 86400000))
    for (let d = daysToGenerate; d >= 1; d--) {
      const date = getDaysAgoDate(d)
      const dayOfWeek = new Date(date).getDay()
      // Higher miss rate on weekends for realism
      const missChance = dayOfWeek === 0 || dayOfWeek === 6 ? 0.35 : 0.15
      const completed = Math.random() > missChance

      logs.push({
        id: `log-${habit.id}-${d}`,
        habit_id: habit.id,
        user_id: 'user-1',
        log_date: date,
        completed,
        completion_time: completed ? `${8 + hi + Math.floor(Math.random() * 4)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : undefined,
        mood_rating: completed ? moods[(d + hi) % moods.length] : moods[(d + hi + 3) % moods.length] - 1,
        energy_rating: completed ? energies[(d + hi) % energies.length] : energies[(d + hi + 2) % energies.length] - 1,
        notes: completed ? undefined : undefined,
        failure_reason: completed ? undefined : failureReasons[Math.floor(Math.random() * failureReasons.length)],
        failure_notes: undefined,
        created_at: new Date(date).toISOString(),
      })
    }
  })

  return logs
}

export const mockLogs: DailyLog[] = generateMockLogs()

export const mockStreaks: Streak[] = [
  {
    id: 'streak-1', habit_id: 'habit-1', user_id: 'user-1',
    current_streak: 12, longest_streak: 12, last_completed: getDaysAgoDate(1),
    freeze_available: 1, updated_at: new Date().toISOString(),
  },
  {
    id: 'streak-2', habit_id: 'habit-2', user_id: 'user-1',
    current_streak: 8, longest_streak: 15, last_completed: getDaysAgoDate(1),
    freeze_available: 0, updated_at: new Date().toISOString(),
  },
  {
    id: 'streak-3', habit_id: 'habit-3', user_id: 'user-1',
    current_streak: 5, longest_streak: 9, last_completed: getDaysAgoDate(1),
    freeze_available: 1, updated_at: new Date().toISOString(),
  },
  {
    id: 'streak-4', habit_id: 'habit-4', user_id: 'user-1',
    current_streak: 18, longest_streak: 18, last_completed: getDaysAgoDate(1),
    freeze_available: 2, updated_at: new Date().toISOString(),
  },
]

export const mockBadges: Badge[] = [
  { id: '1', name: 'Consistency Starter', description: 'Complete a habit 7 days in a row', condition: 'streak_7', icon_url: 'S7' },
  { id: '2', name: 'Habit Champion', description: 'Maintain a 30-day streak', condition: 'streak_30', icon_url: 'S30' },
  { id: '3', name: 'Precision Performer', description: 'Achieve 90% weekly completion', condition: 'consistency_90', icon_url: '90%' },
  { id: '6', name: 'Experimenter', description: 'Complete your first experiment', condition: 'experiment_complete', icon_url: 'LAB' },
]

export const mockUserBadges: UserBadge[] = [
  { id: 'ub-1', user_id: 'user-1', badge_id: '1', earned_at: '2026-02-01T00:00:00Z', badge: mockBadges[0] },
  { id: 'ub-2', user_id: 'user-1', badge_id: '6', earned_at: '2026-02-10T00:00:00Z', badge: mockBadges[3] },
]

export const mockVideos: Video[] = [
  { id: 'v-1', youtube_id: 'Wcs2PFz5q6g', title: 'The Science of Making & Breaking Habits', summary: 'Andrew Huberman explains the neuroscience behind how habits form, how to build good ones, and how to break bad ones.', habit_category: 'mindset', trigger_type: 'default', created_at: '2026-01-01T00:00:00Z' },
  { id: 'v-2', youtube_id: 'fHBR1j1kJ1I', title: "Billionaire's Brain vs Your Brain: Morning Routine, Focus & Addiction", summary: 'Dr. Sweta breaks down morning routines, focus strategies, and addiction science that separate high performers from the rest.', habit_category: 'fitness', trigger_type: 'default', created_at: '2026-01-05T00:00:00Z' },
  { id: 'v-3', youtube_id: 'TIwBwyMgS50', title: 'Small Steps, Big Changes — The Power of Habits', summary: 'A TEDx talk by Saurabh Bothra on how small consistent habit changes lead to transformative life results.', habit_category: 'study', trigger_type: 'default', created_at: '2026-01-10T00:00:00Z' },
]

// Helper to get logs for a specific habit
export function getLogsForHabit(habitId: string): DailyLog[] {
  return mockLogs.filter((l) => l.habit_id === habitId).sort((a, b) => a.log_date.localeCompare(b.log_date))
}

// Helper to get streak for a specific habit
export function getStreakForHabit(habitId: string): Streak | undefined {
  return mockStreaks.find((s) => s.habit_id === habitId)
}
