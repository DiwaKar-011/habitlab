'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Swords, Plus, Users, Calendar, Trophy } from 'lucide-react'

const mockChallenges = [
  {
    id: '1',
    title: '21-Day Fitness Sprint',
    category: 'fitness',
    duration_days: 21,
    participants: 45,
    is_public: true,
    start_date: '2026-02-10',
    description: 'Complete a fitness habit every day for 21 days straight.',
  },
  {
    id: '2',
    title: 'Week of Focus',
    category: 'focus',
    duration_days: 7,
    participants: 28,
    is_public: true,
    start_date: '2026-02-20',
    description: 'Zero distractions during study time for 7 consecutive days.',
  },
  {
    id: '3',
    title: 'Eco Challenge March',
    category: 'eco',
    duration_days: 30,
    participants: 62,
    is_public: true,
    start_date: '2026-03-01',
    description: 'Reduce plastic use and practice eco-friendly habits for a full month.',
  },
]

const categoryBadge: Record<string, string> = {
  fitness: '💪',
  focus: '🎯',
  eco: '🌱',
  study: '📚',
  health: '❤️',
  mindset: '🧠',
}

export default function ChallengesPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [joined, setJoined] = useState<string[]>([])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Challenges</h1>
          <p className="text-slate-500 text-sm mt-1">
            Compete with others to build better habits
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-all"
        >
          <Plus size={16} />
          Create Challenge
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-4">New Challenge</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                placeholder="Challenge name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
                <option>Fitness</option>
                <option>Study</option>
                <option>Focus</option>
                <option>Eco</option>
                <option>Health</option>
                <option>Mindset</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
                <option>7 days</option>
                <option>14 days</option>
                <option>21 days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Visibility</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
                <option>Public</option>
                <option>Private</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(false)}
            className="mt-4 bg-brand-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-all"
          >
            Create Challenge
          </button>
        </motion.div>
      )}

      {/* Challenge Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockChallenges.map((challenge, i) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{categoryBadge[challenge.category] || '🎯'}</span>
              {challenge.is_public && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Public
                </span>
              )}
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">{challenge.title}</h3>
            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{challenge.description}</p>
            <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
              <span className="flex items-center gap-1">
                <Users size={12} />
                {challenge.participants} joined
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {challenge.duration_days} days
              </span>
            </div>
            <button
              onClick={() => {
                if (!joined.includes(challenge.id)) {
                  setJoined([...joined, challenge.id])
                }
              }}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                joined.includes(challenge.id)
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              {joined.includes(challenge.id) ? '✅ Joined!' : 'Join Challenge'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
