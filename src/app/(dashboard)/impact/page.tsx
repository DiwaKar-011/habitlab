'use client'

import { motion } from 'framer-motion'
import { Globe, Users, TrendingUp } from 'lucide-react'
import { mockHabits, mockLogs } from '@/lib/mockData'
import { calculateImpact, simulateGroupImpact } from '@/lib/impactCalc'
import { HabitCategory } from '@/types'

export default function ImpactPage() {
  // Calculate individual impact
  const impacts = mockHabits.map((habit) => {
    const logs = mockLogs.filter((l) => l.habit_id === habit.id && l.completed)
    const impact = calculateImpact(habit.category, logs.length)
    const groupImpact = simulateGroupImpact(habit.category, logs.length, 100)
    return { habit, impact, groupImpact, completedDays: logs.length }
  })

  const totalCompletedDays = impacts.reduce((a, b) => a + b.completedDays, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Real-World Impact</h1>
        <p className="text-slate-500 text-sm mt-1">
          See how your habits translate to real-world change
        </p>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-3 mb-4">
          <Globe size={24} />
          <h2 className="text-lg font-semibold">Your Total Impact</h2>
        </div>
        <p className="text-3xl font-bold">{totalCompletedDays} habit completions</p>
        <p className="text-emerald-100 text-sm mt-1">
          Every completion contributes to real-world change
        </p>
      </motion.div>

      {/* Individual Impact Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {impacts.map(({ habit, impact, completedDays }, i) => (
          <motion.div
            key={habit.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-xl border border-slate-200 p-5"
          >
            <h3 className="font-semibold text-slate-800 mb-1">{habit.title}</h3>
            <p className="text-xs text-slate-400 mb-4">
              {completedDays} days completed
            </p>
            <div className="flex items-end gap-2">
              <motion.span
                className="text-3xl font-bold text-emerald-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                {impact.total.toLocaleString()}
              </motion.span>
              <span className="text-sm text-slate-500 mb-1">{impact.unit}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{impact.metric}</p>
            <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((completedDays / habit.target_days) * 100, 100)}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Group Impact Simulation */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-brand-500" />
          <h2 className="text-lg font-semibold text-slate-800">
            If 100 Students Did This...
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {impacts.map(({ habit, groupImpact }) => (
            <div
              key={habit.id}
              className="bg-brand-50 rounded-lg p-4"
            >
              <p className="text-sm font-medium text-brand-800">{habit.title}</p>
              <p className="text-2xl font-bold text-brand-700 mt-1">
                {groupImpact.total.toLocaleString()} {groupImpact.unit}
              </p>
              <p className="text-xs text-brand-500">{groupImpact.metric} (100 students)</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
