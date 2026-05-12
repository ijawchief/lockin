'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, X } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { supabase } from '@/lib/supabase'
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
  date: string   // ISO for sorting
  unread: boolean
}

export default function InboxView() {
  const { tasks, acceptTask, declineTask, user } = useApp()
  const pendingTasks = tasks.filter(t => t.assigned_to === user?.id && t.assignment_status === 'pending')

  // Snapshot lastSeen at mount so items appear unread on this visit,
  // then bump it so next visit they're read
  const lastSeenRef = useRef<number>(
    typeof window !== 'undefined' ? Number(localStorage.getItem('inbox_last_seen') || 0) : 0
  )
  useEffect(() => {
    const now = Date.now()
    localStorage.setItem('inbox_last_seen', String(now))
  }, [])

  const [assignerProfiles, setAssignerProfiles] = useState<Record<string, Profile>>({})
  const [memberships, setMemberships] = useState<Array<{ created_at: string; project_id: string; project_name: string; owner_name: string }>>([])

  useEffect(() => {
    if (!user) return

    // Fetch profiles for anyone who assigned a task to me
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

    // Fetch project memberships (projects I was added to)
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
  const items: ActivityItem[] = []
  const ls = lastSeenRef.current

  // Tasks assigned TO me
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

  // Tasks assigned BY me to others
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

  // Sort newest first
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Deduplicate pending tasks from the activity list (they show in "Action Required" above)
  const activityItems = items.filter(i => !i.id.startsWith('pending-'))

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
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>
          Activity
        </p>
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
