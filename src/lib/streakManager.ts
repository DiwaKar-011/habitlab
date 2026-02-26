import { Streak } from '@/types'
import { isYesterday } from './utils'

export function updateStreak(
  streak: Streak,
  completed: boolean
): Streak {
  const updated = { ...streak, updated_at: new Date().toISOString() }
  const today = new Date().toISOString().split('T')[0]

  if (completed) {
    if (streak.last_completed && isYesterday(streak.last_completed)) {
      updated.current_streak = streak.current_streak + 1
    } else if (streak.last_completed === today) {
      // Already logged today, no change
      return updated
    } else {
      updated.current_streak = 1
    }
    updated.last_completed = today
    if (updated.current_streak > updated.longest_streak) {
      updated.longest_streak = updated.current_streak
    }
  } else {
    if (streak.freeze_available > 0) {
      updated.freeze_available = streak.freeze_available - 1
    } else {
      updated.current_streak = 0
    }
  }

  return updated
}
