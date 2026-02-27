import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Check for Firebase auth token cookie (set by AuthProvider on the client)
  const firebaseToken = req.cookies.get('firebaseAuthToken')?.value

  // Check for guest mode cookie
  const isGuest = req.cookies.get('habitlab_guest')?.value === 'true'

  const isAuthenticated = !!firebaseToken || isGuest

  // If user is not signed in (and not guest) and the route is protected, redirect to sign-in
  if (!isAuthenticated && req.nextUrl.pathname !== '/' && !req.nextUrl.pathname.startsWith('/signin') && !req.nextUrl.pathname.startsWith('/signup') && !req.nextUrl.pathname.startsWith('/auth') && !req.nextUrl.pathname.startsWith('/about')) {
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
  matcher: ['/dashboard/:path*', '/habits/:path*', '/insights/:path*', '/profile/:path*', '/learn/:path*', '/impact/:path*', '/leaderboard/:path*', '/challenges/:path*', '/notifications/:path*', '/signin', '/signup'],
}
