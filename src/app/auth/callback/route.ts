import { NextResponse } from 'next/server'

/**
 * GET /auth/callback
 *
 * With Firebase, OAuth is handled client-side via signInWithPopup.
 * This route is kept as a fallback redirect – it simply sends users
 * to the dashboard (or back to signin on error).
 */
export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url)
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/signin?error=auth_failed`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
