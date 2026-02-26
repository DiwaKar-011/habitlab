'use client'

import { useState } from 'react'
import { BarChart3, Info, AlertTriangle, CheckCircle } from 'lucide-react'
import { mockHabits, mockLogs, getLogsForHabit } from '@/lib/mockData'
import { generateInsights } from '@/lib/insights'
import LineGraph from '@/components/analytics/LineGraph'
import WeeklyComparisonChart from '@/components/analytics/WeeklyComparisonChart'

export default function InsightsPage() {
  const [range, setRange] = useState<'7' | '30' | 'all'>('30')

  // Combine all insights
  const allInsights = mockHabits.flatMap((habit) => {
    const logs = getLogsForHabit(habit.id)
    return generateInsights(logs).map((insight) => ({
      ...insight,
      habitTitle: habit.title,
    }))
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Smart Insights</h1>
        <p className="text-slate-500 text-sm mt-1">
          AI-powered analysis of your habit data
        </p>
      </div>

      {/* Range selector */}
      <div className="flex gap-2">
        {[
          { value: '7' as const, label: 'Last 7 days' },
          { value: '30' as const, label: 'Last 30 days' },
          { value: 'all' as const, label: 'All time' },
        ].map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              range === r.value
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Insight cards */}
      <div className="space-y-3">
        {allInsights.map((insight, i) => (
          <div
            key={i}
            className={`bg-white rounded-xl border p-4 flex items-start gap-3 ${
              insight.type === 'success'
                ? 'border-green-200'
                : insight.type === 'warning'
                ? 'border-amber-200'
                : 'border-blue-200'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                insight.type === 'success'
                  ? 'bg-green-50 text-green-500'
                  : insight.type === 'warning'
                  ? 'bg-amber-50 text-amber-500'
                  : 'bg-blue-50 text-blue-500'
              }`}
            >
              {insight.type === 'success' ? (
                <CheckCircle size={16} />
              ) : insight.type === 'warning' ? (
                <AlertTriangle size={16} />
              ) : (
                <Info size={16} />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{insight.message}</p>
              <p className="text-xs text-slate-400 mt-0.5">From: {insight.habitTitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <LineGraph logs={mockLogs} range={range} />
        <WeeklyComparisonChart habits={mockHabits} logs={mockLogs} />
      </div>
    </div>
  )
}
