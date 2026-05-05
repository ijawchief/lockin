import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const payload = await req.json()
  const record = payload.record ?? payload

  if (!record.assigned_to || record.assignment_status !== 'pending') {
    return new Response('skipped', { status: 200 })
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get assignee's email from auth.users
  const { data: { user } } = await admin.auth.admin.getUserById(record.assigned_to)
  if (!user?.email) return new Response('no email', { status: 200 })

  // Get assigner's name
  const { data: assigner } = await admin
    .from('profiles')
    .select('name')
    .eq('id', record.assigned_by)
    .single()

  const assignerName = assigner?.name ?? 'Someone'
  const taskTitle = record.title ?? 'Untitled task'
  const taskNotes = record.notes ?? ''

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'LockIn <notifications@lockinhq.co>',
      to: user.email,
      subject: `${assignerName} assigned you a task: "${taskTitle}"`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #111">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 32px">
            <span style="font-size: 22px; font-weight: 700; color: #E8654A">🔒 LockIn</span>
          </div>
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 8px">New task assigned to you</h2>
          <p style="color: #6B7280; margin: 0 0 24px">${assignerName} wants you to work on:</p>
          <div style="background: #FFF7F5; border: 1px solid #FCDDD6; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px">
            <p style="font-size: 16px; font-weight: 600; margin: 0 0 4px; color: #E8654A">${taskTitle}</p>
            ${taskNotes ? `<p style="color: #6B7280; font-size: 14px; margin: 0">${taskNotes}</p>` : ''}
          </div>
          <a href="https://lockinhq.co" style="display: inline-block; background: #E8654A; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px">
            Open LockIn →
          </a>
          <p style="color: #9CA3AF; font-size: 13px; margin-top: 32px">
            Accept or decline this task from your Inbox tab in the app.
          </p>
        </div>
      `,
    }),
  })

  return new Response(res.ok ? 'sent' : await res.text(), { status: res.ok ? 200 : 500 })
})
