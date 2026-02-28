'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Flame,
  MessageCircle,
  Users,
  Zap,
  Shield,
  Trophy,
  AlertTriangle,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import {
  getNotifications,
  addNotification,
  markNotificationRead,
  markAllRead,
  clearNotifications,
  getPermissionStatus,
  requestNotificationPermission,
  initNotifications,
  sendBrowserNotification,
} from '@/lib/notificationStore'
import { getFriends } from '@/lib/db'
import {
  getRandomQuote,
  getRandomRoast,
  getFriendComparison,
} from '@/lib/motivationQuotes'
import type { AppNotification } from '@/types'

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  reminder: { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  streak: { icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/30' },
  badge: { icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  challenge: { icon: Shield, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
  system: { icon: Zap, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-800' },
  motivation: { icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  roast: { icon: MessageCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30' },
  friend: { icon: Users, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/30' },
}

export default function NotificationsPage() {
  const { user: authUser, loading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [permissionStatus, setPermissionStatus] = useState<string>('default')
  const [showPermissionBanner, setShowPermissionBanner] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    setNotifications(getNotifications())
    const status = getPermissionStatus()
    setPermissionStatus(status)
    setShowPermissionBanner(status !== 'granted' && status !== 'unsupported')
    setLoading(false)
  }, [authLoading])

  const handleRequestPermission = async () => {
    const result = await initNotifications()
    setPermissionStatus(result)
    if (result === 'granted') {
      setShowPermissionBanner(false)
      sendBrowserNotification(
        'Notifications Enabled! 🔔',
        'You\'ll now receive habit reminders and motivation. Let\'s crush it!'
      )
      // Also add an in-app notification
      addNotification({
        type: 'system',
        title: 'Browser Notifications Enabled',
        message: 'You\'ll now get push notifications for reminders, streaks, and motivation!',
      })
      setNotifications(getNotifications())
    }
  }

  const handleSendTestRoast = () => {
    const roast = getRandomRoast()
    addNotification({
      type: 'roast',
      title: 'Habit Roast 🔥',
      message: roast,
    })
    setNotifications(getNotifications())
    if (permissionStatus === 'granted') {
      sendBrowserNotification('Habit Roast 🔥', roast)
    }
  }

  const handleSendMotivation = () => {
    const quote = getRandomQuote()
    addNotification({
      type: 'motivation',
      title: 'Motivation Boost ✨',
      message: quote,
    })
    setNotifications(getNotifications())
    if (permissionStatus === 'granted') {
      sendBrowserNotification('Motivation Boost ✨', quote)
    }
  }

  const handleSendFriendComparison = async () => {
    if (!authUser) return
    try {
      const friends = await getFriends(authUser.id)
      if (friends.length > 0) {
        const randomFriend = friends[Math.floor(Math.random() * friends.length)]
        const friendName = randomFriend.friend_profile?.name || 'A friend'
        const friendXP = randomFriend.friend_profile?.xp_points || 0
        const msg = getFriendComparison(friendName, undefined, friendXP)
        addNotification({
          type: 'friend',
          title: 'Friend Challenge 👀',
          message: msg,
        })
      } else {
        addNotification({
          type: 'friend',
          title: 'No Friends Yet',
          message: 'Add friends from the Leaderboard to get friend comparison notifications!',
        })
      }
      setNotifications(getNotifications())
    } catch (err) {
      console.error('Friend comparison error:', err)
    }
  }

  const handleMarkRead = (id: string) => {
    markNotificationRead(id)
    setNotifications(getNotifications())
  }

  const handleMarkAllRead = () => {
    markAllRead()
    setNotifications(getNotifications())
  }

  const handleClearAll = () => {
    clearNotifications()
    setNotifications([])
  }

  const filtered = filter === 'all' ? notifications : notifications.filter((n) => n.type === filter)
  const unreadCount = notifications.filter((n) => !n.read).length

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BellRing className="text-blue-500" size={24} />
            Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} · Reminders, roasts & motivation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
            >
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Browser Notification Permission Banner */}
      <AnimatePresence>
        {showPermissionBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-xl p-5 text-white shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bell size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Enable Browser Notifications</h3>
                <p className="text-sm text-white/90 mt-1">
                  Get reminded about your habits, receive motivation, and never miss a streak!
                  We promise to only send useful stuff (and the occasional roast).
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={handleRequestPermission}
                    className="bg-white text-indigo-600 font-semibold text-sm px-5 py-2 rounded-lg hover:bg-white/90 transition-colors shadow-md"
                  >
                    <span className="flex items-center gap-2">
                      <Volume2 size={16} /> Turn On Notifications
                    </span>
                  </button>
                  <button
                    onClick={() => setShowPermissionBanner(false)}
                    className="text-white/70 text-sm hover:text-white transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
            {permissionStatus === 'denied' && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <p className="text-xs text-white/80 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Notifications were previously blocked. Please enable them in your browser settings (click the lock icon in the address bar).
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions — Send Test Notifications */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSendMotivation}
            className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium px-3 py-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
          >
            <Sparkles size={14} /> Get Motivation
          </button>
          <button
            onClick={handleSendTestRoast}
            className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium px-3 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            <MessageCircle size={14} /> 🔥 Get Roasted
          </button>
          <button
            onClick={handleSendFriendComparison}
            className="flex items-center gap-1.5 bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs font-medium px-3 py-2 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors"
          >
            <Users size={14} /> Friend Comparison
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
        {['all', 'reminder', 'streak', 'badge', 'motivation', 'roast', 'friend', 'system'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              filter === type
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {type}
            {type !== 'all' && (
              <span className="ml-1 text-[10px] opacity-60">
                ({notifications.filter((n) => n.type === type).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center"
            >
              <Bell size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {filter === 'all' 
                  ? 'Set up reminders for your habits to start receiving notifications!'
                  : 'Try a different filter or check back later.'}
              </p>
            </motion.div>
          ) : (
            filtered.map((notif, i) => {
              const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system
              const Icon = config.icon
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-white dark:bg-slate-900 rounded-xl border p-4 flex items-start gap-3 transition-all ${
                    notif.read
                      ? 'border-slate-100 dark:border-slate-800 opacity-70'
                      : 'border-slate-200 dark:border-slate-700 shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-semibold ${notif.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-slate-400">{timeAgo(notif.created_at)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                        {notif.type}
                      </span>
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="text-[10px] text-brand-600 hover:text-brand-700 font-medium flex items-center gap-0.5"
                        >
                          <Check size={10} /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Notification Settings Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
      >
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-2">
          <Shield size={14} /> Notification Settings
        </h3>
        <div className="space-y-2 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <span>Browser Notifications</span>
            <span className={`font-medium ${
              permissionStatus === 'granted' ? 'text-green-600' : permissionStatus === 'denied' ? 'text-red-500' : 'text-amber-500'
            }`}>
              {permissionStatus === 'granted' ? '✅ Enabled' : permissionStatus === 'denied' ? '❌ Blocked' : '⏳ Not set'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Motivation Quotes</span>
            <span className="text-green-600 font-medium">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Roasting Style</span>
            <span className="text-green-600 font-medium">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Friend Comparisons</span>
            <span className="text-green-600 font-medium">Active</span>
          </div>
        </div>
        {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
          <button
            onClick={handleRequestPermission}
            className="mt-3 w-full bg-brand-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-brand-700 transition-colors"
          >
            Enable Browser Notifications
          </button>
        )}
      </motion.div>
    </div>
  )
}
