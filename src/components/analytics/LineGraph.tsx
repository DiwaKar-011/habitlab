'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DailyLog } from '@/types'

interface LineGraphProps {
  logs: DailyLog[]
  range?: '7' | '30' | 'all'
}

export default function LineGraph({ logs, range = '30' }: LineGraphProps) {
  // Group by week and calculate completion %
  const filteredLogs = range === 'all'
    ? logs
    : logs.filter((l) => {
        const daysAgo = Math.floor(
          (Date.now() - new Date(l.log_date).getTime()) / 86400000
        )
        return daysAgo <= (range === '7' ? 7 : 30)
      })

  // Group by week
  const weeks: Record<string, { total: number; completed: number }> = {}
  filteredLogs.forEach((log) => {
    const d = new Date(log.log_date)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().split('T')[0]
    if (!weeks[key]) weeks[key] = { total: 0, completed: 0 }
    weeks[key].total++
    if (log.completed) weeks[key].completed++
  })

  const data = Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, stats]) => ({
      week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rate: Math.round((stats.completed / stats.total) * 100),
    }))

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200 text-center text-slate-400 text-sm">
        Not enough data for the chart yet.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <h3 className="text-sm font-medium text-slate-700 mb-4">📈 Completion Rate Over Time</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" unit="%" />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
            formatter={(value: number) => [`${value}%`, 'Completion Rate']}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ fill: '#0ea5e9', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
