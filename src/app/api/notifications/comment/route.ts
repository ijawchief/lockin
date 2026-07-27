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
  // Verify caller is authenticated
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = adminClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { task_id, comment_text } = await req.json()
  if (!task_id || !comment_text) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Get task + commenter profile
  const [{ data: task }, { data: commenter }] = await Promise.all([
    supabase.from('tasks').select('id, title, user_id, assigned_to, assigned_by').eq('id', task_id).single(),
    supabase.from('profiles').select('name').eq('id', user.id).single(),
  ])

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const commenterName = commenter?.name ?? 'Someone'

  // Determine who to notify: notify everyone on the task except the commenter
  const recipients = new Set<string>()
  if (task.user_id && task.user_id !== user.id) recipients.add(task.user_id)
  if (task.assigned_to && task.assigned_to !== user.id) recipients.add(task.assigned_to)
  if (task.assigned_by && task.assigned_by !== user.id) recipients.add(task.assigned_by)

  if (recipients.size === 0) return NextResponse.json({ ok: true })

  const notifBody = `${commenterName} commented on "${task.title}": ${comment_text.slice(0, 60)}${comment_text.length > 60 ? '…' : ''}`

  // Insert inbox notification + send push for each recipient
  await Promise.all([...recipients].map(async (recipientId) => {
    await supabase.from('notifications').insert({
      user_id: recipientId,
      type: 'task_comment',
      body: notifBody,
      task_id: task.id,
      read: false,
    })

    await sendPushToUser(recipientId, {
      title: '💬 New comment',
      body: notifBody,
      url: '/app',
    }).catch(() => {})
  }))

  return NextResponse.json({ ok: true })
}
