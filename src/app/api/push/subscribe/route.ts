import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getUserId(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const db = adminClient()
  const { data } = await db.auth.getUser(token)
  return data.user?.id ?? null
}

// POST — save a push subscription
export async function POST(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const subscription = body.subscription
  if (!subscription?.endpoint) return Response.json({ error: 'Invalid subscription' }, { status: 400 })

  const db = adminClient()
  const { error } = await db.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: subscription.endpoint,
    subscription,
  }, { onConflict: 'endpoint' })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

// DELETE — remove a push subscription
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const endpoint = body.endpoint
  if (!endpoint) return Response.json({ error: 'No endpoint' }, { status: 400 })

  const db = adminClient()
  await db.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint)
  return Response.json({ ok: true })
}
