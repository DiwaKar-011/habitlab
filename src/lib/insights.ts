import { DailyLog, Insight } from '@/types'

export function generateInsights(logs: DailyLog[]): Insight[] {
  if (logs.length < 3) {
    return [{
      type: 'info',
      message: 'Log at least 3 days to unlock Smart Insights. Keep going!',
      severity: 'low',
    }]
  }

  const insights: Insight[] = []
  const totalLogs = logs.length
  const completedLogs = logs.filter((l) => l.completed)
  const missedLogs = logs.filter((l) => !l.completed)
  const overallRate = Math.round((completedLogs.length / totalLogs) * 100)

  // ── Overall completion stats ──
  insights.push({
    type: overallRate >= 70 ? 'success' : overallRate >= 40 ? 'info' : 'warning',
    message: `Overall completion rate: ${overallRate}% (${completedLogs.length}/${totalLogs} days). ${
      overallRate >= 80 ? 'Outstanding consistency!' :
      overallRate >= 60 ? 'Good progress — push for 80%+!' :
      overallRate >= 40 ? 'Room to improve. Small wins compound!' :
      'You can turn this around — start a 3-day mini streak today.'
    }`,
    severity: overallRate >= 60 ? 'low' : 'medium',
  })

  // ── Rule 1: Weekend vs Weekday ──
  const weekendLogs = logs.filter((l) => {
    const day = new Date(l.log_date).getDay()
    return day === 0 || day === 6
  })
  const weekdayLogs = logs.filter((l) => {
    const day = new Date(l.log_date).getDay()
    return day !== 0 && day !== 6
  })
  const weekendCompleted = weekendLogs.filter((l) => l.completed).length
  const weekdayCompleted = weekdayLogs.filter((l) => l.completed).length
  const weekendRate = weekendLogs.length > 0 ? weekendCompleted / weekendLogs.length : 0
  const weekdayRate = weekdayLogs.length > 0 ? weekdayCompleted / weekdayLogs.length : 0

  if (weekdayLogs.length >= 3 && weekendLogs.length >= 1) {
    const weekdayPct = Math.round(weekdayRate * 100)
    const weekendPct = Math.round(weekendRate * 100)
    if (weekdayRate > weekendRate + 0.15) {
      insights.push({
        type: 'warning',
        message: `Weekday rate: ${weekdayPct}% vs Weekend: ${weekendPct}% — a ${weekdayPct - weekendPct}% drop! Try a lighter weekend routine to stay on track.`,
        severity: 'medium',
      })
    } else if (weekendRate > weekdayRate + 0.15) {
      insights.push({
        type: 'info',
        message: `You're stronger on weekends (${weekendPct}%) than weekdays (${weekdayPct}%). Can you shift your weekday schedule to match?`,
        severity: 'low',
      })
    }
  }

  // ── Rule 2: Trend detection (last 5 vs overall) ──
  const recentCount = Math.min(5, totalLogs)
  const lastN = logs.slice(-recentCount)
  const lastNRate = lastN.filter((l) => l.completed).length / recentCount
  const lastNPct = Math.round(lastNRate * 100)
  if (lastNRate < overallRate / 100 - 0.25) {
    insights.push({
      type: 'warning',
      message: `⚠️ Drop alert: Your last ${recentCount} days have a ${lastNPct}% rate vs ${overallRate}% overall. You may be losing momentum — act now!`,
      severity: 'high',
    })
  } else if (lastNRate > overallRate / 100 + 0.15) {
    insights.push({
      type: 'success',
      message: `🚀 Trending up! Last ${recentCount} days: ${lastNPct}% vs overall ${overallRate}%. You're building real momentum!`,
      severity: 'low',
    })
  }

  // ── Rule 3: Best time of day ──
  const morningLogs = logs.filter(
    (l) => l.completed && l.completion_time && l.completion_time < '12:00'
  )
  const afternoonLogs = logs.filter(
    (l) => l.completed && l.completion_time && l.completion_time >= '12:00' && l.completion_time < '17:00'
  )
  const eveningLogs = logs.filter(
    (l) => l.completed && l.completion_time && l.completion_time >= '17:00'
  )
  const timeBuckets = [
    { label: 'morning (before noon)', count: morningLogs.length },
    { label: 'afternoon (12–5 PM)', count: afternoonLogs.length },
    { label: 'evening (after 5 PM)', count: eveningLogs.length },
  ].sort((a, b) => b.count - a.count)

  if (timeBuckets[0].count > 0 && timeBuckets[0].count > timeBuckets[1].count) {
    insights.push({
      type: 'info',
      message: `🕐 Peak time: You perform best in the ${timeBuckets[0].label} (${timeBuckets[0].count} completions). Try to schedule this habit in that window.`,
      severity: 'low',
    })
  }

  // ── Rule 4: Mood correlation ──
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

  if (completedMoods.length >= 3 && missedMoods.length >= 1 && avgCompletedMood > avgMissedMood + 0.5) {
    insights.push({
      type: 'success',
      message: `😊 Mood boost: Average mood on completion days is ${avgCompletedMood.toFixed(1)}/5 vs ${avgMissedMood.toFixed(1)}/5 on missed days. This habit genuinely improves how you feel!`,
      severity: 'medium',
    })
  } else if (missedMoods.length >= 2 && avgMissedMood > avgCompletedMood + 0.5) {
    insights.push({
      type: 'info',
      message: `Your mood seems higher on days you skip (${avgMissedMood.toFixed(1)}/5). Consider if this habit aligns with your goals — or shift its schedule.`,
      severity: 'medium',
    })
  }

  // ── Rule 5: Streak analysis ──
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  for (const log of logs) {
    if (log.completed) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }
  // Get current streak from end
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].completed) currentStreak++
    else break
  }
  if (longestStreak >= 3) {
    insights.push({
      type: currentStreak >= longestStreak ? 'success' : 'info',
      message: `🔥 Longest streak: ${longestStreak} days | Current streak: ${currentStreak} days. ${
        currentStreak >= longestStreak ? 'You\'re at your personal best — keep it going!' :
        currentStreak >= longestStreak * 0.5 ? 'You\'re halfway to your record — push through!' :
        `Your record is ${longestStreak} days. Start building toward it!`
      }`,
      severity: 'low',
    })
  }

  // ── Rule 6: Day-of-week breakdown ──
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayStats = dayNames.map((name, idx) => {
    const dayLogs = logs.filter((l) => new Date(l.log_date).getDay() === idx)
    const dayCompleted = dayLogs.filter((l) => l.completed).length
    return { name, total: dayLogs.length, completed: dayCompleted, rate: dayLogs.length > 0 ? dayCompleted / dayLogs.length : 0 }
  }).filter((d) => d.total > 0)

  const bestDay = dayStats.sort((a, b) => b.rate - a.rate)[0]
  const worstDay = dayStats.sort((a, b) => a.rate - b.rate)[0]
  if (bestDay && worstDay && bestDay.name !== worstDay.name && dayStats.length >= 3) {
    insights.push({
      type: 'info',
      message: `📅 Best day: ${bestDay.name} (${Math.round(bestDay.rate * 100)}% rate) | Weakest: ${worstDay.name} (${Math.round(worstDay.rate * 100)}%). Focus extra effort on ${worstDay.name}s.`,
      severity: 'low',
    })
  }

  // ── Rule 7: Failure reason analysis ──
  const failureReasons: Record<string, number> = {}
  for (const log of missedLogs) {
    if (log.failure_reason) {
      failureReasons[log.failure_reason] = (failureReasons[log.failure_reason] || 0) + 1
    }
  }
  const topReason = Object.entries(failureReasons).sort((a, b) => b[1] - a[1])[0]
  if (topReason && topReason[1] >= 2) {
    const reasonLabels: Record<string, string> = { tired: 'being tired', busy: 'being busy', forgot: 'forgetting', low_motivation: 'low motivation', other: 'other reasons' }
    insights.push({
      type: 'warning',
      message: `🎯 Top barrier: "${reasonLabels[topReason[0]] || topReason[0]}" caused ${topReason[1]} misses (${Math.round((topReason[1] / missedLogs.length) * 100)}% of all misses). Address this specific blocker to unlock progress.`,
      severity: 'medium',
    })
  }

  // ── Rule 8: Energy correlation ──
  const completedEnergy = logs
    .filter((l) => l.completed && l.energy_rating)
    .map((l) => l.energy_rating!)
  if (completedEnergy.length >= 3) {
    const avgEnergy = completedEnergy.reduce((a, b) => a + b, 0) / completedEnergy.length
    insights.push({
      type: 'info',
      message: `⚡ Average energy on completion days: ${avgEnergy.toFixed(1)}/5. ${
        avgEnergy >= 4 ? 'High energy fuels your habit — protect your energy levels!' :
        avgEnergy >= 3 ? 'Moderate energy works for you. Consistency matters more than peak energy.' :
        'You complete even on low-energy days — that shows real discipline!'
      }`,
      severity: 'low',
    })
  }

  // ── Motivational anti-fake message ──
  if (overallRate >= 95 && totalLogs >= 10) {
    insights.push({
      type: 'info',
      message: '💡 Pro tip: Honest logging builds real habits. If you\'re marking tasks done without actually doing them, you\'re only cheating yourself. Real change comes from genuine effort — even imperfect data is more valuable than fake streaks.',
      severity: 'medium',
    })
  }

  if (insights.length <= 1) {
    insights.push({
      type: 'info',
      message: 'Keep logging consistently to unlock deeper insights. Every honest entry helps the algorithm learn your patterns.',
      severity: 'low',
    })
  }

  return insights
}
