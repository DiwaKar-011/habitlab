// Water tracker store — persisted in localStorage
import { WaterSettings, WaterLog, WaterEntry, ReminderFrequency } from '@/types'

const WATER_SETTINGS_KEY = 'habitlab_water_settings'
const WATER_LOG_KEY = 'habitlab_water_logs'

// ─── Default Settings ─────────────────────────────────

const DEFAULT_SETTINGS: WaterSettings = {
  enabled: false,
  daily_goal_ml: 2500,       // 2.5 liters
  glass_size_ml: 250,        // 250ml per glass
  reminder_enabled: false,
  reminder_frequency: 'every_1hr',
  start_time: '08:00',
  end_time: '22:00',
  days_of_week: [0, 1, 2, 3, 4, 5, 6],
}

// ─── Settings CRUD ────────────────────────────────────

export function getWaterSettings(): WaterSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(WATER_SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveWaterSettings(settings: WaterSettings) {
  localStorage.setItem(WATER_SETTINGS_KEY, JSON.stringify(settings))
}

// ─── Water Logs ───────────────────────────────────────

function getAllWaterLogs(): WaterLog[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(WATER_LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAllWaterLogs(logs: WaterLog[]) {
  // Keep only last 90 days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  const trimmed = logs.filter(l => l.date >= cutoffStr)
  localStorage.setItem(WATER_LOG_KEY, JSON.stringify(trimmed))
}

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

export function getWaterLogForDate(date: string): WaterLog {
  const all = getAllWaterLogs()
  const existing = all.find(l => l.date === date)
  return existing || { date, glasses: 0, total_ml: 0, entries: [] }
}

export function getWaterLogToday(): WaterLog {
  return getWaterLogForDate(getTodayKey())
}

export function addWaterEntry(amount_ml?: number): WaterLog {
  const settings = getWaterSettings()
  const ml = amount_ml || settings.glass_size_ml
  const today = getTodayKey()
  const all = getAllWaterLogs()
  let log = all.find(l => l.date === today)

  const entry: WaterEntry = {
    id: `water-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    time: new Date().toISOString(),
    amount_ml: ml,
  }

  if (log) {
    log.entries.push(entry)
    log.total_ml += ml
    log.glasses = Math.round(log.total_ml / settings.glass_size_ml * 10) / 10
  } else {
    log = {
      date: today,
      glasses: Math.round(ml / settings.glass_size_ml * 10) / 10,
      total_ml: ml,
      entries: [entry],
    }
    all.push(log)
  }

  saveAllWaterLogs(all)
  return log
}

export function removeLastWaterEntry(): WaterLog {
  const settings = getWaterSettings()
  const today = getTodayKey()
  const all = getAllWaterLogs()
  const log = all.find(l => l.date === today)

  if (log && log.entries.length > 0) {
    const removed = log.entries.pop()!
    log.total_ml = Math.max(0, log.total_ml - removed.amount_ml)
    log.glasses = Math.round(log.total_ml / settings.glass_size_ml * 10) / 10
    saveAllWaterLogs(all)
    return log
  }

  return log || { date: today, glasses: 0, total_ml: 0, entries: [] }
}

export function getWaterLogsForWeek(): WaterLog[] {
  const logs: WaterLog[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    logs.push(getWaterLogForDate(key))
  }
  return logs
}

// ─── Water Reminder Messages ──────────────────────────

const WATER_MESSAGES = [
  "💧 Time to drink some water! Stay hydrated, stay sharp.",
  "🥤 Your body needs water! Take a sip now.",
  "💦 Hydration check! Have you had water recently?",
  "🌊 Water is brain fuel — drink up!",
  "💧 Quick reminder: Grab a glass of water!",
  "🧊 Feeling tired? You might just be dehydrated. Drink water!",
  "💧 A hydrated brain is a focused brain. Drink water now!",
  "🥛 Your muscles, skin, and brain all need water. Drink some!",
  "💧 68% of your body is water — keep the tank full!",
  "🫗 Don't forget to hydrate! Your body will thank you.",
]

export function getRandomWaterMessage(): string {
  return WATER_MESSAGES[Math.floor(Math.random() * WATER_MESSAGES.length)]
}
