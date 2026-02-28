import { Badge, UserBadge, Streak } from '@/types'

const badgeDefinitions: Badge[] = [
  { id: '1', name: 'Consistency Starter', description: 'Complete a habit 7 days in a row', condition: 'streak_7', icon_url: 'S7' },
  { id: '2', name: 'Habit Champion', description: 'Maintain a 30-day streak', condition: 'streak_30', icon_url: 'S30' },
  { id: '3', name: 'Precision Performer', description: 'Achieve 90% weekly completion', condition: 'consistency_90', icon_url: '90%' },
  { id: '4', name: 'Challenge Victor', description: 'Win a public challenge', condition: 'challenge_winner', icon_url: 'VIC' },
  { id: '5', name: 'Scholar', description: 'Watch 10 habit videos', condition: 'videos_10', icon_url: 'EDU' },
  { id: '6', name: 'Experimenter', description: 'Complete your first experiment', condition: 'experiment_complete', icon_url: 'LAB' },
]

export function getAllBadges(): Badge[] {
  return badgeDefinitions
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

  return newBadges
}
