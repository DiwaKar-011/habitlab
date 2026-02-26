'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle } from 'lucide-react'

interface VideoModalProps {
  youtubeId: string
  title: string
  isOpen: boolean
  onClose: () => void
  onWatched?: () => void
}

export default function VideoModal({
  youtubeId,
  title,
  isOpen,
  onClose,
  onWatched,
}: VideoModalProps) {
  const [canMarkWatched, setCanMarkWatched] = useState(false)
  const [marked, setMarked] = useState(false)

  // In production, use YouTube IFrame API to detect video end
  // For demo, enable button after 5 seconds
  if (isOpen && !canMarkWatched) {
    setTimeout(() => setCanMarkWatched(true), 5000)
  }

  const handleMarkWatched = () => {
    setMarked(true)
    onWatched?.()
    setTimeout(() => {
      onClose()
      setCanMarkWatched(false)
      setMarked(false)
    }, 1500)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Video */}
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Footer */}
            <div className="p-4 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {canMarkWatched
                  ? 'Ready to mark as watched!'
                  : 'Watch the video to unlock the button...'}
              </p>
              {marked ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 text-green-600 font-medium text-sm"
                >
                  <CheckCircle size={18} />
                  Watched! +15 XP
                </motion.div>
              ) : (
                <button
                  onClick={handleMarkWatched}
                  disabled={!canMarkWatched}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-30 hover:bg-brand-700 transition-all"
                >
                  Mark as Watched
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
