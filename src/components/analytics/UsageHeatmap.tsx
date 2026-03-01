'use client'

import { useEffect, useState } from 'react'
import { Activity, Flame, Clock, Eye } from 'lucide-react'
import { getUsageData, getUsageStreak, getTotalVisits, getActiveDays, recordVisit, recordActiveMinute, type UsageDay } from '@/lib/usageTracker'

export default function UsageHeatmap({ days = 90 }: { days?: number }) {
  const [data, setData] = useState<UsageDay[]>([])
  const [streak, setStreak] = useState(0)
  const [totalVisits, setTotalVisits] = useState(0)
  const [activeDays, setActiveDays] = useState(0)
  const [tooltip, setTooltip] = useState<UsageDay | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Record this visit
    recordVisit()

    // Track active minutes every 60s
    const interval = setInterval(recordActiveMinute, 60_000)

    // Load data
    setData(getUsageData(days))
    setStreak(getUsageStreak())
    setTotalVisits(getTotalVisits())
    setActiveDays(getActiveDays())

    return () => clearInterval(interval)
  }, [days])

  if (!mounted) return null

  // Build week columns (7 rows per column)
  const weeks: UsageDay[][] = []
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7))
  }

  // Color based on intensity
  function cellColor(d: UsageDay): string {
    if (d.visits === 0) return 'bg-slate-100 dark:bg-slate-800'
    if (d.visits === 1) return 'bg-emerald-200 dark:bg-emerald-900'
    if (d.visits <= 3) return 'bg-emerald-400 dark:bg-emerald-700'
    if (d.visits <= 6) return 'bg-emerald-500 dark:bg-emerald-500'
    return 'bg-emerald-600 dark:bg-emerald-400'
  }

  function fmtDate(s: string) {
    return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Month labels — one per first week of each month
  const months: { label: string; idx: number }[] = []
  let prevMonth = -1
  weeks.forEach((w, wi) => {
    const firstDay = w[0]
    if (!firstDay) return
    const m = new Date(firstDay.date + 'T12:00:00').getMonth()
    if (m !== prevMonth) {
      prevMonth = m
      months.push({ label: new Date(firstDay.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }), idx: wi })
    }
  })

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Activity size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">App Activity</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Website usage — last {days} days</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: Flame, color: 'text-orange-500', value: streak, label: 'Day Streak' },
          { icon: Eye, color: 'text-blue-500', value: totalVisits, label: 'Total Visits' },
          { icon: Clock, color: 'text-emerald-500', value: activeDays, label: 'Active Days' },
        ].map((s, i) => (
          <div key={i} className="text-center bg-slate-50 dark:bg-slate-800 rounded-lg py-2.5 px-2">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <s.icon size={13} className={s.color} />
              <span className="text-lg font-bold text-slate-800 dark:text-white">{s.value}</span>
            </div>
            <p className="text-[10px] text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="mb-2 inline-flex items-center gap-2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg">
          <span className="font-medium">{fmtDate(tooltip.date)}</span>
          <span className="text-slate-400">·</span>
          <span>{tooltip.visits} visit{tooltip.visits !== 1 ? 's' : ''}</span>
          {tooltip.minutes > 0 && (
            <>
              <span className="text-slate-400">·</span>
              <span>{tooltip.minutes}m active</span>
            </>
          )}
        </div>
      )}

      {/* Grid with month headers */}
      <div className="overflow-x-auto pb-1">
        {/* Month labels row */}
        <div className="flex ml-7 mb-1">
          {weeks.map((_, wi) => {
            const m = months.find(mo => mo.idx === wi)
            return (
              <div key={wi} className="flex-shrink-0" style={{ width: 17 }}>
                {m && <span className="text-[9px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{m.label}</span>}
              </div>
            )
          })}
        </div>

        {/* Heatmap */}
        <div className="flex gap-[3px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-0.5 flex-shrink-0">
            {['', 'M', '', 'W', '', 'F', ''].map((d, i) => (
              <div key={i} className="w-5 h-[14px] flex items-center justify-end pr-1">
                <span className="text-[9px] text-slate-400 dark:text-slate-500">{d}</span>
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  onMouseEnter={() => setTooltip(day)}
                  onMouseLeave={() => setTooltip(null)}
                  className={`w-[14px] h-[14px] rounded-[3px] cursor-pointer transition-all duration-150 hover:scale-150 hover:ring-2 hover:ring-emerald-400/50 hover:z-10 ${cellColor(day)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400 dark:text-slate-500">
        <span>Less</span>
        <div className="flex gap-[3px]">
          <div className="w-3 h-3 rounded-[2px] bg-slate-100 dark:bg-slate-800" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-200 dark:bg-emerald-900" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-400 dark:bg-emerald-700" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-500 dark:bg-emerald-500" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-600 dark:bg-emerald-400" />
        </div>
        <span>More</span>
      </div>
    </div>
  )
}
