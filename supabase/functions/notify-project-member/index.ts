import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const payload = await req.json()
  const record = payload.record ?? payload

  if (!record.project_id || !record.user_id) {
    return new Response('skipped', { status: 200 })
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get added user's email
  const { data: { user } } = await admin.auth.admin.getUserById(record.user_id)
  if (!user?.email) return new Response('no email', { status: 200 })

  // Get project details + owner name
  const { data: project } = await admin
    .from('projects')
    .select('name, user_id')
    .eq('id', record.project_id)
    .single()
  if (!project) return new Response('no project', { status: 200 })

  const { data: owner } = await admin
    .from('profiles')
    .select('name')
    .eq('id', project.user_id)
    .single()

  const ownerName = owner?.name ?? 'Someone'
  const projectName = project.name ?? 'Untitled project'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'LockIn <notifications@lockinhq.co>',
      to: user.email,
      subject: `${ownerName} added you to "${projectName}"`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #111">
          <div style="margin-bottom: 32px">
            <img src="https://lockinhq.co/favicon.svg" width="48" height="48" alt="LockIn" style="border-radius: 10px; display: block;" />
          </div>
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 8px">You've been added to a project</h2>
          <p style="color: #6B7280; margin: 0 0 24px">${ownerName} added you to:</p>
          <div style="background: #FFF7F5; border: 1px solid #FCDDD6; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px">
            <p style="font-size: 16px; font-weight: 600; margin: 0; color: #E8654A">📁 ${projectName}</p>
          </div>
          <a href="https://lockinhq.co" style="display: inline-block; background: #E8654A; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px">
            Open LockIn →
          </a>
          <p style="color: #9CA3AF; font-size: 13px; margin-top: 32px">
            You can now see and collaborate on tasks in this project.
          </p>
        </div>
      `,
    }),
  })

  return new Response(res.ok ? 'sent' : await res.text(), { status: res.ok ? 200 : 500 })
})
