import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const payload = await req.json()
  const record = payload.record
  const old = payload.old_record ?? {}

  if (!record.assigned_to || !record.assigned_by) return new Response('skipped', { status: 200 })

  const justCompleted = record.done === true && old.done !== true
  const justAccepted = record.assignment_status === 'accepted' && old.assignment_status !== 'accepted'
  if (!justCompleted && !justAccepted) return new Response('no change', { status: 200 })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const [{ data: assignee }, { data: assigner }, { data: { user: assignerUser } }] = await Promise.all([
    admin.from('profiles').select('name').eq('id', record.assigned_to).single(),
    admin.from('profiles').select('name').eq('id', record.assigned_by).single(),
    admin.auth.admin.getUserById(record.assigned_by),
  ])
  if (!assignerUser?.email) return new Response('no assigner email', { status: 200 })

  let projectName = ''
  if (record.project_id) {
    const { data: proj } = await admin.from('projects').select('name').eq('id', record.project_id).single()
    projectName = proj?.name ?? ''
  }

  const assigneeName = assignee?.name ?? 'Someone'
  const taskTitle = record.title
  const inProject = projectName ? ` in "${projectName}"` : ''

  const isCompleted = justCompleted
  const subject = isCompleted
    ? `✅ ${assigneeName} completed "${taskTitle}"`
    : `🚀 ${assigneeName} started working on "${taskTitle}"`
  const body = isCompleted
    ? `${assigneeName} completed "${taskTitle}"${inProject}`
    : `${assigneeName} started working on "${taskTitle}"${inProject}`

  // In-app notification for assigner
  await admin.from('notifications').insert({
    user_id: record.assigned_by,
    type: isCompleted ? 'task_completed' : 'task_started',
    body,
    task_id: record.id,
    project_id: record.project_id ?? null,
  })

  // Email
  const accent = isCompleted ? '#10B981' : '#3B82F6'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'LockIn <notifications@lockinhq.co>',
      to: assignerUser.email,
      subject,
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
          <div style="margin-bottom:28px">
            <img src="https://lockinhq.co/favicon.svg" width="40" height="40" alt="LockIn" style="border-radius:10px"/>
          </div>
          <h2 style="font-size:18px;font-weight:700;margin:0 0 8px">${subject}</h2>
          <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:16px 20px;margin:20px 0">
            <p style="font-size:15px;font-weight:600;margin:0;color:${accent}">📋 ${taskTitle}</p>
            ${projectName ? `<p style="font-size:13px;color:#6B7280;margin:4px 0 0">Project: ${projectName}</p>` : ''}
          </div>
          <a href="https://lockinhq.co/app" style="display:inline-block;background:#E8654A;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">
            Open LockIn →
          </a>
        </div>
      `,
    }),
  })

  return new Response(res.ok ? 'sent' : await res.text(), { status: res.ok ? 200 : 500 })
})
