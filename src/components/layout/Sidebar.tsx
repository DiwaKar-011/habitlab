'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Plus,
  BarChart3,
  BookOpen,
  Globe,
  User,
  Trophy,
  Swords,
  LogOut,
  Menu,
  X,
  Beaker,
  BellRing,
  Sun,
  Moon,
} from 'lucide-react'
import { useState } from 'react'
import NotificationBell from '@/components/notifications/NotificationBell'
import { useTheme } from '@/components/ThemeProvider'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/habits/create', label: 'New Experiment', icon: Plus },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/impact', label: 'Impact', icon: Globe },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/challenges', label: 'Challenges', icon: Swords },
  { href: '/notifications', label: 'Reminders', icon: BellRing },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white dark:bg-slate-800 rounded-lg p-2 shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 transition-transform duration-300 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center">
                <Beaker size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-slate-800 dark:text-white">HabitLab</span>
            </Link>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun size={18} className="text-amber-400" />
                ) : (
                  <Moon size={18} className="text-slate-500" />
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Behavior Science Platform</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </Link>
        </div>
      </aside>
    </>
  )
}
