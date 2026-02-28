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
  fitness: 'FIT',
  study: 'STD',
  focus: 'FOC',
  eco: 'ECO',
  health: 'HP',
  mindset: 'MND',
}

// ─── Security: Input Sanitization ────────────────────
export function sanitizeInput(input: string, maxLength = 500): string {
  if (!input || typeof input !== 'string') return ''
  // Strip HTML tags
  const stripped = input.replace(/<[^>]*>/g, '')
  // Remove potential script injection patterns
  const cleaned = stripped.replace(/javascript:/gi, '').replace(/on\w+=/gi, '').replace(/data:/gi, '')
  // Trim and limit length
  return cleaned.trim().slice(0, maxLength)
}

export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  // Only allow http/https URLs
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return ''
  // Block javascript: and data: URIs that might be embedded
  if (trimmed.includes('javascript:') || trimmed.includes('data:')) return ''
  return trimmed.slice(0, 2048)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
