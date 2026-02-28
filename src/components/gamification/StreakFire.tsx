'use client'

import { motion } from 'framer-motion'

interface StreakFireProps {
  streakCount: number
}

export default function StreakFire({ streakCount }: StreakFireProps) {
  if (streakCount === 0) {
    return <span className="text-slate-300">🔥</span>
  }

  let emoji: string
  let label: string
  let pulse = false

  if (streakCount >= 30) {
    emoji = '⚡'
    label = 'Inferno'
    pulse = true
  } else if (streakCount >= 15) {
    emoji = '🔥🔥'
    label = 'Blaze'
  } else if (streakCount >= 7) {
    emoji = '🔥'
    label = 'Strong'
  } else {
    emoji = '🔥'
    label = 'Small'
  }

  return (
    <motion.div
      className="inline-flex items-center gap-1.5"
      animate={pulse ? { scale: [1, 1.15, 1] } : {}}
      transition={pulse ? { duration: 1.5, repeat: Infinity } : {}}
    >
      <span className="text-lg">{emoji}</span>
      <span className="text-sm font-bold text-orange-500">{streakCount}</span>
    </motion.div>
  )
}
