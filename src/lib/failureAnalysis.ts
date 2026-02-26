import { DailyLog } from '@/types'

interface FailureAnalysisResult {
  reasons: { reason: string; count: number; percentage: number }[]
  weekendEffect: boolean
  suggestions: string[]
}

export function analyzeFailures(logs: DailyLog[]): FailureAnalysisResult {
  const failedLogs = logs.filter((l) => !l.completed)
  const reasonCounts: Record<string, number> = {}

  failedLogs.forEach((log) => {
    const reason = log.failure_reason || 'unknown'
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
  })

  const total = failedLogs.length || 1
  const reasons = Object.entries(reasonCounts)
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  // Weekend effect
  const weekendFailures = failedLogs.filter((l) => {
    const day = new Date(l.log_date).getDay()
    return day === 0 || day === 6
  }).length
  const weekdayFailures = failedLogs.length - weekendFailures
  const weekendRate = weekendFailures / 2
  const weekdayRate = weekdayFailures / 5
  const weekendEffect = weekendRate > weekdayRate * 1.5

  // Suggestions
  const suggestions: string[] = []
  if (reasons[0]?.reason === 'tired') {
    suggestions.push('Try scheduling this habit earlier in the day when energy is highest.')
  }
  if (reasons[0]?.reason === 'forgot') {
    suggestions.push('Set a phone reminder or pair this habit with an existing routine.')
  }
  if (reasons[0]?.reason === 'busy') {
    suggestions.push('Consider a smaller version of this habit that takes only 2 minutes.')
  }
  if (reasons[0]?.reason === 'low_motivation') {
    suggestions.push('Try reward stacking — pair this habit with something you enjoy.')
  }
  if (weekendEffect) {
    suggestions.push('You tend to miss more on weekends. Try a modified weekend version.')
  }
  if (suggestions.length === 0) {
    suggestions.push('Keep going! Analyze your patterns over a longer period for better insights.')
  }

  return { reasons, weekendEffect, suggestions }
}
