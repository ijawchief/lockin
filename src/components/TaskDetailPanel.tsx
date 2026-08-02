'use client'

import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { X, Check, Plus, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useApp, isOccurrenceRecurrence } from '@/contexts/AppContext'
import { supabase } from '@/lib/supabase'
import type { Task, Profile } from '@/lib/types'

interface ChecklistItem {
  id: string
  task_id: string
  text: string
  done: boolean
  position: number
}

interface Comment {
  id: string
  task_id: string
  user_id: string
  text: string
  created_at: string
  author?: { name: string; avatar_url: string | null } | null
}

interface Props {
  taskId: string
  onClose: () => void
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export default function TaskDetailPanel({ taskId, onClose }: Props) {
  const { tasks, updateTask, deleteTask, pinTask, pinnedTaskId, projects, user, profile, todayCompletions, toggleRecurringDone } = useApp()
  const task = tasks.find(t => t.id === taskId)

  // Local editable state — stays in sync with task prop
  const [title, setTitle] = useState(task?.title ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [recurrence, setRecurrence] = useState<Task['recurrence']>(task?.recurrence ?? null)
  const [estimatedPomos, setEstimatedPomos] = useState(task?.estimated_pomos ?? 1)
  const [projectId, setProjectId] = useState<string | null>(task?.project_id ?? null)
  const [editingTitle, setEditingTitle] = useState(false)

  // Checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [addingCheck, setAddingCheck] = useState(false)
  const [newCheckText, setNewCheckText] = useState('')

  // Comments
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)

  // Assignee search
  const [showAssignSearch, setShowAssignSearch] = useState(false)
  const [assignSearch, setAssignSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)

  const titleRef = useRef<HTMLTextAreaElement>(null)
  const isPinned = pinnedTaskId === taskId

  useEffect(() => {
    if (!taskId) return
    loadChecklist()
    loadComments()
  }, [taskId])

  // Keep local state in sync if task updates externally
  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setNotes(task.notes ?? '')
    setDueDate(task.due_date ?? '')
    setRecurrence(task.recurrence ?? null)
    setEstimatedPomos(task.estimated_pomos)
    setProjectId(task.project_id)
  }, [task?.title, task?.notes, task?.due_date, task?.recurrence, task?.estimated_pomos, task?.project_id])

  if (!task) return null

  const canEdit = !!(user && (task.user_id === user.id || task.assigned_to === user.id))
  const isOccurrence = isOccurrenceRecurrence(task.recurrence)
  const todayCompletion = isOccurrence ? todayCompletions.find(c => c.task_id === taskId) : undefined
  const isDoneToday = isOccurrence ? !!todayCompletion : task.done

  async function loadChecklist() {
    const { data } = await supabase
      .from('task_checklist_items')
      .select('*')
      .eq('task_id', taskId)
      .order('position')
    setChecklist(data ?? [])
  }

  async function loadComments() {
    const { data } = await supabase
      .from('task_comments')
      .select('*, author:profiles!task_comments_user_id_fkey(name, avatar_url)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
    setComments(data ?? [])
  }

  async function saveTitle() {
    setEditingTitle(false)
    const trimmed = title.trim()
    if (trimmed && trimmed !== task!.title) await updateTask(taskId, { title: trimmed })
  }

  async function saveNotes() {
    if (notes !== task!.notes) await updateTask(taskId, { notes })
  }

  async function saveDueDate(val: string) {
    setDueDate(val)
    await updateTask(taskId, { due_date: val || null })
  }

  async function savePomos(val: number) {
    const clamped = Math.max(1, Math.min(20, val))
    setEstimatedPomos(clamped)
    await updateTask(taskId, { estimated_pomos: clamped })
  }

  async function saveProject(id: string | null) {
    setProjectId(id)
    await updateTask(taskId, { project_id: id })
  }

  async function saveRecurrence(val: Task['recurrence']) {
    setRecurrence(val)
    await updateTask(taskId, { recurrence: val })
  }

  async function addCheckItem() {
    const text = newCheckText.trim()
    if (!text) { setAddingCheck(false); return }
    const { data } = await supabase.from('task_checklist_items').insert({
      task_id: taskId, text, done: false, position: checklist.length,
    }).select('*').single()
    if (data) setChecklist(prev => [...prev, data])
    setNewCheckText('')
    setAddingCheck(false)
  }

  async function toggleCheckItem(item: ChecklistItem) {
    const done = !item.done
    setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, done } : c))
    await supabase.from('task_checklist_items').update({ done }).eq('id', item.id)
  }

  async function deleteCheckItem(id: string) {
    setChecklist(prev => prev.filter(c => c.id !== id))
    await supabase.from('task_checklist_items').delete().eq('id', id)
  }

  async function postComment() {
    const text = newComment.trim()
    if (!text || !user) return
    setPostingComment(true)
    const { data } = await supabase.from('task_comments').insert({
      task_id: taskId, user_id: user.id, text,
    }).select('*, author:profiles!task_comments_user_id_fkey(name, avatar_url)').single()
    if (data) {
      setComments(prev => [...prev, data])
      // Notify other task participants via inbox + push
      const { data: { session } } = await supabase.auth.getSession()
      fetch('/api/notifications/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ task_id: taskId, comment_text: text }),
      }).catch(() => {})
    }
    setNewComment('')
    setPostingComment(false)
  }

  async function searchUsers(q: string) {
    setAssignSearch(q)
    if (q.trim().length < 2) { setSearchResults([]); return }
    setSearching(true)
    const { data } = await supabase.from('profiles')
      .select('*').neq('id', user?.id)
      .or(`username.ilike.%${q}%,name.ilike.%${q}%`).limit(5)
    setSearchResults(data ?? [])
    setSearching(false)
  }

  async function assignTo(p: Profile) {
    setShowAssignSearch(false)
    setAssignSearch('')
    setSearchResults([])
    await updateTask(taskId, {
      assigned_to: p.id,
      assigned_by: user?.id,
      assignment_status: 'pending',
    })
  }

  async function removeAssignee() {
    await updateTask(taskId, { assigned_to: null, assigned_by: null, assignment_status: null })
  }

  const doneCount = checklist.filter(c => c.done).length
  const checkPct = checklist.length > 0 ? (doneCount / checklist.length) * 100 : 0
  const today = new Date().toISOString().split('T')[0]
  const shortId = task.id.slice(0, 8).toUpperCase()

  const dueDateColor = task.due_date
    ? task.due_date < today ? '#EF4444'
    : task.due_date === today ? '#D97706'
    : 'var(--muted)'
    : 'var(--muted)'

  return (
    <div
      className="modal-overlay"
      style={{ alignItems: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '94vw',
        maxWidth: 900,
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {canEdit && (
            <button
              onClick={() => isOccurrence ? toggleRecurringDone(taskId) : updateTask(taskId, { done: !task!.done })}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '7px 14px', borderRadius: 8,
                border: '2px solid',
                borderColor: isDoneToday ? '#10B981' : 'var(--primary)',
                background: isDoneToday ? '#ECFDF5' : 'white',
                color: isDoneToday ? '#10B981' : 'var(--primary)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Check size={14} strokeWidth={3} />
              {isDoneToday ? (isOccurrence ? 'Done Today ✓' : 'Completed ✓') : 'Complete Task'}
            </button>
          )}
          {!canEdit && isDoneToday && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 14px', borderRadius: 8, border: '2px solid #10B981',
              background: '#ECFDF5', color: '#10B981', fontWeight: 700, fontSize: 13,
            }}>
              <Check size={14} strokeWidth={3} /> {isOccurrence ? 'Done Today ✓' : 'Completed ✓'}
            </span>
          )}

          <div style={{ flex: 1 }} />

          {/* Pin */}
          <button
            title={isPinned ? 'Stop working on this' : 'Set as working task'}
            onClick={() => pinTask(isPinned ? null : taskId)}
            style={{
              width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, border: 'none', cursor: 'pointer',
              background: isPinned ? 'var(--primary)' : 'var(--surface)',
              fontSize: 16,
            }}
          >📌</button>

          {/* Delete — only task owner */}
          {task.user_id === user?.id && (
            <button
              title="Delete task"
              onClick={async () => {
                if (!confirm('Delete this task?')) return
                await deleteTask(taskId)
                onClose()
              }}
              style={{
                width: 34, height: 34,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'var(--surface)', color: '#EF4444', fontSize: 18, lineHeight: 1,
              }}
            >🗑</button>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'var(--surface)', color: 'var(--muted)',
            }}
          ><X size={17} /></button>
        </div>

        {/* ── Body ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Left — main content */}
          <div style={{
            flex: 1, padding: '24px 28px', overflowY: 'auto',
            borderRight: '1px solid var(--border)',
          }}>

            {/* Title */}
            {editingTitle ? (
              <textarea
                ref={titleRef}
                autoFocus
                rows={2}
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveTitle() } }}
                style={{
                  width: '100%', border: 'none', outline: 'none', resize: 'none',
                  fontSize: 22, fontWeight: 800, color: 'var(--text)',
                  fontFamily: 'inherit', lineHeight: 1.3, background: 'transparent',
                }}
              />
            ) : (
              <h1
                onClick={() => canEdit && setEditingTitle(true)}
                style={{
                  fontSize: 22, fontWeight: 800, lineHeight: 1.3,
                  cursor: canEdit ? 'text' : 'default',
                  color: task.done ? 'var(--muted)' : 'var(--text)',
                  textDecoration: task.done ? 'line-through' : 'none',
                  marginBottom: 0,
                }}
              >{title}</h1>
            )}

            {/* Project badge */}
            {task.project && (
              <span style={{
                display: 'inline-block', marginTop: 8,
                padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                background: task.project.color + '22', color: task.project.color,
              }}>{task.project.name}</span>
            )}

            {/* Notes */}
            <textarea
              placeholder={canEdit ? 'Click to add a description...' : ''}
              readOnly={!canEdit}
              value={notes}
              onChange={e => canEdit && setNotes(e.target.value)}
              onBlur={canEdit ? saveNotes : undefined}
              rows={3}
              style={{
                width: '100%', marginTop: 14,
                border: 'none', outline: 'none', resize: 'none',
                fontSize: 14, lineHeight: 1.7,
                color: notes ? 'var(--text)' : 'var(--muted)',
                fontFamily: 'inherit', background: 'transparent',
                cursor: canEdit ? 'text' : 'default',
              }}
            />

            {/* ── Checklist ── */}
            <div style={{ marginTop: 20 }}>
              {checklist.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                      Checklist — {doneCount}/{checklist.length}
                    </span>
                    <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        width: `${checkPct}%`, height: '100%',
                        background: '#10B981', borderRadius: 2, transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>
                  {checklist.map(item => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '5px 0', borderBottom: '1px solid var(--border)',
                    }}>
                      <button
                        onClick={() => canEdit && toggleCheckItem(item)}
                        disabled={!canEdit}
                        style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                          border: '2px solid', cursor: canEdit ? 'pointer' : 'default',
                          borderColor: item.done ? '#10B981' : 'var(--border)',
                          background: item.done ? '#10B981' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {item.done && <Check size={9} color="white" strokeWidth={3} />}
                      </button>
                      <span style={{
                        flex: 1, fontSize: 14,
                        color: item.done ? 'var(--muted)' : 'var(--text)',
                        textDecoration: item.done ? 'line-through' : 'none',
                      }}>{item.text}</span>
                      {canEdit && (
                        <button
                          onClick={() => deleteCheckItem(item.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--border)', padding: 4, opacity: 0.6,
                            display: 'flex', alignItems: 'center',
                          }}
                        ><X size={12} /></button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {addingCheck ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <input
                    autoFocus
                    placeholder="Add item and press Enter..."
                    value={newCheckText}
                    onChange={e => setNewCheckText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addCheckItem()
                      if (e.key === 'Escape') { setAddingCheck(false); setNewCheckText('') }
                    }}
                    onBlur={addCheckItem}
                    style={{
                      flex: 1, padding: '6px 10px', borderRadius: 6,
                      border: '1px solid var(--border)', fontSize: 14,
                      outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>
              ) : canEdit ? (
                <button
                  onClick={() => setAddingCheck(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--primary)', fontSize: 14, fontWeight: 600, padding: '4px 0',
                    marginTop: 4,
                  }}
                >
                  <Plus size={15} /> Add checklist item
                </button>
              ) : null}
            </div>

            {/* ── Activity / Comments ── */}
            <div style={{ marginTop: 36 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 18 }}>
                Activity
              </h3>

              {/* Comment box */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 16, flexShrink: 0,
                  background: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 13,
                }}>
                  {profile?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <textarea
                    placeholder="Click to add a comment"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment() }
                    }}
                    rows={3}
                    style={{
                      width: '100%', padding: '10px 12px',
                      border: '1px solid var(--border)', borderRadius: 8,
                      fontSize: 14, fontFamily: 'inherit', resize: 'none',
                      outline: 'none', color: 'var(--text)', lineHeight: 1.6,
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--primary)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                  />
                  {newComment.trim() && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button
                        onClick={postComment}
                        disabled={postingComment}
                        style={{
                          padding: '6px 14px', background: 'var(--primary)',
                          color: 'white', border: 'none', borderRadius: 6,
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        {postingComment ? 'Posting…' : 'Post'}
                      </button>
                      <button
                        onClick={() => setNewComment('')}
                        style={{
                          padding: '6px 10px', background: 'none',
                          color: 'var(--muted)', border: 'none', borderRadius: 6,
                          fontSize: 13, cursor: 'pointer',
                        }}
                      >Cancel</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity log */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Created */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 16, flexShrink: 0,
                    background: 'var(--surface)', border: '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Plus size={13} color="var(--muted)" />
                  </div>
                  <div style={{ paddingTop: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 700 }}>
                      {timeAgo(task.created_at)}
                    </span>
                    <p style={{ fontSize: 14, color: 'var(--text)', marginTop: 2 }}>Task created</p>
                  </div>
                </div>

                {comments.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 16, flexShrink: 0,
                      background: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: 13,
                    }}>
                      {c.author?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                          {c.author?.name}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{timeAgo(c.created_at)}</span>
                      </div>
                      <div style={{
                        fontSize: 14, color: 'var(--text)', lineHeight: 1.6,
                        background: 'var(--surface)', padding: '10px 14px',
                        borderRadius: '4px 12px 12px 12px',
                        border: '1px solid var(--border)',
                      }}>
                        {c.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — sidebar */}
          <div style={{
            width: 250, flexShrink: 0,
            padding: '20px 18px', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 0,
            background: '#FAFAFA',
          }}>

            {/* Pomos */}
            <SideSection icon="🍅" label="Pomodoros">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {canEdit && <button onClick={() => savePomos(estimatedPomos - 1)} style={counterBtn}><ChevronDown size={14} /></button>}
                <span style={{ fontWeight: 800, fontSize: 18, minWidth: 24, textAlign: 'center', color: 'var(--text)' }}>
                  {estimatedPomos}
                </span>
                {canEdit && <button onClick={() => savePomos(estimatedPomos + 1)} style={counterBtn}><ChevronUp size={14} /></button>}
                <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>
                  {task.completed_pomos}/{estimatedPomos} done
                </span>
              </div>
              {task.estimated_pomos > 0 && (
                <div style={{ marginTop: 6, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, (task.completed_pomos / task.estimated_pomos) * 100)}%`,
                    height: '100%', background: 'var(--primary)', borderRadius: 2, transition: 'width 0.3s',
                  }} />
                </div>
              )}
            </SideSection>

            {/* Due Date */}
            <SideSection icon="📅" label="Due Date">
              <input
                type="date"
                value={dueDate}
                min={today}
                disabled={!canEdit}
                onChange={e => saveDueDate(e.target.value)}
                style={{
                  width: '100%', padding: '6px 8px', borderRadius: 6,
                  border: '1px solid var(--border)', fontSize: 13,
                  color: dueDateColor, background: 'white', outline: 'none',
                  fontFamily: 'inherit', opacity: canEdit ? 1 : 0.6,
                }}
              />
              {dueDate && canEdit && (
                <button
                  onClick={() => saveDueDate('')}
                  style={{
                    marginTop: 4, fontSize: 11, color: 'var(--muted)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >Clear date</button>
              )}
            </SideSection>

            {/* Recurrence */}
            <SideSection icon="🔁" label="Repeat">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {([null, 'daily', 'weekdays', 'weekly', 'monthly'] as const).map(opt => (
                  <button
                    key={String(opt)}
                    onClick={() => canEdit && saveRecurrence(opt)}
                    disabled={!canEdit}
                    style={{
                      padding: '5px 10px', borderRadius: 6, fontSize: 12,
                      fontWeight: recurrence === opt ? 700 : 400,
                      background: recurrence === opt ? 'var(--primary)' : 'transparent',
                      color: recurrence === opt ? 'white' : 'var(--text)',
                      border: `1px solid ${recurrence === opt ? 'var(--primary)' : 'var(--border)'}`,
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt === null ? 'None' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const).map(day => (
                    <button
                      key={day}
                      onClick={() => canEdit && saveRecurrence(recurrence === day ? null : day)}
                      disabled={!canEdit}
                      style={{
                        padding: '4px 8px', borderRadius: 6, fontSize: 11,
                        fontWeight: recurrence === day ? 700 : 400,
                        background: recurrence === day ? 'var(--primary)' : 'transparent',
                        color: recurrence === day ? 'white' : 'var(--text)',
                        border: `1px solid ${recurrence === day ? 'var(--primary)' : 'var(--border)'}`,
                        cursor: canEdit ? 'pointer' : 'default', fontFamily: 'inherit',
                        transition: 'all 0.15s',
                        opacity: !canEdit ? 0.5 : 1,
                      }}
                    >
                      {day.slice(0, 3).charAt(0).toUpperCase() + day.slice(1, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </SideSection>

            {/* Project */}
            <SideSection icon="📁" label="Project">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <ProjChip selected={projectId === null} color="#6B7280" onClick={() => canEdit && saveProject(null)} disabled={!canEdit}>None</ProjChip>
                {projects.map(p => (
                  <ProjChip key={p.id} selected={projectId === p.id} color={p.color} onClick={() => canEdit && saveProject(p.id)} disabled={!canEdit}>
                    {p.name}
                  </ProjChip>
                ))}
              </div>
            </SideSection>

            {/* Assignee */}
            <SideSection icon="👤" label="Assigned to">
              {task.assignee_profile ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 14,
                    background: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 12, flexShrink: 0,
                  }}>
                    {task.assignee_profile.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.assignee_profile.name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
                      {task.assignment_status === 'accepted' ? '✓ Accepted' :
                       task.assignment_status === 'declined' ? '✗ Declined' : '⏳ Pending'}
                    </p>
                  </div>
                  {canEdit && (
                    <button onClick={removeAssignee} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 2 }}>
                      <X size={13} />
                    </button>
                  )}
                </div>
              ) : showAssignSearch ? (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input
                      autoFocus
                      placeholder="Search name..."
                      value={assignSearch}
                      onChange={e => searchUsers(e.target.value)}
                      onBlur={() => setTimeout(() => setShowAssignSearch(false), 200)}
                      style={{
                        width: '100%', padding: '6px 8px 6px 26px',
                        border: '1px solid var(--border)', borderRadius: 6,
                        fontSize: 13, outline: 'none', fontFamily: 'inherit',
                        background: 'white',
                      }}
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                      background: 'white', border: '1px solid var(--border)',
                      borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', marginTop: 4,
                    }}>
                      {searching ? (
                        <p style={{ fontSize: 12, color: 'var(--muted)', padding: '10px 12px' }}>Searching…</p>
                      ) : searchResults.map(p => (
                        <button key={p.id} onMouseDown={() => assignTo(p)} style={{
                          width: '100%', display: 'flex', alignItems: 'center',
                          gap: 8, padding: '8px 10px', border: 'none',
                          background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13,
                        }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: 12,
                            background: 'var(--primary)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0,
                          }}>{p.name?.[0]?.toUpperCase()}</div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>{p.name}</p>
                            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 11 }}>@{p.username}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : canEdit ? (
                <button
                  onClick={() => setShowAssignSearch(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--primary)', fontSize: 13, fontWeight: 600, padding: 0,
                  }}
                >
                  <Plus size={14} /> Assign to someone
                </button>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Not assigned</span>
              )}
            </SideSection>

            {/* Metadata */}
            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 6px' }}>
                <span style={{ display: 'block', fontWeight: 700, color: 'var(--text)', marginBottom: 1 }}>Created</span>
                {new Date(task.created_at).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              {task.completed_at && (
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 6px' }}>
                  <span style={{ display: 'block', fontWeight: 700, color: 'var(--text)', marginBottom: 1 }}>Completed</span>
                  {new Date(task.completed_at).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                <span style={{ display: 'block', fontWeight: 700, color: 'var(--text)', marginBottom: 1 }}>Task ID</span>
                {shortId}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──

const counterBtn: CSSProperties = {
  width: 26, height: 26, borderRadius: 6,
  border: '1px solid var(--border)', background: 'white',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--text)',
}

function SideSection({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: 'var(--muted)',
        textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span>{icon}</span>{label}
      </p>
      {children}
    </div>
  )
}

function ProjChip({ selected, color, onClick, disabled, children }: {
  selected: boolean; color: string; onClick: () => void; disabled?: boolean; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 10px', borderRadius: 6, border: '1px solid',
        fontSize: 12, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', textAlign: 'left',
        transition: 'all 0.15s', opacity: disabled && !selected ? 0.5 : 1,
        background: selected ? color : 'white',
        color: selected ? 'white' : 'var(--text)',
        borderColor: selected ? color : 'var(--border)',
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: 4, flexShrink: 0,
        background: selected ? 'rgba(255,255,255,0.7)' : color,
      }} />
      {children}
    </button>
  )
}
