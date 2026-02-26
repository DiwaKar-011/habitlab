import type { Metadata } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'HabitLab - Turn Your Habits Into Science Experiments',
  description: 'A scientific habit tracking platform powered by behavior science. Track habits, run experiments, and build lasting change.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
