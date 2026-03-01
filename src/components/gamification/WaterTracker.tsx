'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Droplets,
  Plus,
  Minus,
  Settings,
  Bell,
  BellOff,
  GlassWater,
  ChevronDown,
  ChevronUp,
  X,
  Check,
} from 'lucide-react'
import {
  getWaterSettings,
  saveWaterSettings,
  getWaterLogToday,
  addWaterEntry,
  removeLastWaterEntry,
  getWaterLogsForWeek,
} from '@/lib/waterStore'
import type { WaterSettings, WaterLog, ReminderFrequency } from '@/types'

export default function WaterTracker() {
  const [settings, setSettings] = useState<WaterSettings>(getWaterSettings())
  const [todayLog, setTodayLog] = useState<WaterLog>(getWaterLogToday())
  const [weekLogs, setWeekLogs] = useState<WaterLog[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [showSetup, setShowSetup] = useState(false)

  // Draft settings for the form
  const [draftGoal, setDraftGoal] = useState(settings.daily_goal_ml)
  const [draftGlass, setDraftGlass] = useState(settings.glass_size_ml)
  const [draftReminderEnabled, setDraftReminderEnabled] = useState(settings.reminder_enabled)
  const [draftFrequency, setDraftFrequency] = useState<ReminderFrequency>(settings.reminder_frequency)
  const [draftStartTime, setDraftStartTime] = useState(settings.start_time)
  const [draftEndTime, setDraftEndTime] = useState(settings.end_time)
  const [draftCustomMin, setDraftCustomMin] = useState(settings.custom_interval_min || 60)

  useEffect(() => {
    const s = getWaterSettings()
    setSettings(s)
    setTodayLog(getWaterLogToday())
    setWeekLogs(getWaterLogsForWeek())

    // If never enabled, show setup prompt
    if (!s.enabled) {
      setShowSetup(true)
    }
  }, [])

  const goalGlasses = Math.ceil(settings.daily_goal_ml / settings.glass_size_ml)
  const progress = Math.min((todayLog.total_ml / settings.daily_goal_ml) * 100, 100)
  const goalReached = todayLog.total_ml >= settings.daily_goal_ml

  const handleDrink = () => {
    const updated = addWaterEntry()
    setTodayLog(updated)
    setWeekLogs(getWaterLogsForWeek())
  }

  const handleUndo = () => {
    const updated = removeLastWaterEntry()
    setTodayLog(updated)
    setWeekLogs(getWaterLogsForWeek())
  }

  const handleEnableWater = () => {
    const newSettings = { ...settings, enabled: true }
    saveWaterSettings(newSettings)
    setSettings(newSettings)
    setShowSetup(false)
  }

  const handleSaveSettings = () => {
    const newSettings: WaterSettings = {
      ...settings,
      daily_goal_ml: draftGoal,
      glass_size_ml: draftGlass,
      reminder_enabled: draftReminderEnabled,
      reminder_frequency: draftFrequency,
      start_time: draftStartTime,
      end_time: draftEndTime,
      custom_interval_min: draftFrequency === 'custom' ? draftCustomMin : undefined,
    }
    saveWaterSettings(newSettings)
    setSettings(newSettings)
    setShowSettings(false)
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const today = new Date().getDay()

  // Setup prompt — ask user if they want water reminders
  if (showSetup && !settings.enabled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800 p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center flex-shrink-0">
            <Droplets size={24} className="text-cyan-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Stay Hydrated! 💧</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Want me to remind you to drink water? Track your daily water intake and get notifications so you never forget to hydrate!
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleEnableWater}
                className="bg-cyan-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-1.5"
              >
                <Droplets size={14} /> Yes, Track My Water!
              </button>
              <button
                onClick={() => setShowSetup(false)}
                className="text-slate-500 text-sm hover:text-slate-700 dark:hover:text-slate-300 px-3 py-2"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // If not enabled, show nothing
  if (!settings.enabled) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 pb-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center">
            <Droplets size={18} className="text-cyan-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Water Intake</h3>
            <p className="text-[10px] text-slate-400">
              {todayLog.total_ml}ml / {settings.daily_goal_ml}ml
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {settings.reminder_enabled ? (
            <span className="text-[10px] bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
              <Bell size={10} /> Reminders On
            </span>
          ) : (
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <BellOff size={10} /> No Reminders
            </span>
          )}
          <button
            onClick={() => {
              setShowSettings(!showSettings)
              // Sync draft with current settings
              setDraftGoal(settings.daily_goal_ml)
              setDraftGlass(settings.glass_size_ml)
              setDraftReminderEnabled(settings.reminder_enabled)
              setDraftFrequency(settings.reminder_frequency)
              setDraftStartTime(settings.start_time)
              setDraftEndTime(settings.end_time)
              setDraftCustomMin(settings.custom_interval_min || 60)
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Progress Ring & Drink Button */}
      <div className="p-4 flex items-center gap-5">
        {/* Circular progress */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.64} 264`}
              className={goalReached ? 'text-green-500' : 'text-cyan-500'}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-slate-800 dark:text-white">
              {Math.round(progress)}%
            </span>
            <span className="text-[9px] text-slate-400">
              {todayLog.entries.length} 🥤
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-1 space-y-2">
          {goalReached ? (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">🎉 Goal Reached!</p>
              <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">
                You drank {todayLog.total_ml}ml today. Great job staying hydrated!
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {settings.daily_goal_ml - todayLog.total_ml}ml left · ~{Math.ceil((settings.daily_goal_ml - todayLog.total_ml) / settings.glass_size_ml)} glasses to go
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDrink}
              className="flex-1 bg-cyan-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-cyan-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Drink {settings.glass_size_ml}ml
            </button>
            {todayLog.entries.length > 0 && (
              <button
                onClick={handleUndo}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                title="Undo last glass"
              >
                <Minus size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Weekly mini bar chart */}
      <div className="px-4 pb-4">
        <div className="flex items-end gap-1 h-12">
          {weekLogs.map((log, i) => {
            const dayDate = new Date()
            dayDate.setDate(dayDate.getDate() - (6 - i))
            const dayOfWeek = dayDate.getDay()
            const h = Math.min((log.total_ml / settings.daily_goal_ml) * 100, 100)
            const isToday = i === 6
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full relative" style={{ height: '32px' }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-t transition-all ${
                      log.total_ml >= settings.daily_goal_ml
                        ? 'bg-green-400 dark:bg-green-500'
                        : isToday
                        ? 'bg-cyan-500'
                        : 'bg-cyan-200 dark:bg-cyan-800'
                    }`}
                    style={{ height: `${Math.max(h * 0.32, 2)}px` }}
                  />
                </div>
                <span className={`text-[9px] ${isToday ? 'font-bold text-cyan-600' : 'text-slate-400'}`}>
                  {dayLabels[dayOfWeek]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-slate-50 dark:bg-slate-800/50">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Settings size={14} /> Water Settings
              </h4>

              {/* Daily Goal */}
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                  Daily Goal (ml)
                </label>
                <div className="flex items-center gap-2">
                  {[1500, 2000, 2500, 3000, 3500, 4000].map(ml => (
                    <button
                      key={ml}
                      onClick={() => setDraftGoal(ml)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                        draftGoal === ml
                          ? 'bg-cyan-600 text-white'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-cyan-300'
                      }`}
                    >
                      {ml / 1000}L
                    </button>
                  ))}
                </div>
              </div>

              {/* Glass Size */}
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                  Glass Size (ml)
                </label>
                <div className="flex items-center gap-2">
                  {[150, 200, 250, 300, 500].map(ml => (
                    <button
                      key={ml}
                      onClick={() => setDraftGlass(ml)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                        draftGlass === ml
                          ? 'bg-cyan-600 text-white'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-cyan-300'
                      }`}
                    >
                      {ml}ml
                    </button>
                  ))}
                </div>
              </div>

              {/* Water Reminder Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Water Reminders</span>
                  <p className="text-[10px] text-slate-400">Get notified to drink water</p>
                </div>
                <button
                  onClick={() => setDraftReminderEnabled(!draftReminderEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    draftReminderEnabled ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      draftReminderEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Reminder frequency */}
              {draftReminderEnabled && (
                <div className="space-y-3 pl-1 border-l-2 border-cyan-200 dark:border-cyan-800 ml-1">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                      Reminder Frequency
                    </label>
                    <select
                      value={draftFrequency}
                      onChange={(e) => setDraftFrequency(e.target.value as ReminderFrequency)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="once">Once a day</option>
                      <option value="every_30min">Every 30 minutes</option>
                      <option value="every_1hr">Every hour</option>
                      <option value="every_2hr">Every 2 hours</option>
                      <option value="every_4hr">Every 4 hours</option>
                      <option value="custom">Custom interval</option>
                    </select>
                  </div>

                  {draftFrequency === 'custom' && (
                    <div>
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                        Custom interval (minutes)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={480}
                        value={draftCustomMin}
                        onChange={(e) => setDraftCustomMin(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">From</label>
                      <input
                        type="time"
                        value={draftStartTime}
                        onChange={(e) => setDraftStartTime(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Until</label>
                      <input
                        type="time"
                        value={draftEndTime}
                        onChange={(e) => setDraftEndTime(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Save / Cancel */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSaveSettings}
                  className="bg-cyan-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors font-medium flex items-center gap-1"
                >
                  <Check size={14} /> Save Settings
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
