import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function parseDevice(ua: string) {
  const s = ua.toLowerCase()
  const device = /ipad|tablet/i.test(s) ? 'tablet'
    : /mobile|android|iphone/i.test(s) ? 'mobile'
    : 'desktop'
  const browser = /edg\//i.test(s) ? 'Edge'
    : /opr\//i.test(s) ? 'Opera'
    : /chrome/i.test(s) ? 'Chrome'
    : /firefox/i.test(s) ? 'Firefox'
    : /safari/i.test(s) ? 'Safari'
    : 'Other'
  const os = /windows/i.test(s) ? 'Windows'
    : /iphone|ipad/i.test(s) ? 'iOS'
    : /android/i.test(s) ? 'Android'
    : /mac os/i.test(s) ? 'macOS'
    : /linux/i.test(s) ? 'Linux'
    : 'Other'
  return { device, browser, os }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ ok: false }, { status: 401 })

  // Verify JWT
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return Response.json({ ok: false }, { status: 401 })

  // Country from Vercel edge header (ISO 3166-1 alpha-2, e.g. "US", "NG", "GB")
  const country_code = request.headers.get('x-vercel-ip-country') ?? 'XX'
  const ua = request.headers.get('user-agent') ?? ''
  const { device, browser, os } = parseDevice(ua)

  await adminClient()
    .from('user_devices')
    .upsert(
      { user_id: user.id, country_code, device, browser, os, last_seen: new Date().toISOString() },
      { onConflict: 'user_id,country_code,device' }
    )

  return Response.json({ ok: true })
}
