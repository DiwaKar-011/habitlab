'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import { getRandomQuote, getRandomRoast } from '@/lib/motivationQuotes'

const BUBBLE_INTERVAL_MIN = 3 * 60 * 1000    // min 3 minutes
const BUBBLE_INTERVAL_MAX = 8 * 60 * 1000    // max 8 minutes  
const BUBBLE_DISPLAY_TIME = 12000             // show for 12s

export default function MotivationBubble() {
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState('')
  const [isRoast, setIsRoast] = useState(false)

  useEffect(() => {
    // Show first bubble after a short delay
    const initialDelay = setTimeout(() => {
      showBubble()
    }, 30000) // 30s after page load

    return () => clearTimeout(initialDelay)
  }, [])

  useEffect(() => {
    if (!show) {
      // Schedule next bubble
      const delay = BUBBLE_INTERVAL_MIN + Math.random() * (BUBBLE_INTERVAL_MAX - BUBBLE_INTERVAL_MIN)
      const timer = setTimeout(() => {
        showBubble()
      }, delay)
      return () => clearTimeout(timer)
    } else {
      // Auto-hide after display time
      const timer = setTimeout(() => {
        setShow(false)
      }, BUBBLE_DISPLAY_TIME)
      return () => clearTimeout(timer)
    }
  }, [show])

  const showBubble = () => {
    // 70% motivation, 30% roast
    const useRoast = Math.random() < 0.3
    setIsRoast(useRoast)
    setMessage(useRoast ? getRandomRoast() : getRandomQuote())
    setShow(true)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 max-w-xs w-full shadow-2xl rounded-2xl p-4 border ${
            isRoast
              ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 border-red-200 dark:border-red-800'
              : 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800'
          }`}
        >
          <button
            onClick={() => setShow(false)}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                isRoast
                  ? 'bg-red-100 dark:bg-red-900/50'
                  : 'bg-purple-100 dark:bg-purple-900/50'
              }`}
            >
              {isRoast ? '🔥' : <Sparkles size={18} className="text-purple-500" />}
            </motion.div>
            <div>
              <p className={`text-xs font-bold mb-1 ${
                isRoast ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'
              }`}>
                {isRoast ? 'Reality Check 🔥' : 'Motivation Boost ✨'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
