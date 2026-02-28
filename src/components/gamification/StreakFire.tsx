'use client'

import { motion } from 'framer-motion'
import { Flame, Zap } from 'lucide-react'

interface StreakFireProps {
  streakCount: number
}

export default function StreakFire({ streakCount }: StreakFireProps) {
  if (streakCount === 0) {
    return <Flame size={18} className="text-slate-300" />
  }

  let level: { icon: 'flame' | 'zap'; label: string; color: string; pulse: boolean }

  if (streakCount >= 30) {
    level = { icon: 'zap', label: 'Inferno', color: 'text-purple-500', pulse: true }
  } else if (streakCount >= 15) {
    level = { icon: 'flame', label: 'Blaze', color: 'text-red-500', pulse: false }
  } else if (streakCount >= 7) {
    level = { icon: 'flame', label: 'Strong', color: 'text-orange-500', pulse: false }
  } else {
    level = { icon: 'flame', label: 'Small', color: 'text-yellow-500', pulse: false }
  }

  const Icon = level.icon === 'zap' ? Zap : Flame

  return (
    <motion.div
      className="inline-flex items-center gap-1.5"
      animate={level.pulse ? { scale: [1, 1.1, 1] } : {}}
      transition={level.pulse ? { duration: 1.5, repeat: Infinity } : {}}
    >
      <Icon size={18} className={level.color} />
      <span className={`text-sm font-bold ${level.color}`}>{streakCount}</span>
    </motion.div>
  )
}
