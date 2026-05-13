import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Authenticate caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify JWT and get caller
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const { task_id } = await req.json()
    if (!task_id) return new Response('Missing task_id', { status: 400, headers: corsHeaders })

    // Fetch task — caller must be the assigner
    const { data: task, error: taskError } = await admin
      .from('tasks')
      .select('id, title, assigned_to, assigned_by, project_id, projects(name)')
      .eq('id', task_id)
      .single()

    if (taskError || !task) return new Response('Task not found', { status: 404, headers: corsHeaders })
    if (task.assigned_by !== user.id) return new Response('Forbidden', { status: 403, headers: corsHeaders })
    if (!task.assigned_to) return new Response('Task has no assignee', { status: 400, headers: corsHeaders })

    // Fetch assigner name + assignee email
    const [{ data: assignerProfile }, { data: { user: assigneeUser } }] = await Promise.all([
      admin.from('profiles').select('name').eq('id', user.id).single(),
      admin.auth.admin.getUserById(task.assigned_to),
    ])

    if (!assigneeUser?.email) return new Response('No assignee email', { status: 200, headers: corsHeaders })

    const assignerName = assignerProfile?.name ?? 'Your teammate'
    const taskTitle = task.title
    const projectName = (task as any).projects?.name ?? ''
    const inProject = projectName ? ` in "${projectName}"` : ''

    const subject = `⏰ Reminder: "${taskTitle}"`
    const body = `${assignerName} is checking on "${taskTitle}"${inProject}`

    // In-app notification for assignee
    await admin.from('notifications').insert({
      user_id: task.assigned_to,
      type: 'task_query',
      body,
      task_id: task.id,
      project_id: task.project_id ?? null,
    })

    // Email to assignee
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LockIn <notifications@lockinhq.co>',
        to: assigneeUser.email,
        subject,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
            <div style="margin-bottom:28px">
              <img src="https://lockinhq.co/favicon.svg" width="40" height="40" alt="LockIn" style="border-radius:10px"/>
            </div>
            <h2 style="font-size:18px;font-weight:700;margin:0 0 8px">⏰ Task check-in from ${assignerName}</h2>
            <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:16px 20px;margin:20px 0">
              <p style="font-size:15px;font-weight:600;margin:0;color:#E8654A">📋 ${taskTitle}</p>
              ${projectName ? `<p style="font-size:13px;color:#6B7280;margin:4px 0 0">Project: ${projectName}</p>` : ''}
            </div>
            <p style="font-size:14px;color:#6B7280;margin:0 0 20px">${assignerName} wants to know how this task is going. Jump in and make progress!</p>
            <a href="https://lockinhq.co/app" style="display:inline-block;background:#E8654A;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">
              Open LockIn →
            </a>
          </div>
        `,
      }),
    })

    return new Response(res.ok ? 'sent' : await res.text(), {
      status: res.ok ? 200 : 500,
      headers: corsHeaders,
    })
  } catch (e) {
    return new Response(String(e), { status: 500, headers: corsHeaders })
  }
})
