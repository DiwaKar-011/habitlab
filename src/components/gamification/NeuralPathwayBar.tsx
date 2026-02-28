'use client'

import { motion } from 'framer-motion'

interface NeuralPathwayBarProps {
  habitAge: number // days since habit creation
  totalCompletions: number
}

export default function NeuralPathwayBar({ habitAge, totalCompletions }: NeuralPathwayBarProps) {
  // Neural pathway strength grows with total completions and never resets
  const maxStrength = 100
  const strength = Math.min((totalCompletions / 60) * 100, maxStrength)

  const getLabel = () => {
    if (strength >= 80) return { text: 'Strong Pathway', color: 'text-green-600' }
    if (strength >= 50) return { text: 'Growing Pathway', color: 'text-blue-600' }
    if (strength >= 25) return { text: 'Forming Pathway', color: 'text-amber-600' }
    return { text: 'New Pathway', color: 'text-slate-500' }
  }

  const label = getLabel()

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Neural Pathway</span>
        <span className={`text-xs font-medium ${label.color}`}>{label.text}</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-accent-500"
          initial={{ width: 0 }}
          animate={{ width: `${strength}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[10px] text-slate-400">
        {totalCompletions} completions over {habitAge} days
      </p>
    </div>
  )
}
