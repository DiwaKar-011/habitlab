import { DailyLog, Insight } from '@/types'

export function generateInsights(logs: DailyLog[]): Insight[] {
  if (logs.length < 7) {
    return [{
      type: 'info',
      message: 'Log at least 7 days to unlock Smart Insights.',
      severity: 'low',
    }]
  }

  const insights: Insight[] = []

  // Rule 1: Weekend vs Weekday
  const weekendLogs = logs.filter((l) => {
    const day = new Date(l.log_date).getDay()
    return day === 0 || day === 6
  })
  const weekdayLogs = logs.filter((l) => {
    const day = new Date(l.log_date).getDay()
    return day !== 0 && day !== 6
  })
  const weekendRate = weekendLogs.length > 0
    ? weekendLogs.filter((l) => l.completed).length / weekendLogs.length
    : 0
  const weekdayRate = weekdayLogs.length > 0
    ? weekdayLogs.filter((l) => l.completed).length / weekdayLogs.length
    : 0

  if (weekdayRate > weekendRate + 0.2) {
    insights.push({
      type: 'warning',
      message: `Your completion rate drops by ${Math.round((weekdayRate - weekendRate) * 100)}% on weekends. Consider a lighter weekend routine.`,
      severity: 'medium',
    })
  }

  // Rule 2: Drop-off prediction
  const last3 = logs.slice(-3)
  const last3Rate = last3.filter((l) => l.completed).length / 3
  const overallRate = logs.filter((l) => l.completed).length / logs.length
  if (last3Rate < overallRate - 0.3) {
    insights.push({
      type: 'warning',
      message: 'Your recent completion rate is dropping. You might be at risk of breaking your habit loop.',
      severity: 'high',
    })
  } else if (last3Rate > overallRate + 0.2) {
    insights.push({
      type: 'success',
      message: 'Great momentum! Your recent performance is trending upward.',
      severity: 'low',
    })
  }

  // Rule 3: Best time of day
  const morningLogs = logs.filter(
    (l) => l.completed && l.completion_time && l.completion_time < '12:00'
  )
  const eveningLogs = logs.filter(
    (l) => l.completed && l.completion_time && l.completion_time >= '12:00'
  )
  if (morningLogs.length > eveningLogs.length * 1.5) {
    insights.push({
      type: 'info',
      message: 'You perform best in the morning. Try to keep your habit time before noon.',
      severity: 'low',
    })
  } else if (eveningLogs.length > morningLogs.length * 1.5) {
    insights.push({
      type: 'info',
      message: 'You tend to complete habits in the evening. Make sure it doesn\'t conflict with sleep.',
      severity: 'low',
    })
  }

  // Rule 4: Mood correlation
  const completedMoods = logs
    .filter((l) => l.completed && l.mood_rating)
    .map((l) => l.mood_rating!)
  const missedMoods = logs
    .filter((l) => !l.completed && l.mood_rating)
    .map((l) => l.mood_rating!)
  
  const avgCompletedMood = completedMoods.length > 0
    ? completedMoods.reduce((a, b) => a + b, 0) / completedMoods.length
    : 0
  const avgMissedMood = missedMoods.length > 0
    ? missedMoods.reduce((a, b) => a + b, 0) / missedMoods.length
    : 0

  if (avgCompletedMood > avgMissedMood + 1) {
    insights.push({
      type: 'success',
      message: `Your mood is ${(avgCompletedMood - avgMissedMood).toFixed(1)} points higher on days you complete this habit!`,
      severity: 'medium',
    })
  }

  if (insights.length === 0) {
    insights.push({
      type: 'info',
      message: 'Keep logging consistently to unlock deeper insights.',
      severity: 'low',
    })
  }

  return insights
}
