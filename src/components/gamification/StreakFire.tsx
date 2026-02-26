'use client'

import { motion } from 'framer-motion'

interface StreakFireProps {
  streakCount: number
}

export default function StreakFire({ streakCount }: StreakFireProps) {
  if (streakCount === 0) {
    return <span className="text-slate-300 text-lg">🔥</span>
  }

  let level: { emoji: string; label: string; color: string; pulse: boolean }

  if (streakCount >= 30) {
    level = { emoji: '⚡🔥', label: 'Inferno', color: 'text-purple-500', pulse: true }
  } else if (streakCount >= 15) {
    level = { emoji: '🔥🔥🔥', label: 'Blaze', color: 'text-red-500', pulse: false }
  } else if (streakCount >= 7) {
    level = { emoji: '🔥🔥', label: 'Strong', color: 'text-orange-500', pulse: false }
  } else {
    level = { emoji: '🔥', label: 'Small', color: 'text-yellow-500', pulse: false }
  }

  return (
    <motion.div
      className="inline-flex items-center gap-1.5"
      animate={level.pulse ? { scale: [1, 1.1, 1] } : {}}
      transition={level.pulse ? { duration: 1.5, repeat: Infinity } : {}}
    >
      <span className="text-lg">{level.emoji}</span>
      <span className={`text-sm font-bold ${level.color}`}>{streakCount}</span>
    </motion.div>
  )
}
