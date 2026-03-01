// Website usage tracker — records daily visits in localStorage
// Used to build a GitHub-style heatmap of app usage

const USAGE_KEY = 'habitlab_usage_log'

export interface UsageDay {
  date: string   // YYYY-MM-DD
  visits: number // how many times user opened/visited this day
  minutes: number // estimated minutes of active usage
}

function getUsageLog(): UsageDay[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(USAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveUsageLog(log: UsageDay[]) {
  localStorage.setItem(USAGE_KEY, JSON.stringify(log))
}

/** Call on every page load / mount to record a visit */
export function recordVisit() {
  const today = new Date().toISOString().split('T')[0]
  const log = getUsageLog()
  const idx = log.findIndex(d => d.date === today)
  if (idx >= 0) {
    log[idx].visits += 1
  } else {
    log.push({ date: today, visits: 1, minutes: 0 })
  }
  // Trim to last 365 days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 365)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  const trimmed = log.filter(d => d.date >= cutoffStr)
  saveUsageLog(trimmed)
}

/** Call periodically (e.g. every 60s) to track active minutes */
export function recordActiveMinute() {
  const today = new Date().toISOString().split('T')[0]
  const log = getUsageLog()
  const idx = log.findIndex(d => d.date === today)
  if (idx >= 0) {
    log[idx].minutes += 1
  } else {
    log.push({ date: today, visits: 1, minutes: 1 })
  }
  saveUsageLog(log)
}

/** Get usage data for the last N days */
export function getUsageData(days = 90): UsageDay[] {
  const log = getUsageLog()
  const today = new Date()
  const result: UsageDay[] = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const existing = log.find(l => l.date === dateStr)
    result.push(existing || { date: dateStr, visits: 0, minutes: 0 })
  }
  return result
}

/** Get a streak count for consecutive active days */
export function getUsageStreak(): number {
  const log = getUsageLog()
  const logDates = new Set(log.filter(d => d.visits > 0).map(d => d.date))
  let streak = 0
  const d = new Date()

  while (true) {
    const dateStr = d.toISOString().split('T')[0]
    if (logDates.has(dateStr)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

/** Total visits ever */
export function getTotalVisits(): number {
  return getUsageLog().reduce((sum, d) => sum + d.visits, 0)
}

/** Total active minutes ever */
export function getTotalMinutes(): number {
  return getUsageLog().reduce((sum, d) => sum + d.minutes, 0)
}

/** Get total unique active days */
export function getActiveDays(): number {
  return getUsageLog().filter(d => d.visits > 0).length
}
