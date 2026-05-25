import { createClient } from '@supabase/supabase-js'
import { sendPushToUser } from '@/lib/push'
import type { NextRequest } from 'next/server'

// Protect this endpoint so only Vercel's cron can call it
function authorized(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  return secret === process.env.CRON_SECRET
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function sendStreakAlert(email: string, name: string, streak: number) {
  const firstName = name?.split(' ')[0] ?? 'there'
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'LockIn <notifications@lockinhq.co>',
      to: email,
      subject: `🔥 ${streak}-day streak on the line, ${firstName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0F0F14; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="font-size: 48px; margin-bottom: 8px;">🔥</div>
            <h1 style="color: #F1F5F9; font-size: 22px; font-weight: 800; margin: 0 0 8px;">
              Don't break the chain, ${firstName}.
            </h1>
            <p style="color: #9CA3AF; font-size: 15px; margin: 0;">
              You're on a <strong style="color: #F59E0B;">${streak}-day streak</strong>. One session keeps it alive.
            </p>
          </div>

          <div style="background: #1A1A2E; border: 1px solid #F59E0B44; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 28px;">
            <p style="color: #F59E0B; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin: 0 0 6px;">Current streak</p>
            <p style="color: #F1F5F9; font-size: 48px; font-weight: 900; margin: 0; line-height: 1;">${streak}</p>
            <p style="color: #6B7280; font-size: 13px; margin: 4px 0 0;">days in a row</p>
          </div>

          <p style="color: #9CA3AF; font-size: 14px; line-height: 1.7; text-align: center; margin: 0 0 28px;">
            Even one focused pomodoro counts. Lock in for 25 minutes tonight and keep your momentum alive.
          </p>

          <div style="text-align: center;">
            <a href="https://lockinhq.co/app"
              style="display: inline-block; background: #E8654A; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px;">
              Start a session now 🔒
            </a>
          </div>

          <p style="color: #374151; font-size: 12px; text-align: center; margin: 28px 0 0;">
            You're getting this because you have an active streak on LockIn.<br>
            <a href="https://lockinhq.co/app" style="color: #6B7280;">Open app</a>
          </p>
        </div>
      `,
    }),
  })
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = adminClient()

  // Find users with a streak > 0 who haven't done a pomo today
  const { data: usersAtRisk, error } = await db.rpc('get_streak_at_risk_users')
  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!usersAtRisk?.length) return Response.json({ sent: 0 })

  // Send emails + push in parallel (batch of 10 to avoid rate limits)
  let sent = 0
  for (let i = 0; i < usersAtRisk.length; i += 10) {
    const batch = usersAtRisk.slice(i, i + 10)
    await Promise.all(
      batch.map(async (u: { id: string; email: string; name: string; streak: number }) => {
        try {
          await sendStreakAlert(u.email, u.name, u.streak)
          // Also send push notification if they have a subscription
          await sendPushToUser(u.id, {
            title: `🔥 ${u.streak}-day streak on the line`,
            body: `Don't break the chain — one session keeps it alive.`,
            tag: 'streak-alert',
            url: '/app',
          }).catch(() => {})
          sent++
        } catch {}
      })
    )
  }

  return Response.json({ sent })
}
