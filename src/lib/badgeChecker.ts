import { Badge, UserBadge, Streak } from '@/types'
import { getWaterLogForDate } from './waterStore'

const badgeDefinitions: Badge[] = [
  { id: '1', name: 'Consistency Starter', description: 'Complete a habit 7 days in a row', condition: 'streak_7', icon_url: '🔥' },
  { id: '2', name: 'Habit Champion', description: 'Maintain a 30-day streak', condition: 'streak_30', icon_url: '🏆' },
  { id: '3', name: 'Precision Performer', description: 'Achieve 90% weekly completion', condition: 'consistency_90', icon_url: '🎯' },
  { id: '4', name: 'Challenge Victor', description: 'Win a public challenge', condition: 'challenge_winner', icon_url: '👑' },
  { id: '5', name: 'Scholar', description: 'Watch 10 habit videos', condition: 'videos_10', icon_url: '📚' },
  { id: '6', name: 'Experimenter', description: 'Complete your first experiment', condition: 'experiment_complete', icon_url: '🧪' },
  // Water badges
  { id: 'w1', name: 'First Sip', description: 'Log your first glass of water', condition: 'water_first_glass', icon_url: '💧' },
  { id: 'w2', name: 'Hydration Hero', description: 'Drink 8+ glasses in a single day', condition: 'water_8_glasses', icon_url: '🚰' },
  { id: 'w3', name: 'Water Warrior', description: 'Hit your daily water goal for 3 days', condition: 'water_goal_3d', icon_url: '🌊' },
  { id: 'w4', name: 'Aqua Legend', description: 'Hit your daily water goal for 7 consecutive days', condition: 'water_goal_7d', icon_url: '🏊' },
  { id: 'w5', name: 'Hydration Master', description: 'Drink 50 total glasses of water', condition: 'water_50_glasses', icon_url: '💎' },
  { id: 'w6', name: 'Ocean Keeper', description: 'Drink 200 total glasses of water', condition: 'water_200_glasses', icon_url: '🐳' },
]

export function getAllBadges(): Badge[] {
  return badgeDefinitions
}

/* ── Water stats helper ──────────────────────────────────── */
function getWaterStats(): { totalGlasses: number; maxGlassesInDay: number; consecutiveGoalDays: number; totalGoalDays: number; hasAnyEntry: boolean } {
  const stats = { totalGlasses: 0, maxGlassesInDay: 0, consecutiveGoalDays: 0, totalGoalDays: 0, hasAnyEntry: false }
  try {
    const raw = localStorage.getItem('habitlab_water_logs')
    if (!raw) return stats
    const logs: { date: string; glasses: number; total_ml: number }[] = JSON.parse(raw)
    if (!logs.length) return stats

    const settingsRaw = localStorage.getItem('habitlab_water_settings')
    const goalMl = settingsRaw ? (JSON.parse(settingsRaw).daily_goal_ml || 2500) : 2500

    // Sort descending to check consecutive streak from today
    const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date))

    let consec = 0
    let expectDate = new Date()
    expectDate.setHours(0, 0, 0, 0)

    for (const log of sorted) {
      stats.totalGlasses += Math.floor(log.glasses)
      if (log.glasses > stats.maxGlassesInDay) stats.maxGlassesInDay = Math.floor(log.glasses)
      if (log.total_ml > 0) stats.hasAnyEntry = true
      if (log.total_ml >= goalMl) stats.totalGoalDays++

      // consecutive check
      const logDate = new Date(log.date + 'T00:00:00')
      const diff = Math.round((expectDate.getTime() - logDate.getTime()) / 86400000)
      if (diff === 0 && log.total_ml >= goalMl) {
        consec++
        expectDate.setDate(expectDate.getDate() - 1)
      } else if (diff === 0) {
        // day exists but goal not met — break
        break
      } else if (diff > 0) {
        break
      }
    }
    stats.consecutiveGoalDays = consec
  } catch { /* ignore */ }
  return stats
}

export function checkNewBadges(
  streaks: Streak[],
  videosWatched: number,
  experimentsCompleted: number,
  weeklyConsistency: number,
  existingBadgeIds: string[]
): Badge[] {
  const newBadges: Badge[] = []

  const maxStreak = Math.max(...streaks.map((s) => s.current_streak), 0)

  if (maxStreak >= 7 && !existingBadgeIds.includes('1')) {
    newBadges.push(badgeDefinitions[0])
  }
  if (maxStreak >= 30 && !existingBadgeIds.includes('2')) {
    newBadges.push(badgeDefinitions[1])
  }
  if (weeklyConsistency >= 90 && !existingBadgeIds.includes('3')) {
    newBadges.push(badgeDefinitions[2])
  }
  if (videosWatched >= 10 && !existingBadgeIds.includes('5')) {
    newBadges.push(badgeDefinitions[4])
  }
  if (experimentsCompleted >= 1 && !existingBadgeIds.includes('6')) {
    newBadges.push(badgeDefinitions[5])
  }

  // ── Water badges ──────────────────────────────────────
  if (typeof window !== 'undefined') {
    const water = getWaterStats()
    if (water.hasAnyEntry && !existingBadgeIds.includes('w1')) {
      newBadges.push(badgeDefinitions.find(b => b.id === 'w1')!)
    }
    if (water.maxGlassesInDay >= 8 && !existingBadgeIds.includes('w2')) {
      newBadges.push(badgeDefinitions.find(b => b.id === 'w2')!)
    }
    if (water.totalGoalDays >= 3 && !existingBadgeIds.includes('w3')) {
      newBadges.push(badgeDefinitions.find(b => b.id === 'w3')!)
    }
    if (water.consecutiveGoalDays >= 7 && !existingBadgeIds.includes('w4')) {
      newBadges.push(badgeDefinitions.find(b => b.id === 'w4')!)
    }
    if (water.totalGlasses >= 50 && !existingBadgeIds.includes('w5')) {
      newBadges.push(badgeDefinitions.find(b => b.id === 'w5')!)
    }
    if (water.totalGlasses >= 200 && !existingBadgeIds.includes('w6')) {
      newBadges.push(badgeDefinitions.find(b => b.id === 'w6')!)
    }
  }

  return newBadges
}
