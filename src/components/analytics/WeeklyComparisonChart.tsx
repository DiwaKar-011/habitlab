'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { DailyLog, Habit } from '@/types'

interface WeeklyComparisonChartProps {
  habits: Habit[]
  logs: DailyLog[]
}

export default function WeeklyComparisonChart({ habits, logs }: WeeklyComparisonChartProps) {
  const today = new Date()
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - today.getDay())
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  const data = habits.map((habit) => {
    const habitLogs = logs.filter((l) => l.habit_id === habit.id)

    const thisWeekLogs = habitLogs.filter((l) => {
      const d = new Date(l.log_date)
      return d >= thisWeekStart && d <= today
    })
    const lastWeekLogs = habitLogs.filter((l) => {
      const d = new Date(l.log_date)
      return d >= lastWeekStart && d < thisWeekStart
    })

    const thisWeekRate = thisWeekLogs.length > 0
      ? Math.round((thisWeekLogs.filter((l) => l.completed).length / thisWeekLogs.length) * 100)
      : 0
    const lastWeekRate = lastWeekLogs.length > 0
      ? Math.round((lastWeekLogs.filter((l) => l.completed).length / lastWeekLogs.length) * 100)
      : 0

    return {
      name: habit.title.length > 12 ? habit.title.slice(0, 12) + '...' : habit.title,
      thisWeek: thisWeekRate,
      lastWeek: lastWeekRate,
      improved: thisWeekRate >= lastWeekRate,
    }
  })

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <h3 className="text-sm font-medium text-slate-700 mb-4">📊 This Week vs Last Week</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" unit="%" />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          <Bar dataKey="lastWeek" name="Last Week" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="thisWeek" name="This Week" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.improved ? '#22c55e' : '#ef4444'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
