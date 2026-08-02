'use client'

import { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { useApp, isOccurrenceRecurrence } from '@/contexts/AppContext'
import { supabase } from '@/lib/supabase'
import type { Profile, Task } from '@/lib/types'
import AddTaskModal from './AddTaskModal'
import TaskDetailPanel from './TaskDetailPanel'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return (parts[0][0] ?? '?').toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const COLORS = ['#E8654A', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4']
function avatarColor(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return COLORS[Math.abs(h) % COLORS.length]
}

export default function TeamWall() {
  const { tasks, projects, user, profile, presence, todayCompletions } = useApp()
  const [members, setMembers] = useState<Profile[]>([])
  const [assignTo, setAssignTo] = useState<Profile | null>(null)
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null)

  const projectIds = projects.map(p => p.id).join(',')
  useEffect(() => {
    if (!projects.length) return
    loadMembers()
  }, [projectIds])

  async function loadMembers() {
    const ids = projects.map(p => p.id)
    const { data } = await supabase
      .from('project_members')
      .select('user_id')
      .in('project_id', ids)

    const teammateIds = [...new Set((data ?? []).map((r: any) => r.user_id as string))]
      .filter(id => id !== user?.id)

    let teammates: Profile[] = []
    if (teammateIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles').select('*').in('id', teammateIds)
      teammates = profiles ?? []
    }

    const all: Profile[] = []
    if (profile) all.push(profile)
    teammates.forEach(t => { if (!all.some(a => a.id === t.id)) all.push(t) })
    setMembers(all)
  }

  function isEffectivelyDone(t: Task) {
    if (isOccurrenceRecurrence(t.recurrence)) return todayCompletions.some(c => c.task_id === t.id)
    return t.done
  }

  function getMemberData(member: Profile) {
    const memberTasks = tasks.filter(t => t.assigned_to === member.id)
    const doneToday = memberTasks.filter(t => isEffectivelyDone(t))
    const stillToDo = memberTasks.filter(t => !isEffectivelyDone(t))
    const pres = Object.values(presence).find(p => p.user_id === member.id)
    const isLive = !!(pres?.is_running)
    const currentTask = pres?.task_id ? (tasks.find(t => t.id === pres.task_id) ?? null) : null
    return { doneToday, stillToDo, isLive, currentTask }
  }

  if (!projects.length) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Create a project and add team members to see the wall.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {members.map(member => {
        const { doneToday, stillToDo, isLive, currentTask } = getMemberData(member)
        const isMe = member.id === user?.id
        const color = avatarColor(member.id)
        const noTasks = doneToday.length === 0 && stillToDo.length === 0

        return (
          <div key={member.id} className="card" style={{ padding: 16 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: noTasks ? 0 : 14 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: color + '18', border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, color, overflow: 'hidden',
              }}>
                {member.avatar_url
                  ? <img src={member.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials(member.name)
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  {member.name}{isMe ? ' (you)' : ''}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: isLive ? '#10B981' : 'var(--border)', display: 'inline-block',
                  }} />
                  <span style={{ fontSize: 12, color: isLive ? '#10B981' : 'var(--muted)', fontWeight: isLive ? 600 : 400 }}>
                    {isLive
                      ? `Live${currentTask ? ` — ${currentTask.title}` : ''}`
                      : 'Offline'
                    }
                  </span>
                </div>
              </div>
              {!isMe && (
                <button
                  onClick={() => setAssignTo(member)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                    padding: '5px 10px', borderRadius: 8, flexShrink: 0,
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--muted)', cursor: 'pointer',
                  }}
                >
                  <UserPlus size={12} /> Assign
                </button>
              )}
            </div>

            {/* Live pomo progress */}
            {isLive && currentTask && (
              <div style={{
                background: '#F0FDF4', borderRadius: 8, padding: '10px 12px',
                border: '1px solid #D1FAE5', marginBottom: 12,
              }}>
                <p style={{ margin: '0 0 5px', fontSize: 11, color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Working on
                </p>
                <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                  {currentTask.title}
                </p>
                {currentTask.estimated_pomos > 0 && (
                  <>
                    <div style={{ background: '#D1FAE5', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                      <div style={{
                        background: '#10B981', height: '100%', borderRadius: 99, transition: 'width 0.3s',
                        width: `${Math.min(100, Math.round((currentTask.completed_pomos / currentTask.estimated_pomos) * 100))}%`,
                      }} />
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#059669' }}>
                      {currentTask.completed_pomos}/{currentTask.estimated_pomos} pomos
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Done today */}
            {doneToday.length > 0 && (
              <div style={{ marginBottom: stillToDo.length > 0 ? 10 : 0 }}>
                <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Done today ({doneToday.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {doneToday.map(t => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                      onClick={() => setDetailTaskId(t.id)}>
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                        background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ color: 'white', fontSize: 9, fontWeight: 700 }}>✓</span>
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'line-through', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Still to do */}
            {stillToDo.length > 0 && (
              <div>
                <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Still to do ({stillToDo.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {stillToDo.map(t => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                      onClick={() => setDetailTaskId(t.id)}>
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                        border: '2px solid var(--border)', background: 'transparent',
                      }} />
                      <span style={{ fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title}
                      </span>
                      {t.project && (
                        <span style={{
                          fontSize: 11, padding: '1px 6px', borderRadius: 99, flexShrink: 0,
                          background: t.project.color + '22', color: t.project.color,
                        }}>
                          {t.project.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No tasks */}
            {noTasks && (
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '10px 0 0' }}>
                Nothing assigned yet.{' '}
                {!isMe && (
                  <button
                    onClick={() => setAssignTo(member)}
                    style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0 }}
                  >
                    Assign something →
                  </button>
                )}
              </p>
            )}
          </div>
        )
      })}

      {assignTo && <AddTaskModal defaultAssignee={assignTo} onClose={() => setAssignTo(null)} />}
      {detailTaskId && <TaskDetailPanel taskId={detailTaskId} onClose={() => setDetailTaskId(null)} />}
    </div>
  )
}
