'use client'

import { DailyLog } from '@/types'
import { cn } from '@/lib/utils'

interface HeatmapCalendarProps {
  logs: DailyLog[]
  days?: number
}

export default function HeatmapCalendar({ logs, days = 90 }: HeatmapCalendarProps) {
  const today = new Date()
  const cells: { date: string; status: 'completed' | 'missed' | 'none' }[] = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const log = logs.find((l) => l.log_date === dateStr)

    cells.push({
      date: dateStr,
      status: log ? (log.completed ? 'completed' : 'missed') : 'none',
    })
  }

  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <h3 className="text-sm font-medium text-slate-700 mb-3">📅 Activity Heatmap</h3>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.status === 'completed' ? '✅ Completed' : cell.status === 'missed' ? '❌ Missed' : 'No log'}`}
                className={cn(
                  'w-3.5 h-3.5 rounded-sm cursor-pointer transition-colors',
                  cell.status === 'completed' && 'bg-green-500 hover:bg-green-600',
                  cell.status === 'missed' && 'bg-red-300 hover:bg-red-400',
                  cell.status === 'none' && 'bg-slate-100 hover:bg-slate-200'
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          Completed
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-red-300" />
          Missed
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-slate-100" />
          No log
        </div>
      </div>
    </div>
  )
}
