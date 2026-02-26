import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

export function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

export function isYesterday(dateStr: string): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return dateStr === yesterday.toISOString().split('T')[0]
}

export const categoryColors: Record<string, string> = {
  fitness: 'bg-green-100 text-green-700',
  study: 'bg-blue-100 text-blue-700',
  focus: 'bg-purple-100 text-purple-700',
  eco: 'bg-emerald-100 text-emerald-700',
  health: 'bg-pink-100 text-pink-700',
  mindset: 'bg-amber-100 text-amber-700',
}

export const categoryIcons: Record<string, string> = {
  fitness: '💪',
  study: '📚',
  focus: '🎯',
  eco: '🌱',
  health: '❤️',
  mindset: '🧠',
}
