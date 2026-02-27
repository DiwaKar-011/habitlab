import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use getUser() instead of getSession() for proper server-side validation
  const { data: { user } } = await supabase.auth.getUser()

  // If user is not signed in and the route is protected, redirect to sign-in
  if (!user && req.nextUrl.pathname !== '/' && !req.nextUrl.pathname.startsWith('/signin') && !req.nextUrl.pathname.startsWith('/signup') && !req.nextUrl.pathname.startsWith('/auth') && !req.nextUrl.pathname.startsWith('/about')) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/signin'
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and visiting sign-in/sign-up, redirect to dashboard
  if (user && (req.nextUrl.pathname.startsWith('/signin') || req.nextUrl.pathname.startsWith('/signup'))) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/habits/:path*', '/insights/:path*', '/profile/:path*', '/learn/:path*', '/impact/:path*', '/leaderboard/:path*', '/challenges/:path*', '/notifications/:path*', '/signin', '/signup'],
}
