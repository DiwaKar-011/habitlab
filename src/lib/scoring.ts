export function calculateHabitStrength(
  consistencyPercent: number,
  streakLength: number,
  difficultyLevel: number
): number {
  return Math.round((consistencyPercent / 100) * streakLength * difficultyLevel)
}

export function calculateConsistency(
  completedDays: number,
  totalDays: number
): number {
  if (totalDays === 0) return 0
  return Math.round((completedDays / totalDays) * 100)
}

export function calculateXPForLog(completed: boolean, streak: number): number {
  const base = completed ? 10 : 0
  const streakBonus = completed ? Math.min(streak * 2, 20) : 0
  return base + streakBonus
}
