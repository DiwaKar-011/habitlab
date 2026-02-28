'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, CheckCheck, Trash2, Settings, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppNotification } from '@/types'
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
  clearNotifications,
} from '@/lib/notificationStore'
import { startReminderScheduler } from '@/lib/reminderScheduler'
import Link from 'next/link'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  // Start scheduler & poll for new notifications
  useEffect(() => {
    startReminderScheduler()

    const refresh = () => {
      setNotifications(getNotifications())
      setUnread(getUnreadCount())
    }
    refresh()
    const id = setInterval(refresh, 5000) // poll every 5s
    return () => clearInterval(id)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleMarkRead = (id: string) => {
    markNotificationRead(id)
    setNotifications(getNotifications())
    setUnread(getUnreadCount())
  }

  const handleMarkAll = () => {
    markAllRead()
    setNotifications(getNotifications())
    setUnread(0)
  }

  const handleClear = () => {
    clearNotifications()
    setNotifications([])
    setUnread(0)
  }

  const typeColors: Record<string, string> = {
    reminder: 'bg-blue-100 text-blue-700',
    streak: 'bg-orange-100 text-orange-700',
    badge: 'bg-purple-100 text-purple-700',
    challenge: 'bg-green-100 text-green-700',
    system: 'bg-slate-100 text-slate-700',
    motivation: 'bg-violet-100 text-violet-700',
    roast: 'bg-red-100 text-red-700',
    friend: 'bg-pink-100 text-pink-700',
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-slate-600 dark:text-slate-300" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel — positioned to the right of the bell so it doesn't get clipped */}
      {open && (
        <div className="fixed inset-0 z-[60] md:relative md:inset-auto">
          {/* Mobile backdrop */}
          <div className="fixed inset-0 bg-black/20 md:hidden" onClick={() => setOpen(false)} />
          <div className="fixed top-4 left-4 right-4 md:absolute md:left-0 md:top-12 md:right-auto md:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[70] overflow-hidden max-h-[85vh] md:max-h-[500px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Notifications</h3>
            <div className="flex items-center gap-2">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md hover:bg-slate-200 transition-colors"
                title="Notification Settings"
              >
                <Settings size={14} className="text-slate-500" />
              </Link>
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="p-1.5 rounded-md hover:bg-slate-200 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} className="text-slate-500" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClear}
                  className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                  title="Clear all"
                >
                  <Trash2 size={14} className="text-slate-400 hover:text-red-500" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md hover:bg-slate-200 transition-colors"
              >
                <X size={14} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700 flex-1">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">No notifications yet</p>
                <p className="text-xs text-slate-300 mt-1">
                  Set up reminders in{' '}
                  <Link href="/notifications" className="text-brand-500 hover:underline" onClick={() => setOpen(false)}>
                    Settings
                  </Link>
                </p>
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer',
                    !n.read && 'bg-blue-50/40'
                  )}
                  onClick={() => handleMarkRead(n.id)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <span
                      className={cn(
                        'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium uppercase',
                        typeColors[n.type] || typeColors.system
                      )}
                    >
                      {n.type}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', !n.read ? 'font-semibold text-slate-800' : 'text-slate-600')}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-brand-500" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Manage Reminders & Settings →
              </Link>
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  )
}
