'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, X, Trash2 } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { supabase } from '@/lib/supabase'
import { getLevel, LEVEL_CONFIG } from '@/lib/types'
import type { Profile } from '@/lib/types'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

type ActivityItem = {
  id: string
  icon: string
  text: string
  time: string
  date: string
  unread: boolean
}

interface DbNotification {
  id: string
  user_id: string
  type: string
  body: string
  task_id: string | null
  project_id: string | null
  read: boolean
  created_at: string
}

const NOTIF_ICONS: Record<string, string> = {
  task_completed: '✅',
  task_started: '🚀',
  task_query: '⏰',
  task_assigned: '📋',
  task_comment: '💬',
  project_activity: '📁',
  task_added: '➕',
  task_deleted: '🗑️',
  task_scheduled: '📅',
  member_added: '👥',
}

function LevelCard() {
  const { sessions, profile } = useApp()
  const total = sessions.length
  const level = getLevel(total)
  const levelIdx = LEVEL_CONFIG.findIndex(l => l.name === level.name)
  const next = LEVEL_CONFIG[levelIdx + 1]
  const progress = next
    ? ((total - level.min) / (level.max - level.min)) * 100
    : 100
  const streak = profile?.streak ?? 0

  return (
    <div className="card p-4 mb-5" style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)', border: 'none' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{level.emoji}</div>
          <div>
            <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--primary)' }}>{level.name}</p>
            <p className="text-sm font-semibold" style={{ color: 'white' }}>
              {total} session{total !== 1 ? 's' : ''}
              {next && <span style={{ color: '#6B7280' }}> / {next.min} to {next.name}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(232,101,74,0.15)', border: '1px solid rgba(232,101,74,0.25)' }}>
          <span style={{ fontSize: 16 }}>🔥</span>
          <span className="font-bold text-sm" style={{ color: '#E8654A' }}>{streak}</span>
          <span className="text-xs" style={{ color: '#9CA3AF' }}>day streak</span>
        </div>
      </div>

      {/* XP bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-xs" style={{ color: '#6B7280' }}>XP Progress</span>
          {next && <span className="text-xs" style={{ color: '#6B7280' }}>{next.min - total} sessions to {next.name} {next.emoji}</span>}
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${Math.min(progress, 100)}%`,
            background: 'linear-gradient(90deg, var(--primary), #F97316)',
            transition: 'width 0.6s ease',
            boxShadow: '0 0 8px rgba(232,101,74,0.5)',
          }} />
        </div>
      </div>
    </div>
  )
}

export default function InboxView() {
  const { tasks, acceptTask, declineTask, user } = useApp()
  const pendingTasks = tasks.filter(t => t.assigned_to === user?.id && t.assignment_status === 'pending')

  // DB notifications
  const [notifications, setNotifications] = useState<DbNotification[]>([])

  // Unread tracking
  const lastSeenRef = useRef<number>(
    typeof window !== 'undefined' ? Number(localStorage.getItem('inbox_last_seen') || 0) : 0
  )
  useEffect(() => {
    localStorage.setItem('inbox_last_seen', String(Date.now()))
  }, [])

  // Clear activity tracking
  const [clearedBefore, setClearedBefore] = useState<number>(() =>
    typeof window !== 'undefined' ? Number(localStorage.getItem('inbox_cleared_before') || 0) : 0
  )

  async function clearActivity() {
    const now = Date.now()
    localStorage.setItem('inbox_cleared_before', String(now))
    setClearedBefore(now)
    // Mark all DB notifications as read
    if (user) {
      await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    }
  }

  const [assignerProfiles, setAssignerProfiles] = useState<Record<string, Profile>>({})
  const [memberships, setMemberships] = useState<Array<{
    created_at: string; project_id: string; project_name: string; owner_name: string
  }>>([])

  // Load DB notifications + realtime subscription
  useEffect(() => {
    if (!user) return

    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setNotifications(data as DbNotification[])
      })

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as DbNotification, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  useEffect(() => {
    if (!user) return

    const ids = [...new Set(
      tasks
        .filter(t => t.assigned_to === user.id && t.assigned_by && t.assigned_by !== user.id)
        .map(t => t.assigned_by!)
    )]
    if (ids.length > 0) {
      supabase.from('profiles').select('*').in('id', ids).then(({ data }) => {
        if (data) {
          const map: Record<string, Profile> = {}
          data.forEach(p => { map[p.id] = p })
          setAssignerProfiles(map)
        }
      })
    }

    supabase
      .from('project_members')
      .select('created_at, project_id, projects(name, user_id, profiles!projects_user_id_fkey(name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15)
      .then(({ data }) => {
        if (data) {
          setMemberships(data.map((r: any) => ({
            created_at: r.created_at,
            project_id: r.project_id,
            project_name: r.projects?.name ?? 'a project',
            owner_name: r.projects?.profiles?.name ?? 'Someone',
          })))
        }
      })
  }, [user, tasks])

  // Build activity feed
  const ls = lastSeenRef.current
  const items: ActivityItem[] = []

  // DB notifications (task_completed, task_started, task_query)
  notifications.forEach(n => {
    items.push({
      id: `notif-${n.id}`,
      icon: NOTIF_ICONS[n.type] ?? '🔔',
      text: n.body,
      time: timeAgo(n.created_at),
      date: n.created_at,
      unread: !n.read,
    })
  })

  // Tasks assigned TO me (derived)
  tasks
    .filter(t => t.assigned_to === user?.id && t.assignment_status !== null)
    .forEach(t => {
      const assignerName = t.assigned_by ? (assignerProfiles[t.assigned_by]?.name ?? '...') : 'Someone'
      const unread = new Date(t.created_at).getTime() > ls
      if (t.assignment_status === 'pending') {
        items.push({ id: `pending-${t.id}`, icon: '📋', text: `${assignerName} assigned you "${t.title}"`, time: timeAgo(t.created_at), date: t.created_at, unread })
      } else if (t.assignment_status === 'accepted') {
        items.push({ id: `accepted-${t.id}`, icon: '✅', text: `You accepted "${t.title}"`, time: timeAgo(t.created_at), date: t.created_at, unread: false })
      } else if (t.assignment_status === 'declined') {
        items.push({ id: `declined-${t.id}`, icon: '❌', text: `You declined "${t.title}"`, time: timeAgo(t.created_at), date: t.created_at, unread: false })
      }
    })

  // Tasks assigned BY me to others (derived)
  tasks
    .filter(t => t.assigned_by === user?.id && t.assigned_to !== user?.id && t.assignment_status !== null)
    .forEach(t => {
      const assigneeName = t.assignee_profile?.name ?? 'Someone'
      const unread = new Date(t.created_at).getTime() > ls
      if (t.assignment_status === 'accepted') {
        items.push({ id: `theyaccepted-${t.id}`, icon: '✅', text: `${assigneeName} accepted "${t.title}"`, time: timeAgo(t.created_at), date: t.created_at, unread })
      } else if (t.assignment_status === 'declined') {
        items.push({ id: `theydeclined-${t.id}`, icon: '❌', text: `${assigneeName} declined "${t.title}"`, time: timeAgo(t.created_at), date: t.created_at, unread })
      } else if (t.assignment_status === 'pending') {
        items.push({ id: `sent-${t.id}`, icon: '📤', text: `You assigned "${t.title}" to ${assigneeName}`, time: timeAgo(t.created_at), date: t.created_at, unread: false })
      }
    })

  // Projects I was added to
  memberships.forEach(m => {
    const unread = new Date(m.created_at).getTime() > ls
    items.push({ id: `project-${m.project_id}`, icon: '👥', text: `${m.owner_name} added you to "${m.project_name}"`, time: timeAgo(m.created_at), date: m.created_at, unread })
  })

  // Sort newest first, filter cleared items, filter pending (shown in Action Required)
  const activityItems = items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(i => !i.id.startsWith('pending-'))
    .filter(i => new Date(i.date).getTime() > clearedBefore)

  return (
    <div className="scroll-area px-4 pt-4">
      <div className="flex items-center gap-2 mb-5">
        <h1 className="text-2xl font-bold">Inbox</h1>
        {pendingTasks.length > 0 && (
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'var(--primary)' }}>
            {pendingTasks.length}
          </div>
        )}
      </div>

      {/* ── Level Card ── */}
      <LevelCard />

      {/* ── Action Required ── */}
      {pendingTasks.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>
            Action Required
          </p>
          <div className="flex flex-col gap-3">
            {pendingTasks.map(task => (
              <div key={task.id} className="card p-4" style={{ borderLeft: '3px solid var(--primary)' }}>
                <p className="font-semibold truncate">{task.title}</p>
                {task.notes && (
                  <p className="text-sm mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>{task.notes}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                  {task.project && (
                    <span className="px-2 py-0.5 rounded-full font-medium"
                      style={{ background: task.project.color + '22', color: task.project.color }}>
                      {task.project.name}
                    </span>
                  )}
                  <span>🍅 {task.estimated_pomos} pomo{task.estimated_pomos !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => declineTask(task.id)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold border flex items-center justify-center gap-1"
                    style={{ color: '#EF4444', borderColor: '#FCA5A5' }}
                  >
                    <X size={14} /> Decline
                  </button>
                  <button
                    onClick={() => acceptTask(task.id)}
                    className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-1"
                  >
                    <Check size={14} /> Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Activity Feed ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            Activity
          </p>
          {activityItems.length > 0 && (
            <button
              onClick={clearActivity}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg"
              style={{ color: 'var(--muted)', background: 'var(--border)' }}
            >
              <Trash2 size={11} /> Clear
            </button>
          )}
        </div>

        {activityItems.length === 0 ? (
          <div className="card p-8 flex flex-col items-center gap-3">
            <div className="text-4xl">📥</div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No activity yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {activityItems.map(item => (
              <div
                key={item.id}
                className="card flex items-start gap-3 px-4 py-3"
                style={{ borderLeft: `3px solid ${item.unread ? 'var(--primary)' : 'transparent'}` }}
              >
                <span style={{ fontSize: 20, lineHeight: '1.2', flexShrink: 0 }}>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug"
                    style={{ color: 'var(--text)', fontWeight: item.unread ? 600 : 400 }}>
                    {item.text}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{item.time}</p>
                </div>
                {item.unread && (
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--primary)' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
