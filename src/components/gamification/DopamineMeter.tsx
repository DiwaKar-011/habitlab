'use client'

import { motion } from 'framer-motion'

interface DopamineMeterProps {
  completedToday: number
  totalHabits: number
}

export default function DopamineMeter({ completedToday, totalHabits }: DopamineMeterProps) {
  const percentage = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0

  const getColor = () => {
    if (percentage >= 80) return 'from-green-400 to-emerald-500'
    if (percentage >= 50) return 'from-yellow-400 to-amber-500'
    if (percentage >= 25) return 'from-orange-400 to-red-500'
    return 'from-slate-300 to-slate-400'
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-600">🧠 Dopamine Meter</span>
        <span className="text-xs text-slate-400">
          {completedToday}/{totalHabits} today
        </span>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${getColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      {percentage >= 100 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-green-600 font-medium mt-1.5"
        >
          ✨ All habits completed! Dopamine reward unlocked!
        </motion.p>
      )}
    </div>
  )
}
