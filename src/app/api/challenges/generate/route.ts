import { NextResponse } from 'next/server'

/**
 * POST /api/challenges/generate
 *
 * This endpoint is kept as a placeholder. The challenges page now works
 * entirely client-side with localStorage, so this route is not called.
 * When DB tables (challenges, challenge_participants) are created in
 * Supabase and a real SUPABASE_SERVICE_ROLE_KEY is configured, this
 * route can be restored to insert AI-generated challenges into the DB.
 */
export async function POST() {
  return NextResponse.json({
    message: 'Challenges are managed client-side. No DB action taken.',
  })
}
