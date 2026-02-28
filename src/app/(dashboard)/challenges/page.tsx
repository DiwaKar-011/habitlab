'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords, Plus, Users, Calendar, Trophy, CheckCircle2,
  Sparkles, LogOut, Loader2, Zap, Target, X, Clock,
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import GuestGuard from '@/components/GuestGuard'
import type { Challenge, ChallengeParticipant } from '@/types'

/* ── localStorage helpers ─────────────────────────────────── */
const LS_CHALLENGES = 'habitlab_challenges'
const LS_PARTICIPATIONS = 'habitlab_participations'

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function writeLS<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

/* ── Curated AI challenge pool ────────────────────────────── */
const AI_POOL: Omit<Challenge, 'id' | 'creator_id' | 'created_at'>[] = [
  {
    title: '7-Day Morning Stretch Challenge',
    description: 'Start each morning with a 10-minute stretch routine to boost flexibility and energy.',
    category: 'fitness', duration_days: 7, is_public: true, is_ai_generated: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: addDays(new Date(), 7),
  },
  {
    title: '5-Day Focus Sprint',
    description: 'Dedicate 90 uninterrupted minutes to deep work each day. No phone, no social media.',
    category: 'focus', duration_days: 5, is_public: true, is_ai_generated: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: addDays(new Date(), 5),
  },
  {
    title: '7-Day Gratitude Journal',
    description: 'Write 3 things you are grateful for every night. Research shows it improves mood and sleep.',
    category: 'mindset', duration_days: 7, is_public: true, is_ai_generated: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: addDays(new Date(), 7),
  },
  {
    title: '3-Day Digital Detox',
    description: 'Limit screen time to essential use only. Replace scrolling with reading or walking.',
    category: 'health', duration_days: 3, is_public: true, is_ai_generated: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: addDays(new Date(), 3),
  },
  {
    title: '7-Day Eco Warrior',
    description: 'Zero single-use plastic for a full week. Bring your own bags, bottles, and containers.',
    category: 'eco', duration_days: 7, is_public: true, is_ai_generated: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: addDays(new Date(), 7),
  },
  {
    title: '5-Day Study Power-Up',
    description: 'Use the Pomodoro technique for at least 4 cycles each day. Track your focus scores.',
    category: 'study', duration_days: 5, is_public: true, is_ai_generated: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: addDays(new Date(), 5),
  },
  {
    title: '10-Day Step Count Challenge',
    description: 'Walk at least 8,000 steps every day. Use your phone or watch to track progress.',
    category: 'fitness', duration_days: 10, is_public: true, is_ai_generated: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: addDays(new Date(), 10),
  },
  {
    title: '7-Day Meditation Streak',
    description: 'Meditate for at least 10 minutes each day using any app or technique you prefer.',
    category: 'mindset', duration_days: 7, is_public: true, is_ai_generated: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: addDays(new Date(), 7),
  },
  {
    title: '5-Day Hydration Challenge',
    description: 'Drink at least 8 glasses (2L) of water each day. Track every glass!',
    category: 'health', duration_days: 5, is_public: true, is_ai_generated: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: addDays(new Date(), 5),
  },
]

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r.toISOString().split('T')[0]
}

/* ── Category badges ──────────────────────────────────────── */
const categoryBadge: Record<string, { icon: string; color: string }> = {
  fitness: { icon: '🏃', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  focus:   { icon: '🎯', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  eco:     { icon: '🌱', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  study:   { icon: '📚', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  health:  { icon: '❤️', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  mindset: { icon: '🧠', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
}

type Tab = 'all' | 'joined' | 'ai'

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
export default function ChallengesPage() {
  return (
    <GuestGuard feature="Challenges">
      <ChallengesContent />
    </GuestGuard>
  )
}

function ChallengesContent() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [participations, setParticipations] = useState<ChallengeParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [generatingAI, setGeneratingAI] = useState(false)
  const seededRef = useRef(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formCategory, setFormCategory] = useState('fitness')
  const [formDuration, setFormDuration] = useState(7)

  const userId = user?.id

  /* ── persist whenever state changes ───────────────────── */
  useEffect(() => {
    if (!loading) writeLS(LS_CHALLENGES, challenges)
  }, [challenges, loading])

  useEffect(() => {
    if (!loading) writeLS(LS_PARTICIPATIONS, participations)
  }, [participations, loading])

  /* ── load on mount ────────────────────────────────────── */
  const loadData = useCallback(() => {
    setLoading(true)
    const stored = readLS<Challenge[]>(LS_CHALLENGES, [])
    const storedP = readLS<ChallengeParticipant[]>(LS_PARTICIPATIONS, [])
    setChallenges(stored)
    setParticipations(userId ? storedP.filter(p => p.user_id === userId) : [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadData()
  }, [loadData])

  /* ── Seed initial AI challenges if store is empty ──── */
  useEffect(() => {
    if (loading || seededRef.current) return
    if (challenges.length === 0) {
      seededRef.current = true
      seedInitialChallenges()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, challenges.length])

  function seedInitialChallenges() {
    const shuffled = [...AI_POOL].sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, 4)
    const now = new Date().toISOString()
    const newChallenges: Challenge[] = picked.map(c => ({
      ...c,
      id: uid(),
      creator_id: 'ai-system',
      created_at: now,
    }))
    setChallenges(newChallenges)
  }

  /* ── Generate more AI challenges ──────────────────────── */
  const generateDailyChallenges = () => {
    setGeneratingAI(true)
    // Pick 3 random ones not already in the list
    const existingTitles = new Set(challenges.map(c => c.title))
    const pool = AI_POOL.filter(c => !existingTitles.has(c.title))
    const source = pool.length >= 3 ? pool : AI_POOL
    const shuffled = [...source].sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, 3)
    const now = new Date().toISOString()
    const newOnes: Challenge[] = picked.map(c => ({
      ...c,
      id: uid(),
      creator_id: 'ai-system',
      created_at: now,
    }))
    setChallenges(prev => [...newOnes, ...prev])
    setTimeout(() => setGeneratingAI(false), 600) // brief animation
  }

  /* ── computed ──────────────────────────────────────────── */
  const today = new Date().toISOString().split('T')[0]

  const participantCounts: Record<string, number> = {}
  participations.forEach(p => {
    participantCounts[p.challenge_id] = (participantCounts[p.challenge_id] || 0) + 1
  })

  const isJoined = (cid: string) => participations.some(p => p.challenge_id === cid)
  const getMyP = (cid: string) => participations.find(p => p.challenge_id === cid)

  const joinedIds = new Set(participations.map(p => p.challenge_id))
  const filteredChallenges = challenges.filter(c => {
    if (tab === 'joined') return joinedIds.has(c.id)
    if (tab === 'ai') return c.is_ai_generated
    return true
  })

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  /* ── actions ──────────────────────────────────────────── */
  const handleJoin = (challengeId: string) => {
    if (!userId) return
    setActionLoading(challengeId)
    const newP: ChallengeParticipant = {
      id: uid(),
      challenge_id: challengeId,
      user_id: userId,
      joined_at: new Date().toISOString(),
      completed_days: 0,
    }
    setParticipations(prev => [...prev, newP])
    setTimeout(() => setActionLoading(null), 300)
  }

  const handleLeave = (challengeId: string) => {
    if (!userId) return
    setActionLoading(challengeId)
    setParticipations(prev => prev.filter(p => p.challenge_id !== challengeId))
    setTimeout(() => setActionLoading(null), 300)
  }

  const handleCheckIn = (challengeId: string) => {
    if (!userId) return
    setActionLoading(`checkin-${challengeId}`)
    setParticipations(prev =>
      prev.map(p => {
        if (p.challenge_id === challengeId && p.user_id === userId && p.last_check_in !== today) {
          return { ...p, completed_days: (p.completed_days || 0) + 1, last_check_in: today }
        }
        return p
      })
    )
    setTimeout(() => setActionLoading(null), 300)
  }

  const handleCreate = () => {
    if (!userId || !formTitle.trim()) return
    setActionLoading('create')
    const startDate = new Date().toISOString().split('T')[0]
    const newCh: Challenge = {
      id: uid(),
      title: formTitle.trim(),
      description: formDesc.trim() || undefined,
      creator_id: userId,
      category: formCategory,
      duration_days: formDuration,
      is_public: true,
      is_ai_generated: false,
      start_date: startDate,
      end_date: addDays(new Date(), formDuration),
      created_at: new Date().toISOString(),
    }
    setChallenges(prev => [newCh, ...prev])
    setShowCreate(false)
    setFormTitle('')
    setFormDesc('')
    setFormCategory('fitness')
    setFormDuration(7)
    setTimeout(() => setActionLoading(null), 300)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Swords size={24} className="text-brand-600" />
            Challenges
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Compete with others to build better habits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateDailyChallenges}
            disabled={generatingAI}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            {generatingAI ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generatingAI ? 'Generating...' : 'AI Challenges'}
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-all"
          >
            <Plus size={16} />
            Create
          </button>
        </div>
      </div>

      {/* Stats Banner */}
      {participations.length > 0 && (
        <div className="bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-950/30 dark:to-accent-950/30 rounded-xl border border-brand-200 dark:border-brand-800 p-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Active Challenges</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{participations.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-brand-500" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Check-ins</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {participations.reduce((sum, p) => sum + (p.completed_days || 0), 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target size={20} className="text-green-500" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Checked In Today</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {participations.filter(p => p.last_check_in === today).length} / {participations.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'all', label: 'All Challenges', icon: Swords },
          { key: 'joined', label: 'My Challenges', icon: Trophy },
          { key: 'ai', label: 'AI Generated', icon: Sparkles },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              tab === key
                ? 'bg-brand-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Create Form Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Challenge</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    placeholder="e.g. 7-Day Morning Run"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
                    placeholder="What's this challenge about?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    >
                      <option value="fitness">🏃 Fitness</option>
                      <option value="study">📚 Study</option>
                      <option value="focus">🎯 Focus</option>
                      <option value="eco">🌱 Eco</option>
                      <option value="health">❤️ Health</option>
                      <option value="mindset">🧠 Mindset</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (days)</label>
                    <select
                      value={formDuration}
                      onChange={e => setFormDuration(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    >
                      <option value={3}>3 days</option>
                      <option value={5}>5 days</option>
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={21}>21 days</option>
                      <option value={30}>30 days</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={actionLoading === 'create' || !formTitle.trim()}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading === 'create' ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Create Challenge
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-brand-600" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredChallenges.length === 0 && (
        <div className="text-center py-12">
          <Swords size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
            {tab === 'joined' ? "You haven't joined any challenges yet" : 'No challenges found'}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {tab === 'joined' ? 'Browse all challenges and join one!' : 'Click "AI Challenges" to generate new ones'}
          </p>
        </div>
      )}

      {/* Challenge Cards */}
      {!loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChallenges.map((challenge, i) => {
            const joined = isJoined(challenge.id)
            const participation = getMyP(challenge.id)
            const checkedInToday = participation?.last_check_in === today
            const daysLeft = getDaysRemaining(challenge.end_date)
            const progress = participation
              ? Math.min(100, (participation.completed_days / challenge.duration_days) * 100)
              : 0
            const cat = categoryBadge[challenge.category || ''] || categoryBadge.mindset
            const isButtonLoading = actionLoading === challenge.id || actionLoading === `checkin-${challenge.id}`

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white dark:bg-slate-900 rounded-xl overflow-hidden hover:shadow-md transition-all ${
                  joined
                    ? 'border-2 border-brand-400 dark:border-brand-500 ring-1 ring-brand-200 dark:ring-brand-800'
                    : 'border border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{cat.icon}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cat.color}`}>
                        {challenge.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {challenge.is_ai_generated && (
                        <span className="text-[10px] bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Sparkles size={9} />
                          AI
                        </span>
                      )}
                      {challenge.is_public && (
                        <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                          Public
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{challenge.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                    {challenge.description || 'No description provided.'}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {participantCounts[challenge.id] || 0} joined
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {challenge.duration_days}d
                    </span>
                    {daysLeft !== null && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {daysLeft > 0 ? `${daysLeft}d left` : 'Ended'}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar (if joined) */}
                  {joined && participation && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          Progress: {participation.completed_days}/{challenge.duration_days} days
                        </span>
                        <span className="text-brand-600 dark:text-brand-400 font-bold">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            progress >= 100
                              ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                              : 'bg-gradient-to-r from-brand-500 to-accent-500'
                          }`}
                        />
                      </div>
                      {progress >= 100 && (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1 flex items-center gap-1">
                          <Trophy size={12} /> Challenge completed!
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!joined ? (
                    <button
                      onClick={() => handleJoin(challenge.id)}
                      disabled={!!isButtonLoading}
                      className="w-full py-2.5 rounded-lg text-sm font-medium transition-all bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {actionLoading === challenge.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Swords size={14} />
                      )}
                      Join Challenge
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCheckIn(challenge.id)}
                        disabled={checkedInToday || !!isButtonLoading}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          checkedInToday
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                            : 'bg-brand-600 text-white hover:bg-brand-700'
                        } disabled:opacity-70`}
                      >
                        {actionLoading === `checkin-${challenge.id}` ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : checkedInToday ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <Zap size={14} />
                        )}
                        {checkedInToday ? 'Checked In ✓' : 'Check In Today'}
                      </button>
                      <button
                        onClick={() => handleLeave(challenge.id)}
                        disabled={!!isButtonLoading}
                        className="px-3 py-2.5 rounded-lg text-sm font-medium transition-all bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700"
                        title="Leave challenge"
                      >
                        <LogOut size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
