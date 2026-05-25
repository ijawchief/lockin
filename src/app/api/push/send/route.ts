// Internal endpoint — called by the client after task mutations to trigger push to another user.
// The caller must be authenticated (their own JWT). We verify they are who they say they are,
// then send a push to the target user.

import { createClient } from '@supabase/supabase-js'
import { sendPushToUser } from '@/lib/push'
import type { NextRequest } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = adminClient()
  const { data: { user } } = await db.auth.getUser(token)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { targetUserId, title, body, tag, url } = await request.json()
  if (!targetUserId || !title || !body) {
    return Response.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Don't send pushes to yourself
  if (targetUserId === user.id) return Response.json({ ok: true, skipped: true })

  await sendPushToUser(targetUserId, { title, body, tag, url })
  return Response.json({ ok: true })
}
