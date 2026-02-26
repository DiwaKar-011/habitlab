import { Habit, DailyLog } from '@/types'

export type PersonalityType =
  | 'The Scientist'
  | 'The Performer'
  | 'The Night Owl'
  | 'The Scholar'
  | 'The Eco Hero'

export function assignPersonality(
  habits: Habit[],
  logs: DailyLog[],
  knowledgeScore: number
): { type: PersonalityType; description: string } {
  const completedLogs = logs.filter((l) => l.completed)
  const totalLogs = logs.length
  const consistency = totalLogs > 0 ? completedLogs.length / totalLogs : 0

  // Check categories
  const categoryCounts: Record<string, number> = {}
  habits.forEach((h) => {
    categoryCounts[h.category] = (categoryCounts[h.category] || 0) + 1
  })
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  // Check evening logs
  const eveningLogs = completedLogs.filter(
    (l) => l.completion_time && l.completion_time >= '18:00'
  )
  const isNightOwl = eveningLogs.length > completedLogs.length * 0.6

  if (knowledgeScore > 50) {
    return {
      type: 'The Scholar',
      description: 'You love learning about the science behind habits. Your knowledge drives your behavior change.',
    }
  }
  if (topCategory === 'eco' || topCategory === 'health') {
    return {
      type: 'The Eco Hero',
      description: 'You focus on habits that make the world better. Your impact extends beyond yourself.',
    }
  }
  if (isNightOwl) {
    return {
      type: 'The Night Owl',
      description: 'You thrive in the evening hours. Your best habit completions happen after dark.',
    }
  }
  if (consistency > 0.85) {
    return {
      type: 'The Scientist',
      description: 'Highly consistent and methodical. You approach habits like controlled experiments.',
    }
  }
  return {
    type: 'The Performer',
    description: 'Streak-driven and competitive. You thrive on challenges and leaderboards.',
  }
}
