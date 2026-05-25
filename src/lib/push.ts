import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export interface PushPayload {
  title: string
  body: string
  tag?: string
  url?: string
}

/** Send a push notification to every registered browser for a given user. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const db = adminClient()
  const { data: subs } = await db
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)

  if (!subs?.length) return

  const results = await Promise.allSettled(
    subs.map(row =>
      webpush.sendNotification(
        row.subscription as webpush.PushSubscription,
        JSON.stringify(payload),
      )
    )
  )

  // Clean up expired subscriptions (410 Gone)
  const expiredEndpoints = results
    .map((r, i) => (r.status === 'rejected' && (r.reason as { statusCode?: number })?.statusCode === 410 ? (subs[i].subscription as { endpoint: string }).endpoint : null))
    .filter(Boolean)

  if (expiredEndpoints.length) {
    await db
      .from('push_subscriptions')
      .delete()
      .in('endpoint', expiredEndpoints)
  }
}
