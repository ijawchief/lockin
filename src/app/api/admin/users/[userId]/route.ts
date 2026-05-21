import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

// Service-role client — never exposed to the browser
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Verify the caller is an admin using their JWT
async function assertAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return null

  const { data: profile } = await anon
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return profile?.is_admin ? user : null
}

type Context = { params: Promise<{ userId: string }> }

// DELETE /api/admin/users/[userId] — permanently delete account
export async function DELETE(request: NextRequest, { params }: Context) {
  const caller = await assertAdmin(request)
  if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = await params
  if (userId === caller.id) {
    return Response.json({ error: "You can't delete your own account" }, { status: 400 })
  }

  const { error } = await adminClient().auth.admin.deleteUser(userId)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}

// PATCH /api/admin/users/[userId] — change email
export async function PATCH(request: NextRequest, { params }: Context) {
  const caller = await assertAdmin(request)
  if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = await params
  const { email } = await request.json()
  if (!email) return Response.json({ error: 'Email required' }, { status: 400 })

  const { error } = await adminClient().auth.admin.updateUserById(userId, { email })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Keep profiles table in sync
  await adminClient().from('profiles').update({}).eq('id', userId) // no-op, email lives in auth

  return Response.json({ ok: true })
}

// POST /api/admin/users/[userId] — send password reset email
export async function POST(request: NextRequest, { params }: Context) {
  const caller = await assertAdmin(request)
  if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = await params
  const { email } = await request.json()
  if (!email) return Response.json({ error: 'Email required' }, { status: 400 })

  const { error } = await adminClient().auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://lockinhq.co'}/app` },
  })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
