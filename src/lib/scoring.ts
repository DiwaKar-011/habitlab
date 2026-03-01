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

export function calculateXPForLog(completed: boolean, streak: number, difficulty: number = 3): number {
  if (!completed) return 0

  // Random XP based on difficulty level
  // Easy (1-2): 5–15 XP   | Medium (3): 15–30 XP   | Hard (4-5): 30–50 XP
  let min: number, max: number
  if (difficulty <= 2) {
    min = 5; max = 15
  } else if (difficulty <= 3) {
    min = 15; max = 30
  } else {
    min = 30; max = 50
  }

  const baseXP = Math.floor(Math.random() * (max - min + 1)) + min
  const streakBonus = Math.min(streak * 2, 20)
  return baseXP + streakBonus
}
