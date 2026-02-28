'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Swords,
  User,
} from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '@/components/AuthProvider'
import MotivationBubble from '@/components/gamification/MotivationBubble'

const bottomNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/challenges', label: 'Challenges', icon: Swords },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function PageWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { loading: authLoading, user, isGuest } = useAuth()

  // Show a fast loading screen while Firebase auth initializes
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mx-auto mb-3"></div>
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Sidebar />
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 pt-14 md:pt-8">
          {children}
        </div>
      </main>

      {/* Random Motivation Bubble */}
      {user && !isGuest && <MotivationBubble />}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 md:hidden safe-bottom">
        <div className="flex items-center justify-around h-[60px] px-1">
          {bottomNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[11px] font-medium leading-tight">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
