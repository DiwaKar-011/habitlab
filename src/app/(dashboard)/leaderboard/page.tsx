'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Users, UserPlus, Search, X, Eye, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { getLeaderboard, getFriends, sendFriendRequest, getFriendStats, searchUsers, getUserRank, getTotalUserCount } from '@/lib/db'
import type { User } from '@/types'

const rankLabels = ['🥇', '🥈', '🥉']

interface LeaderboardUser {
  id: string
  name: string
  username?: string
  avatar_url?: string
  xp_points: number
  score: number
  isCurrentUser: boolean
  isFriend: boolean
}

export default function LeaderboardPage() {
  const { user, isGuest } = useAuth()
  const [tab, setTab] = useState<'global' | 'friends'>('global')
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set())
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [addingFriend, setAddingFriend] = useState<string | null>(null)
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())
  const [viewingStats, setViewingStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsToast, setStatsToast] = useState<any>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [totalUsers, setTotalUsers] = useState<number>(0)

  useEffect(() => {
    if (!user || isGuest) { setLoading(false); return }
    loadData()
  }, [user, isGuest])

  const loadData = async () => {
    if (!user) return
    try {
      const [rawLeaderboard, friends, rank, count] = await Promise.all([
        getLeaderboard(100),
        getFriends(user.id).catch(() => []),
        getUserRank(user.id).catch(() => null),
        getTotalUserCount().catch(() => 0),
      ])
      setMyRank(rank)
      setTotalUsers(count)
      const fIds = new Set(friends.map((f: any) => f.friend_profile?.id).filter(Boolean))
      setFriendIds(fIds)
      const mapped: LeaderboardUser[] = (rawLeaderboard as any[]).map((u) => ({
        id: u.id,
        name: u.name || u.email?.split('@')[0] || 'Anonymous',
        username: u.username,
        avatar_url: u.avatar_url,
        xp_points: u.xp_points || 0,
        score: u.xp_points || 0,
        isCurrentUser: u.id === user.id,
        isFriend: fIds.has(u.id),
      }))
      // Ensure current user is always in the list
      if (!mapped.some(u => u.isCurrentUser)) {
        mapped.push({
          id: user.id,
          name: user.displayName || user.email?.split('@')[0] || 'You',
          avatar_url: user.photoURL || undefined,
          xp_points: 0,
          score: 0,
          isCurrentUser: true,
          isFriend: false,
        })
      }
      setLeaderboard(mapped)
      setFriendsLeaderboard(mapped.filter((u) => u.isFriend || u.isCurrentUser).sort((a, b) => b.score - a.score))
    } catch (err) {
      console.error('Leaderboard load error:', err)
    }
    setLoading(false)
  }

  const handleSearch = async () => {
    if (!user || !searchTerm.trim()) return
    setSearchLoading(true)
    try {
      const results = await searchUsers(searchTerm.trim(), user.id)
      setSearchResults(results)
    } catch (err) { console.error(err) }
    setSearchLoading(false)
  }

  const handleAddFriend = async (targetId: string) => {
    if (!user) return
    setAddingFriend(targetId)
    try {
      await sendFriendRequest(user.id, targetId)
      setSentRequests((prev) => { const next = new Set(Array.from(prev)); next.add(targetId); return next })
    } catch (err) { console.error(err) }
    setAddingFriend(null)
  }

  const handleViewStats = async (userId: string) => {
    setStatsLoading(true)
    try {
      const [stats, rank] = await Promise.all([
        getFriendStats(userId),
        getUserRank(userId).catch(() => null),
      ])
      const toastData = { ...stats, rank }
      setStatsToast(toastData)
      setToastVisible(true)
      // Auto-dismiss after 8 seconds
      setTimeout(() => {
        setToastVisible(false)
        setTimeout(() => setStatsToast(null), 400)
      }, 8000)
    } catch (err) { console.error(err) }
    setStatsLoading(false)
  }

  const dismissToast = () => {
    setToastVisible(false)
    setTimeout(() => setStatsToast(null), 400)
  }

  const currentList = tab === 'global' ? leaderboard : friendsLeaderboard

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leaderboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">See how you rank among other habit scientists</p>
        </div>
        {!isGuest && (
          <button onClick={() => setShowSearch(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition">
            <UserPlus size={16} /> Add Friend
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {([{ value: 'global' as const, label: 'Global', icon: Trophy }, { value: 'friends' as const, label: 'Friends', icon: Users }]).map((t) => (
          <button key={t.value} onClick={() => setTab(t.value)} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${tab === t.value ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Your Position Banner */}
      {!isGuest && myRank !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-brand-600 to-accent-600 rounded-xl p-5 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                #{myRank}
              </div>
              <div>
                <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Your Global Rank</p>
                <p className="text-2xl font-bold">
                  {myRank <= 3 ? rankLabels[myRank - 1] : `#${myRank}`} out of {totalUsers} {totalUsers === 1 ? 'user' : 'users'}
                </p>
                <p className="text-white/70 text-xs mt-0.5">
                  {myRank === 1 ? '👑 You\'re #1! Keep it up!' : myRank <= 3 ? '🌟 Top 3! Amazing!' : myRank <= 10 ? '💪 Top 10! Great work!' : '🚀 Keep logging habits to climb the ranks!'}
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-3xl font-bold">⚡ {leaderboard.find(u => u.isCurrentUser)?.xp_points || 0} XP</p>
              <p className="text-white/70 text-xs">Total XP</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Top 3 */}
      {currentList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {currentList.slice(0, 3).map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`bg-white dark:bg-slate-900 rounded-xl border p-5 text-center ${u.isCurrentUser ? 'border-brand-300 dark:border-brand-700 ring-2 ring-brand-100 dark:ring-brand-900' : 'border-slate-200 dark:border-slate-800'}`}>
              <span className="text-3xl font-bold">{rankLabels[i]}</span>
              <div className="w-12 h-12 rounded-full mx-auto mt-2 overflow-hidden">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-500">{u.name.charAt(0).toUpperCase()}</div>
                )}
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 mt-2 text-sm">{u.name}</p>
              {u.username && <p className="text-xs text-brand-500 dark:text-brand-400">@{u.username}</p>}
              {u.isCurrentUser && <span className="text-[10px] bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 px-1.5 py-0.5 rounded-full">You</span>}
              <p className="text-xl font-bold text-brand-600 dark:text-brand-400 mt-1">{u.score}</p>
              <p className="text-xs text-slate-400">XP Points</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                {u.isFriend && !u.isCurrentUser && (
                  <button onClick={() => handleViewStats(u.id)} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"><Eye size={12} /> Stats</button>
                )}
                {!u.isFriend && !u.isCurrentUser && !isGuest && (
                  <button onClick={() => handleAddFriend(u.id)} disabled={sentRequests.has(u.id)} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 disabled:opacity-50">
                    <UserPlus size={12} /> {sentRequests.has(u.id) ? 'Sent' : 'Add'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Full List */}
      {currentList.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                <th className="text-left py-3 px-4">Rank</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-right py-3 px-4">XP</th>
                <th className="text-right py-3 px-4 hidden sm:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentList.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.02 }} className={`border-b border-slate-50 dark:border-slate-800 ${u.isCurrentUser ? 'bg-brand-50 dark:bg-brand-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                  <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">{rankLabels[i] || `#${i + 1}`}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                        {u.avatar_url ? <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">{u.name.charAt(0).toUpperCase()}</div>}
                      </div>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {u.name}
                        {u.username && <span className="ml-1 text-xs text-brand-500 dark:text-brand-400">@{u.username}</span>}
                        {u.isCurrentUser && <span className="ml-1 text-[10px] bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 px-1.5 py-0.5 rounded-full">You</span>}
                        {u.isFriend && !u.isCurrentUser && <span className="ml-1 text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">Friend</span>}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-200 text-right">{u.xp_points} XP</td>
                  <td className="py-3 px-4 text-right hidden sm:table-cell">
                    {u.isFriend && !u.isCurrentUser && (
                      <button onClick={() => handleViewStats(u.id)} className="text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 rounded hover:bg-brand-50">View Stats</button>
                    )}
                    {!u.isFriend && !u.isCurrentUser && !isGuest && (
                      <button onClick={() => handleAddFriend(u.id)} disabled={!!addingFriend || sentRequests.has(u.id)} className="text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 rounded hover:bg-brand-50 disabled:opacity-50">{sentRequests.has(u.id) ? '✓ Sent' : '+ Add Friend'}</button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Trophy size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">{tab === 'friends' ? 'No friends added yet. Add friends to compete!' : 'No users yet.'}</p>
        </div>
      )}

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><UserPlus size={20} className="text-brand-600" /> Find Friends</h2>
                <button onClick={() => { setShowSearch(false); setSearchResults([]); setSearchTerm('') }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"><X size={20} className="text-slate-400" /></button>
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-400 mb-2">Enter their exact username to find anyone, or search by name.</p>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="username or name..." className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" />
                  </div>
                  <button onClick={handleSearch} disabled={searchLoading} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50">
                    {searchLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
                {searchResults.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {u.avatar_url ? <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold">{(u.name || 'U').charAt(0)}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">{u.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {u.username ? `@${u.username}` : u.email}
                      </p>
                    </div>
                    {friendIds.has(u.id) ? (
                      <span className="text-xs text-green-600 font-medium">Friends</span>
                    ) : sentRequests.has(u.id) ? (
                      <span className="text-xs text-slate-400">Sent</span>
                    ) : (
                      <button onClick={() => handleAddFriend(u.id)} disabled={addingFriend === u.id} className="px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition disabled:opacity-50">
                        {addingFriend === u.id ? <Loader2 size={12} className="animate-spin" /> : 'Add Friend'}
                      </button>
                    )}
                  </div>
                ))}
                {searchResults.length === 0 && searchTerm && !searchLoading && (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-sm text-slate-500 font-medium">No users found for &quot;{searchTerm}&quot;</p>
                    <p className="text-xs text-slate-400">Make sure you&apos;re typing the exact username or name.<br />Your friend must have a HabitLab account to be found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friend Stats Toast */}
      <AnimatePresence>
        {statsToast && (
          <motion.div
            initial={{ opacity: 0, y: 60, x: 0 }}
            animate={toastVisible ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, y: 60, x: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
          >
            {/* Header bar */}
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
                {statsToast.profile?.username && (
                  <p className="text-white/70 text-xs">@{statsToast.profile.username}</p>
                )}
              </div>
              <button onClick={dismissToast} className="text-white/60 hover:text-white transition p-1">
                <X size={16} />
              </button>
            </div>

            {/* Stats grid */}
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

              {/* Streaks summary */}
              {statsToast.streaks?.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-orange-500">🔥</span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Best streak: 🔥{Math.max(...(statsToast.streaks || []).map((s: any) => s.current_streak || 0), 0)} days
                  </span>
                </div>
              )}

              {/* Badges */}
              {statsToast.badges?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Badges ({statsToast.badges.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {statsToast.badges.slice(0, 8).map((b: any) => (
                      <div
                        key={b.id}
                        className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-2 py-1 text-center"
                        title={b.badge?.name}
                      >
                        <span className="text-sm">{b.badge?.icon_url || '🏅'}</span>
                        <p className="text-[8px] text-slate-500 truncate max-w-[50px]">{b.badge?.name}</p>
                      </div>
                    ))}
                    {statsToast.badges.length > 8 && (
                      <div className="flex items-center text-[10px] text-slate-400 px-1">
                        +{statsToast.badges.length - 8} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Habits with progress */}
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

            {/* Bottom timer bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 8, ease: 'linear' }}
              className="h-1 bg-gradient-to-r from-brand-500 to-accent-500 origin-left"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
