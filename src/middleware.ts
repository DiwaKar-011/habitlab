import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting store (in-memory for edge runtime)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 100           // max 100 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  entry.count++
  if (entry.count > RATE_LIMIT_MAX) return false
  return true
}

export async function middleware(req: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Rate limiting for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(ip)) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests. Please slow down.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
      })
    }
  }

  // Check for Firebase auth token cookie (set by AuthProvider on the client)
  const firebaseToken = req.cookies.get('firebaseAuthToken')?.value

  // Check for guest mode cookie
  const isGuest = req.cookies.get('habitlab_guest')?.value === 'true'

  const isAuthenticated = !!firebaseToken || isGuest

  // If user is not signed in (and not guest) and the route is protected, redirect to sign-in
  if (!isAuthenticated && req.nextUrl.pathname !== '/' && !req.nextUrl.pathname.startsWith('/signin') && !req.nextUrl.pathname.startsWith('/signup') && !req.nextUrl.pathname.startsWith('/auth') && !req.nextUrl.pathname.startsWith('/about') && !req.nextUrl.pathname.startsWith('/api/')) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/signin'
    return NextResponse.redirect(redirectUrl)
  }

  // If user (or guest) is signed in and visiting sign-in/sign-up, redirect to dashboard
  if (isAuthenticated && (req.nextUrl.pathname.startsWith('/signin') || req.nextUrl.pathname.startsWith('/signup'))) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/habits/:path*', '/insights/:path*', '/profile/:path*', '/learn/:path*', '/impact/:path*', '/leaderboard/:path*', '/challenges/:path*', '/notifications/:path*', '/signin', '/signup', '/api/:path*'],
}
