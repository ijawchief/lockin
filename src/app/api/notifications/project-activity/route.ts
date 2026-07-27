import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushToUser } from '@/lib/push'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = adminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id, message, task_id } = await req.json()
  if (!project_id || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Get all project members + project owner
  const [{ data: members }, { data: project }] = await Promise.all([
    supabase.from('project_members').select('user_id').eq('project_id', project_id),
    supabase.from('projects').select('user_id').eq('id', project_id).single(),
  ])

  const recipients = new Set<string>()
  members?.forEach(m => recipients.add(m.user_id))
  if (project?.user_id) recipients.add(project.user_id)
  recipients.delete(user.id) // exclude the actor

  if (recipients.size === 0) return NextResponse.json({ ok: true })

  await Promise.all([...recipients].map(async (recipientId) => {
    await supabase.from('notifications').insert({
      user_id: recipientId,
      type: 'project_activity',
      body: message,
      project_id,
      task_id: task_id ?? null,
      read: false,
    })
    await sendPushToUser(recipientId, {
      title: '📁 Project update',
      body: message,
      url: '/app',
    }).catch(() => {})
  }))

  return NextResponse.json({ ok: true })
}
