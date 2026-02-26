import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // In production: use createMiddlewareClient from @supabase/auth-helpers-nextjs
  // to check for session and redirect unauthenticated users.
  // For demo, allow all routes.
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/habits/:path*', '/insights/:path*', '/profile/:path*'],
}
