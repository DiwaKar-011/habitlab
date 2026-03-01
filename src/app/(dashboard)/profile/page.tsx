'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User as UserIcon,
  Camera,
  Trophy,
  Flame,
  Zap,
  Target,
  Shield,
  Star,
  Award,
  TrendingUp,
  Calendar,
  Edit3,
  Check,
  X,
  ChevronRight,
  Crown,
  Medal,
  Clock,
  Eye,
  UserPlus,
  Users,
  ChevronDown,
  Trash2,
  BarChart3,
  Hash,
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import {
  getProfile,
  upsertProfile,
  updateProfilePic,
  getHabits,
  getAllLogs,
  getAllStreaks,
  getUserBadges,
  getAllBadges,
  checkAndAwardBadges,
  isUsernameTaken,
  getFriends,
  removeFriend,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  deleteUserAccount,
  getFriendStats,
  getUserRank,
  addFirestoreNotification,
} from '@/lib/db'
import {
  deleteUser,
  reauthenticateWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { calculateConsistency } from '@/lib/scoring'
import { assignPersonality } from '@/lib/profileEngine'
import type { User, Habit, DailyLog, Streak, Badge, UserBadge } from '@/types'

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Max',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Bella',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Nala',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Happy',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Chill',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Sunny',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Cool',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot3',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot4',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel1',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel2',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel3',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel4',
]

const BADGE_CATEGORY_COLORS: Record<string, string> = {
  streak: 'from-orange-400 to-red-500',
  fitness: 'from-green-400 to-emerald-600',
  study: 'from-blue-400 to-indigo-600',
  mindset: 'from-purple-400 to-violet-600',
  eco: 'from-teal-400 to-green-600',
  health: 'from-pink-400 to-rose-600',
  focus: 'from-amber-400 to-orange-600',
  special: 'from-yellow-400 to-amber-600',
  learning: 'from-cyan-400 to-blue-600',
  social: 'from-fuchsia-400 to-pink-600',
  xp: 'from-violet-400 to-purple-600',
}

const TIER_LABELS = ['', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
const TIER_COLORS = ['', 'text-amber-700', 'text-slate-400', 'text-yellow-500', 'text-cyan-400', 'text-blue-400']

export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [allBadges, setAllBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [editingUsername, setEditingUsername] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newBadges, setNewBadges] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [friends, setFriends] = useState<any[]>([])
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const nameRef = useRef<HTMLInputElement>(null)
  const [statsToast, setStatsToast] = useState<any>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [statsLoading, setStatsLoading] = useState<string | null>(null)
  const [friendRanks, setFriendRanks] = useState<Record<string, number>>({})
  const [expandedFriend, setExpandedFriend] = useState<string | null>(null)
  const [friendTab, setFriendTab] = useState<'friends' | 'requests'>('friends')

  useEffect(() => {
    if (authLoading) return
    if (!authUser) { setLoading(false); return }

    const load = async () => {
      try {
        const [p, h, l, s, ub, ab, fr, freqs] = await Promise.all([
          getProfile(authUser.id),
          getHabits(authUser.id),
          getAllLogs(authUser.id),
          getAllStreaks(authUser.id),
          getUserBadges(authUser.id),
          getAllBadges(),
          getFriends(authUser.id).catch(() => []),
          getFriendRequests(authUser.id).catch(() => []),
        ])
        setProfile(p)
        setHabits(h)
        setLogs(l)
        setStreaks(s)
        setUserBadges(ub)
        setAllBadges(ab)
        setFriends(fr)
        setFriendRequests(freqs)
        if (p) {
          setNameInput(p.name || '')
          setUsernameInput(p.username || '')
        }

        // Load ranks for all friends
        if (fr.length > 0) {
          const ranks: Record<string, number> = {}
          await Promise.all(
            fr.map(async (f: any) => {
              const fId = f.friend_profile?.id
              if (fId) {
                try {
                  const r = await getUserRank(fId)
                  ranks[fId] = r
                } catch {}
              }
            })
          )
          setFriendRanks(ranks)
        }

        // Check for new badges (also auto-seeds badge definitions)
        const awarded = await checkAndAwardBadges(authUser.id)
        // Always reload badges after check (ensures seeded badges appear)
        const [updatedUserBadges, updatedAllBadges] = await Promise.all([
          getUserBadges(authUser.id),
          getAllBadges(),
        ])
        setUserBadges(updatedUserBadges)
        setAllBadges(updatedAllBadges)
        if (awarded.length > 0) {
          setNewBadges(awarded)
        }
      } catch (err) {
        console.error('Profile load error:', err)
      }
      setLoading(false)
    }
    load()
  }, [authUser, authLoading])

  const handleAvatarChange = async (url: string) => {
    if (!authUser) return
    setSaving(true)
    try {
      await updateProfilePic(authUser.id, url)
      setProfile((p) => p ? { ...p, avatar_url: url } : p)
      setShowAvatarPicker(false)
    } catch (err) {
      console.error('Error updating profile pic:', err)
    }
    setSaving(false)
  }

  const handleNameSave = async () => {
    if (!authUser || !nameInput.trim()) return
    setSaving(true)
    try {
      await upsertProfile({ id: authUser.id, name: nameInput.trim() })
      setProfile((p) => p ? { ...p, name: nameInput.trim() } : p)
      setEditingName(false)
    } catch (err) {
      console.error('Error updating name:', err)
    }
    setSaving(false)
  }

  const handleUsernameSave = async () => {
    if (!authUser || !usernameInput.trim()) return
    const un = usernameInput.toLowerCase().trim()
    if (un.length < 3) { setUsernameError('Min 3 characters'); return }
    if (un.length > 20) { setUsernameError('Max 20 characters'); return }
    if (!/^[a-z0-9._]+$/.test(un)) { setUsernameError('Only lowercase letters, numbers, . and _ allowed'); return }
    if (/^[._]/.test(un) || /[._]$/.test(un)) { setUsernameError('Cannot start or end with . or _'); return }
    if (/[._]{2}/.test(un)) { setUsernameError('Cannot have consecutive . or _'); return }
    setCheckingUsername(true)
    try {
      const taken = await isUsernameTaken(un, authUser.id)
      if (taken) { setUsernameError('This username is already taken'); setCheckingUsername(false); return }
      await upsertProfile({ id: authUser.id, username: un })
      setProfile((p) => p ? { ...p, username: un } : p)
      setEditingUsername(false)
      setUsernameError('')
    } catch (err) {
      console.error('Error updating username:', err)
    }
    setCheckingUsername(false)
  }

  const handleAcceptFriend = async (fromUserId: string) => {
    if (!authUser) return
    try {
      await acceptFriendRequest(fromUserId, authUser.id)
      setFriendRequests((prev) => prev.filter((r: any) => r.from_user_id !== fromUserId))
      const updated = await getFriends(authUser.id).catch(() => [])
      setFriends(updated)
      // Load rank for new friend
      try {
        const rank = await getUserRank(fromUserId)
        setFriendRanks((prev) => ({ ...prev, [fromUserId]: rank }))
      } catch {}
      // Notify the sender that their request was accepted
      const acceptorName = profile?.name || profile?.username || 'Someone'
      await addFirestoreNotification(fromUserId, {
        type: 'friend',
        title: 'Friend Request Accepted',
        message: `${acceptorName} accepted your friend request!`,
      })
    } catch (err) { console.error(err) }
  }

  const handleRejectFriend = async (fromUserId: string) => {
    if (!authUser) return
    try {
      await rejectFriendRequest(fromUserId, authUser.id)
      setFriendRequests((prev) => prev.filter((r: any) => r.from_user_id !== fromUserId))
    } catch (err) { console.error(err) }
  }

  const handleRemoveFriend = async (friendId: string) => {
    if (!authUser) return
    try {
      await removeFriend(authUser.id, friendId)
      setFriends((prev) => prev.filter((f: any) => f.friend_profile?.id !== friendId))
    } catch (err) { console.error(err) }
  }

  const handleViewFriendStats = async (friendId: string) => {
    setStatsLoading(friendId)
    try {
      const [stats, rank] = await Promise.all([
        getFriendStats(friendId),
        getUserRank(friendId).catch(() => null),
      ])
      const toastData = { ...stats, rank }
      setStatsToast(toastData)
      setToastVisible(true)
      setTimeout(() => {
        setToastVisible(false)
        setTimeout(() => setStatsToast(null), 400)
      }, 8000)
    } catch (err) { console.error(err) }
    setStatsLoading(null)
  }

  const dismissStatsToast = () => {
    setToastVisible(false)
    setTimeout(() => setStatsToast(null), 400)
  }

  // Computed stats
  const completedLogs = logs.filter((l) => l.completed)
  const totalTasks = logs.length
  const overallConsistency = calculateConsistency(completedLogs.length, totalTasks)
  const maxStreak = Math.max(...streaks.map((s) => s.current_streak), 0)
  const longestStreak = Math.max(...streaks.map((s) => s.longest_streak), 0)
  const totalXP = profile?.xp_points || 0
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'

  // Personality
  const personality = habits.length > 0 ? assignPersonality(habits, logs, profile?.knowledge_score || 0) : null

  // Category breakdown
  const categoryStats: Record<string, { count: number; completed: number }> = {}
  for (const log of logs) {
    const habit = habits.find((h) => h.id === log.habit_id)
    if (habit) {
      if (!categoryStats[habit.category]) categoryStats[habit.category] = { count: 0, completed: 0 }
      categoryStats[habit.category].count++
      if (log.completed) categoryStats[habit.category].completed++
    }
  }

  // Level system
  const level = Math.floor(totalXP / 100) + 1
  const xpInLevel = totalXP % 100
  const xpToNext = 100 - xpInLevel

  // Badge grouping
  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badge_id))
  const badgesByCategory: Record<string, { badge: any; earned: boolean }[]> = {}
  for (const badge of allBadges) {
    const cat = (badge as any).category || 'special'
    if (!badgesByCategory[cat]) badgesByCategory[cat] = []
    badgesByCategory[cat].push({ badge, earned: earnedBadgeIds.has(badge.id) })
  }
  // Sort each category by tier
  for (const cat of Object.keys(badgesByCategory)) {
    badgesByCategory[cat].sort((a, b) => ((a.badge as any).tier || 0) - ((b.badge as any).tier || 0))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* New Badge Celebration */}
      <AnimatePresence>
        {newBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-2xl p-6 text-white text-center relative"
          >
            <button onClick={() => setNewBadges([])} className="absolute top-3 right-3">
              <X size={18} />
            </button>
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <Trophy className="mx-auto mb-2" size={48} />
            </motion.div>
            <h2 className="text-xl font-bold">New Badge{newBadges.length > 1 ? 's' : ''} Unlocked!</h2>
            <div className="flex items-center justify-center gap-3 mt-3">
              {newBadges.map((id) => {
                const badge = allBadges.find((b) => b.id === id)
                return badge ? (
                  <span key={id} className="text-3xl" title={badge.name}>
                    {badge.icon_url}
                  </span>
                ) : null
              })}
            </div>
            <p className="text-sm mt-2 opacity-90">
              {newBadges.map((id) => allBadges.find((b) => b.id === id)?.name).filter(Boolean).join(', ')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute bottom-1 right-4 text-white/70 text-xs">Level {level}</div>
        </div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-12 mb-4">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-lg">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-slate-400">
                    <UserIcon size={40} />
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="absolute bottom-0 right-0 w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-brand-700 transition-colors"
              >
                <Camera size={14} />
              </button>
            </div>
          </div>

          {/* Name & Personality */}
          <div className="mb-4">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  ref={nameRef}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="text-xl font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                />
                <button onClick={handleNameSave} disabled={saving} className="text-green-600 p-1"><Check size={18} /></button>
                <button onClick={() => setEditingName(false)} className="text-slate-400 p-1"><X size={18} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {profile?.name || authUser?.displayName || 'User'}
                </h1>
                <button onClick={() => { setEditingName(true); setNameInput(profile?.name || '') }} className="text-slate-400 hover:text-brand-600 transition-colors">
                  <Edit3 size={14} />
                </button>
              </div>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{profile?.email}</p>
            {/* Username — permanent, cannot be changed */}
            <div className="mt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-brand-600 dark:text-brand-400 font-medium">
                  @{profile?.username || 'not_set'}
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">permanent</span>
              </div>
            </div>
            {personality && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium px-3 py-1 rounded-full">
                <Star size={12} />
                {personality.type}
              </div>
            )}
          </div>

          {/* Level Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Level {level}</span>
              <span>{xpInLevel}/{100} XP to Level {level + 1}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpInLevel}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Zap, label: 'Total XP', value: totalXP.toLocaleString(), color: 'text-purple-500' },
              { icon: Flame, label: 'Current Streak', value: `🔥${maxStreak}`, color: 'text-orange-500' },
              { icon: Target, label: 'Consistency', value: `${overallConsistency}%`, color: 'text-green-500' },
              { icon: Award, label: 'Badges', value: userBadges.length, color: 'text-amber-500' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center"
              >
                <stat.icon size={20} className={`mx-auto mb-1 ${stat.color}`} />
                <p className="text-lg font-bold text-slate-800 dark:text-white">{stat.value}</p>
                <p className="text-[10px] text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Streak Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
        >
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
            <Flame size={18} className="text-orange-500" /> 🔥 Streak Overview
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Current Best</span>
              <span className="font-bold text-slate-800 dark:text-white">{maxStreak} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Longest Ever</span>
              <span className="font-bold text-slate-800 dark:text-white">{longestStreak} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Active Habits</span>
              <span className="font-bold text-slate-800 dark:text-white">{habits.filter((h) => h.is_active).length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Total Completions</span>
              <span className="font-bold text-slate-800 dark:text-white">{completedLogs.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Member Since</span>
              <span className="font-bold text-slate-800 dark:text-white">{memberSince}</span>
            </div>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
        >
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-blue-500" /> Category Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(categoryStats).map(([cat, stats]) => {
              const pct = stats.count > 0 ? Math.round((stats.completed / stats.count) * 100) : 0
              return (
                <div key={cat}>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="capitalize text-slate-600 dark:text-slate-300">{cat}</span>
                    <span className="text-xs text-slate-400">{stats.completed}/{stats.count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {Object.keys(categoryStats).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No habit data yet</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Personality Card */}
      {personality && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800 p-5"
        >
          <h3 className="font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-2 mb-2">
            <Crown size={18} /> Your Personality: {personality.type}
          </h3>
          <p className="text-sm text-purple-600 dark:text-purple-400">{personality.description}</p>
        </motion.div>
      )}

      {/* Badges Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
      >
        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
          <Medal size={18} className="text-amber-500" /> Badge Collection
          <span className="text-xs text-slate-400 ml-auto">{userBadges.length}/{allBadges.length} earned</span>
        </h3>

        {Object.keys(badgesByCategory).length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No badges available yet. Complete habits to earn badges!</p>
        ) : (
          <div className="space-y-5">
            {Object.entries(badgesByCategory).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 capitalize">{category}</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {items.map(({ badge, earned }) => (
                    <motion.div
                      key={badge.id}
                      whileHover={{ scale: 1.05 }}
                      className={`relative flex flex-col items-center p-3 rounded-xl border transition-all ${
                        earned
                          ? 'bg-gradient-to-b from-white to-amber-50 dark:from-slate-800 dark:to-amber-900/20 border-amber-200 dark:border-amber-800 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-50'
                      }`}
                    >
                      {/* Tier indicator */}
                      {(badge as any).tier && earned && (
                        <span className={`absolute top-1 right-1 text-[8px] font-bold ${TIER_COLORS[(badge as any).tier] || ''}`}>
                          {TIER_LABELS[(badge as any).tier] || ''}
                        </span>
                      )}
                      <span className={`text-2xl mb-1 ${earned ? '' : 'grayscale'}`}>
                        {badge.icon_url || '🏅'}
                      </span>
                      <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">
                        {badge.name}
                      </p>
                      <p className="text-[8px] text-slate-400 text-center mt-0.5 leading-tight">
                        {badge.description}
                      </p>
                      {earned && (
                        <span className="mt-1 text-[8px] text-green-600 font-medium flex items-center gap-0.5">
                          <Check size={8} /> Earned
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ══════ FRIENDS SECTION ══════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Header with tabs */}
        <div className="flex items-center border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setFriendTab('friends')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all ${
              friendTab === 'friends'
                ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Users size={16} />
            Friends
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{friends.length}</span>
          </button>
          <button
            onClick={() => setFriendTab('requests')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all ${
              friendTab === 'requests'
                ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <UserPlus size={16} />
            Requests
            {friendRequests.length > 0 && (
              <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">{friendRequests.length}</span>
            )}
          </button>
        </div>

        <div className="p-5">
          {/* ── FRIENDS TAB ── */}
          {friendTab === 'friends' && (
            <>
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No friends yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Search for users by username on the Leaderboard page to add friends!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((f: any) => {
                    const fId = f.friend_profile?.id
                    const rank = fId ? friendRanks[fId] : null
                    const isExpanded = expandedFriend === fId
                    return (
                      <div key={f.id} className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all">
                        {/* Friend row — clickable */}
                        <button
                          onClick={() => setExpandedFriend(isExpanded ? null : fId)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left"
                        >
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0 ring-2 ring-slate-100 dark:ring-slate-800">
                            {f.friend_profile?.avatar_url ? (
                              <img src={f.friend_profile.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-500">
                                {(f.friend_profile?.name || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Name + username */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {f.friend_profile?.name || 'Unknown'}
                            </p>
                            {f.friend_profile?.username && (
                              <p className="text-xs text-brand-500 dark:text-brand-400">@{f.friend_profile.username}</p>
                            )}
                          </div>

                          {/* Rank badge */}
                          {rank && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                              rank <= 3
                                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                                : rank <= 10
                                  ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}>
                              <Hash size={10} />
                              {rank}
                            </div>
                          )}

                          {/* XP */}
                          <span className="text-xs text-slate-400 font-medium hidden sm:inline">⚡ {f.friend_profile?.xp_points || 0} XP</span>

                          {/* Expand arrow */}
                          <ChevronDown
                            size={16}
                            className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {/* Expanded actions */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                {/* Quick stats row */}
                                <div className="w-full flex items-center gap-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                                  <span className="flex items-center gap-1"><Trophy size={12} className="text-amber-500" /> Rank #{rank || '—'}</span>
                                  <span className="flex items-center gap-1"><Zap size={12} className="text-purple-500" /> {f.friend_profile?.xp_points || 0} XP</span>
                                  <span className="flex items-center gap-1"><TrendingUp size={12} className="text-blue-500" /> Lv.{Math.floor((f.friend_profile?.xp_points || 0) / 100) + 1}</span>
                                </div>

                                {/* Action buttons */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleViewFriendStats(fId) }}
                                  disabled={statsLoading === fId}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                                >
                                  <BarChart3 size={13} />
                                  {statsLoading === fId ? 'Loading...' : 'View Full Stats'}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRemoveFriend(fId) }}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg transition"
                                >
                                  <Trash2 size={13} />
                                  Remove Friend
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ── REQUESTS TAB ── */}
          {friendTab === 'requests' && (
            <>
              {friendRequests.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No pending requests</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">When someone sends you a friend request, it will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friendRequests.map((req: any) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-brand-50/60 to-purple-50/60 dark:from-brand-950/20 dark:to-purple-950/20 border border-brand-100 dark:border-brand-900/30"
                    >
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0 ring-2 ring-brand-200 dark:ring-brand-800">
                        {req.from_profile?.avatar_url ? (
                          <img src={req.from_profile.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-500">
                            {(req.from_profile?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {req.from_profile?.name || 'Unknown'}
                        </p>
                        {req.from_profile?.username && (
                          <p className="text-xs text-brand-500 dark:text-brand-400">@{req.from_profile.username}</p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5">wants to be your friend</p>
                      </div>

                      {/* Accept / Decline */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptFriend(req.from_user_id)}
                          className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
                        >
                          <Check size={13} />
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectFriend(req.from_user_id)}
                          className="flex items-center gap-1 px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg transition"
                        >
                          <X size={13} />
                          Decline
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Danger Zone - Delete Account */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900 p-5"
      >
        <h3 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
          <Shield size={18} /> Danger Zone
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            Delete My Account
          </button>
        ) : (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              Are you sure? Type <span className="font-bold">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder='Type "DELETE" here'
              className="w-full px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (deleteInput !== 'DELETE' || !authUser) return
                  setDeleting(true)
                  try {
                    const currentUser = auth.currentUser
                    if (!currentUser) throw new Error('Not signed in')

                    // Re-authenticate before deletion (Firebase requires recent auth)
                    const providerIds = currentUser.providerData.map(p => p.providerId)
                    try {
                      if (providerIds.includes('google.com')) {
                        await reauthenticateWithPopup(currentUser, new GoogleAuthProvider())
                      } else if (providerIds.includes('github.com')) {
                        await reauthenticateWithPopup(currentUser, new GithubAuthProvider())
                      } else if (providerIds.includes('password') && currentUser.email) {
                        const pw = prompt('Please enter your password to confirm account deletion:')
                        if (!pw) { setDeleting(false); return }
                        const credential = EmailAuthProvider.credential(currentUser.email, pw)
                        await reauthenticateWithCredential(currentUser, credential)
                      }
                    } catch (reauthErr: any) {
                      console.error('Re-auth error:', reauthErr)
                      if (reauthErr?.code === 'auth/popup-closed-by-user') {
                        alert('Sign-in popup was closed. Please try again.')
                        setDeleting(false)
                        return
                      }
                      // If re-auth fails for other reasons, still try deletion
                    }

                    // Delete all Firestore data
                    await deleteUserAccount(authUser.id)

                    // Delete Firebase Auth user
                    await deleteUser(currentUser)

                    // Clear cookies and redirect
                    document.cookie = 'firebaseAuthToken=; path=/; max-age=0'
                    document.cookie = 'habitlab_guest=; path=/; max-age=0'
                    localStorage.clear()
                    window.location.href = '/signin'
                  } catch (err: any) {
                    console.error('Delete account error:', err)
                    if (err?.code === 'auth/requires-recent-login') {
                      alert('Session expired. Please sign out, sign back in, and try deleting again immediately.')
                    } else {
                      alert('Failed to delete account: ' + (err?.message || 'Unknown error'))
                    }
                  }
                  setDeleting(false)
                }}
                disabled={deleteInput !== 'DELETE' || deleting}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Avatar Picker Modal */}
      <AnimatePresence>
        {showAvatarPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAvatarPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Choose Your Avatar</h3>
                <button onClick={() => setShowAvatarPicker(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {AVATAR_OPTIONS.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => handleAvatarChange(url)}
                    disabled={saving}
                    className={`w-full aspect-square rounded-xl border-2 overflow-hidden hover:border-brand-500 transition-all hover:scale-105 ${
                      profile?.avatar_url === url ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-400 text-center">Or paste a custom avatar URL:</p>
                <div className="flex gap-2 mt-2">
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.png"
                    className="flex-1 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value
                        if (val.startsWith('http')) handleAvatarChange(val)
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = (e.currentTarget.previousElementSibling as HTMLInputElement)
                      if (input.value.startsWith('http')) handleAvatarChange(input.value)
                    }}
                    className="bg-brand-600 text-white text-sm px-4 rounded-lg hover:bg-brand-700"
                  >
                    Set
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friend Stats Toast */}
      <AnimatePresence>
        {statsToast && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={toastVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
                {statsToast.profile?.avatar_url ? (
                  <img src={statsToast.profile.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
                    {(statsToast.profile?.name || 'U').charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{statsToast.profile?.name || 'Friend'}</p>
                {statsToast.profile?.username && <p className="text-white/70 text-xs">@{statsToast.profile.username}</p>}
              </div>
              <button onClick={dismissStatsToast} className="text-white/60 hover:text-white transition p-1">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-purple-600">{statsToast.profile?.xp_points || 0}</p>
                  <p className="text-[10px] text-slate-500">XP</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-blue-600">Lv.{Math.floor((statsToast.profile?.xp_points || 0) / 100) + 1}</p>
                  <p className="text-[10px] text-slate-500">Level</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-orange-600">{statsToast.habits?.length || 0}</p>
                  <p className="text-[10px] text-slate-500">Habits</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-green-600">#{statsToast.rank || '—'}</p>
                  <p className="text-[10px] text-slate-500">Rank</p>
                </div>
              </div>
              {statsToast.streaks?.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-orange-500">🔥</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Best streak: 🔥{Math.max(...(statsToast.streaks || []).map((s: any) => s.current_streak || 0), 0)} days
                  </span>
                </div>
              )}
              {statsToast.badges?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Badges ({statsToast.badges.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {statsToast.badges.slice(0, 8).map((b: any) => (
                      <div key={b.id} className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-2 py-1 text-center" title={b.badge?.name}>
                        <span className="text-sm">{b.badge?.icon_url || '🏅'}</span>
                        <p className="text-[8px] text-slate-500 truncate max-w-[50px]">{b.badge?.name}</p>
                      </div>
                    ))}
                    {statsToast.badges.length > 8 && <div className="flex items-center text-[10px] text-slate-400 px-1">+{statsToast.badges.length - 8} more</div>}
                  </div>
                </div>
              )}
              {statsToast.habits?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Habits</p>
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                    {statsToast.habits.map((h: any) => {
                      const hLogs = (statsToast.logs || []).filter((l: any) => l.habit_id === h.id)
                      const completed = hLogs.filter((l: any) => l.completed).length
                      const pct = hLogs.length > 0 ? Math.round((completed / hLogs.length) * 100) : 0
                      const streak = (statsToast.streaks || []).find((s: any) => s.habit_id === h.id)
                      return (
                        <div key={h.id} className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate w-20">{h.title}</span>
                          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-500 w-8 text-right">{pct}%</span>
                          <span className="text-[10px] text-orange-400 w-8 text-right">🔥{streak?.current_streak || 0}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <motion.div initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 8, ease: 'linear' }} className="h-1 bg-gradient-to-r from-brand-500 to-accent-500 origin-left" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
