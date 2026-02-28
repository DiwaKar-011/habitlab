'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface FailureChartProps {
  reasons: { reason: string; count: number; percentage: number }[]
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']

const reasonLabels: Record<string, string> = {
  tired: 'Tired',
  busy: 'Busy',
  forgot: 'Forgot',
  low_motivation: 'Low Motivation',
  other: 'Other',
  unknown: 'Unknown',
}

export default function FailureChart({ reasons }: FailureChartProps) {
  if (reasons.length === 0) {
    return (
      <div className="text-center text-slate-400 text-sm py-8">
        No failure data yet — keep it up!
      </div>
    )
  }

  const data = reasons.map((r) => ({
    name: reasonLabels[r.reason] || r.reason,
    value: r.count,
  }))

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <h3 className="text-sm font-medium text-slate-700 mb-4">Failure Reason Breakdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            {item.name}
          </div>
        ))}
      </div>
    </div>
  )
}
