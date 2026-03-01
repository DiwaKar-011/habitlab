'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Flame, Clock, Eye } from 'lucide-react'
import { getUsageData, getUsageStreak, getTotalVisits, getActiveDays, recordVisit, recordActiveMinute, UsageDay } from '@/lib/usageTracker'

export default function UsageHeatmap({ days = 90 }: { days?: number }) {
  const [data, setData] = useState<UsageDay[]>([])
  const [streak, setStreak] = useState(0)
  const [totalVisits, setTotalVisits] = useState(0)
  const [activeDays, setActiveDays] = useState(0)
  const [hoveredDay, setHoveredDay] = useState<UsageDay | null>(null)

  useEffect(() => {
    // Record this visit
    recordVisit()

    // Track active minutes every 60s
    const interval = setInterval(() => {
      recordActiveMinute()
    }, 60 * 1000)

    // Load data
    setData(getUsageData(days))
    setStreak(getUsageStreak())
    setTotalVisits(getTotalVisits())
    setActiveDays(getActiveDays())

    return () => clearInterval(interval)
  }, [days])

  // Build weeks for the grid
  const weeks: UsageDay[][] = []
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7))
  }

  // Color intensity based on visits
  function getColor(day: UsageDay): string {
    if (day.visits === 0) return 'bg-slate-100 dark:bg-slate-800'
    if (day.visits === 1) return 'bg-emerald-200 dark:bg-emerald-900/60'
    if (day.visits <= 3) return 'bg-emerald-400 dark:bg-emerald-700'
    if (day.visits <= 6) return 'bg-emerald-500 dark:bg-emerald-600'
    return 'bg-emerald-600 dark:bg-emerald-500'
  }

  function getGlow(day: UsageDay): string {
    if (day.visits >= 5) return 'shadow-sm shadow-emerald-400/50'
    return ''
  }

  // Format date for tooltip
  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const monthLabels: { label: string; col: number }[] = []
  let lastMonth = -1
  data.forEach((d, i) => {
    const month = new Date(d.date + 'T00:00:00').getMonth()
    if (month !== lastMonth) {
      lastMonth = month
      monthLabels.push({
        label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }),
        col: Math.floor(i / 7),
      })
    }
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">App Activity</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Your website usage over {days} days</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Flame size={12} className="text-orange-500" />
            <span className="text-lg font-bold text-slate-800 dark:text-white">{streak}</span>
          </div>
          <p className="text-[10px] text-slate-400">Day Streak</p>
        </div>
        <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Eye size={12} className="text-blue-500" />
            <span className="text-lg font-bold text-slate-800 dark:text-white">{totalVisits}</span>
          </div>
          <p className="text-[10px] text-slate-400">Total Visits</p>
        </div>
        <div className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Clock size={12} className="text-emerald-500" />
            <span className="text-lg font-bold text-slate-800 dark:text-white">{activeDays}</span>
          </div>
          <p className="text-[10px] text-slate-400">Active Days</p>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div className="mb-2 px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg inline-flex items-center gap-2">
          <span className="font-medium">{formatDate(hoveredDay.date)}</span>
          <span className="text-slate-300">•</span>
          <span>{hoveredDay.visits} visit{hoveredDay.visits !== 1 ? 's' : ''}</span>
          {hoveredDay.minutes > 0 && (
            <>
              <span className="text-slate-300">•</span>
              <span>{hoveredDay.minutes} min</span>
            </>
          )}
        </div>
      )}

      {/* Month Labels */}
      <div className="flex gap-1 mb-1 ml-7" style={{ minWidth: 'fit-content' }}>
        {monthLabels.map((m, i) => (
          <div
            key={i}
            className="text-[9px] text-slate-400 dark:text-slate-500"
            style={{ 
              position: 'relative',
              left: `${m.col * 16}px`,
              marginLeft: i === 0 ? 0 : `-${(monthLabels[i - 1]?.col || 0) * 16 + (monthLabels[i - 1]?.label.length || 0) * 5}px`,
            }}
          >
            {m.label}
          </div>
        ))}
      </div>

      {/* Heatmap Grid */}
      <div className="flex gap-[3px] overflow-x-auto pb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1">
          {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
            <div key={i} className="h-[14px] flex items-center">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 w-5">{label}</span>
            </div>
          ))}
        </div>
        {/* Cells */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <motion.div
                key={day.date}
                whileHover={{ scale: 1.4 }}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`w-[14px] h-[14px] rounded-[3px] cursor-pointer transition-colors ${getColor(day)} ${getGlow(day)}`}
                title={`${formatDate(day.date)}: ${day.visits} visits`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400 dark:text-slate-500">
        <span>Less</span>
        <div className="flex gap-[3px]">
          <div className="w-[12px] h-[12px] rounded-[2px] bg-slate-100 dark:bg-slate-800" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-emerald-200 dark:bg-emerald-900/60" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-emerald-400 dark:bg-emerald-700" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-emerald-500 dark:bg-emerald-600" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-emerald-600 dark:bg-emerald-500" />
        </div>
        <span>More</span>
      </div>
    </motion.div>
  )
}
