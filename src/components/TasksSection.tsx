'use client'

import { useState } from 'react'
import { Check, Trash2, Pin, PinOff, MoreHorizontal, Pencil } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import AddTaskModal from './AddTaskModal'
import type { Task } from '@/lib/types'

function Avatar({ name, url, size = 20, title }: { name: string; url?: string | null; size?: number; title?: string }) {
  return (
    <div
      title={title ?? name}
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold"
      style={{ width: size, height: size, background: '#E5E7EB', fontSize: size * 0.42 }}
    >
      {url
        ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ color: '#6B7280' }}>{name?.[0]?.toUpperCase()}</span>
      }
    </div>
  )
}

function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function TaskCard({ task }: { task: Task }) {
  const { updateTask, deleteTask, pinTask, pinnedTaskId, presence, profile, setActiveTab, settings } = useApp()
  const [showMenu, setShowMenu] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const isPinned = pinnedTaskId === task.id
  const progressPct = task.estimated_pomos > 0
    ? Math.min(100, (task.completed_pomos / task.estimated_pomos) * 100)
    : 0

  // Who is working on this task right now (from presence, excluding self)
  const workingOn = Object.values(presence).filter(
    p => p.task_id === task.id && p.user_id !== profile?.id && p.user_id !== task.assigned_to && p.is_running
  )

  // Time spent on task: completed pomos × pomo duration
  const timeSpentMins = task.completed_pomos * settings.pomo_duration

  // Due date helpers
  const todayStr = new Date().toISOString().split('T')[0]
  const dueDateColor = task.due_date
    ? task.due_date < todayStr ? { bg: '#FEE2E2', color: '#EF4444', label: '⚠ ' }
    : task.due_date === todayStr ? { bg: '#FEF3C7', color: '#D97706', label: '📅 ' }
    : { bg: 'var(--border)', color: 'var(--muted)', label: '📅 ' }
    : null

  // Is the assignee currently working on this task?
  const assigneePresence = task.assigned_to
    ? Object.values(presence).find(p => p.user_id === task.assigned_to && p.task_id === task.id)
    : null

  function handleCardClick() {
    // Tap card body to toggle as active task
    pinTask(isPinned ? null : task.id)
    // Jump to timer tab
    if (!isPinned) setActiveTab('timer')
  }

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl relative"
      style={{
        background: task.done ? '#F9FAFB' : 'white',
        border: isPinned ? '1.5px solid var(--primary)' : '1.5px solid transparent',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => updateTask(task.id, { done: !task.done })}
        className="w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
        style={{
          borderColor: task.done ? 'var(--primary)' : 'var(--border)',
          background: task.done ? 'var(--primary)' : 'transparent',
        }}
      >
        {task.done && <Check size={10} color="white" strokeWidth={3} />}
      </button>

      {/* Content — tappable to set as working task */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={handleCardClick}>
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className="text-sm font-medium"
            style={{
              color: task.done ? 'var(--muted)' : 'var(--text)',
              textDecoration: task.done ? 'line-through' : 'none',
            }}
          >
            {task.title}
          </p>
          {isPinned && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
              style={{ background: 'var(--primary)', color: 'white' }}>
              ▶ Working on
            </span>
          )}
        </div>

        {task.notes && (
          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--muted)' }}>{task.notes}</p>
        )}

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {task.project && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: task.project.color + '22', color: task.project.color }}>
              {task.project.name}
            </span>
          )}
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            🍅 {task.completed_pomos}/{task.estimated_pomos}
          </span>

          {/* Due date */}
          {dueDateColor && !task.done && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: dueDateColor.bg, color: dueDateColor.color }}>
              {dueDateColor.label}{new Date(task.due_date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
          )}

          {/* Assignee */}
          {task.assignee_profile && (
            <div className="flex items-center gap-1">
              <Avatar
                name={task.assignee_profile.name}
                url={task.assignee_profile.avatar_url}
                size={16}
                title={`Assigned to ${task.assignee_profile.name}`}
              />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {task.assignee_profile.name}
              </span>
            </div>
          )}

          {/* Teammates working on this right now */}
          {workingOn.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <div className="flex -space-x-1">
                {workingOn.map(p => (
                  <Avatar key={p.user_id} name={p.name} url={p.avatar_url} size={16}
                    title={`${p.name} is working on this`} />
                ))}
              </div>
              <span className="text-xs text-green-600 font-medium">
                {workingOn.length === 1 ? `${workingOn[0].name} is working on this` : `${workingOn.length} people working`}
              </span>
            </div>
          )}
        </div>

        {!task.done && task.estimated_pomos > 0 && (
          <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full"
              style={{ width: `${progressPct}%`, background: 'var(--primary)', transition: 'width 0.3s ease' }} />
          </div>
        )}

        {/* Assignee working status — shown inline only when actively working */}
        {task.assignee_profile && assigneePresence?.is_running && (
          <div className="mt-2 flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <Avatar
              name={task.assignee_profile.name}
              url={task.assignee_profile.avatar_url}
              size={18}
            />
            <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
              {task.assignee_profile.name}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-600 font-medium">Working now</span>
            {timeSpentMins > 0 && (
              <span className="text-xs ml-auto" style={{ color: 'var(--muted)' }}>
                {formatTime(timeSpentMins)} spent
              </span>
            )}
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="relative flex-shrink-0">
        <button
          onClick={e => { e.stopPropagation(); setShowMenu(m => !m) }}
          className="w-7 h-7 flex items-center justify-center rounded-lg"
          style={{ color: 'var(--muted)' }}
        >
          <MoreHorizontal size={16} />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-8 rounded-xl shadow-lg border z-10 py-1 min-w-36"
            style={{ background: 'white', borderColor: 'var(--border)' }}>
            <button
              onClick={() => { setShowEdit(true); setShowMenu(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              onClick={() => { pinTask(isPinned ? null : task.id); setShowMenu(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
            >
              {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
              {isPinned ? 'Stop working on' : 'Work on this'}
            </button>
            <button
              onClick={() => { deleteTask(task.id); setShowMenu(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
              style={{ color: '#EF4444' }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      {showMenu && <div className="fixed inset-0 z-9" onClick={() => setShowMenu(false)} />}
      {showEdit && <AddTaskModal task={task} onClose={() => setShowEdit(false)} />}
    </div>
  )
}

export default function TasksSection() {
  const { tasks, updateTask } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const myTasks = tasks.filter(t => !t.assigned_to || t.assignment_status === 'accepted')
  const activeTasks = myTasks.filter(t => !t.done)
  const doneTasks = myTasks.filter(t => t.done)

  async function clearFinished() {
    for (const t of doneTasks) await updateTask(t.id, { done: false })
    setShowConfirm(false)
  }

  return (
    <>
      <div className="px-4 mt-5 mb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Tasks</h2>
          <button onClick={() => setShowAdd(true)} className="btn-primary px-4 py-2 text-sm">
            + Add Task
          </button>
        </div>

        <div className="card p-3 flex flex-col gap-2">
          {myTasks.length === 0 ? (
            <p className="text-center py-6 text-sm" style={{ color: 'var(--muted)' }}>
              No tasks yet — add one to get started
            </p>
          ) : (
            <>
              {activeTasks.map(t => <TaskCard key={t.id} task={t} />)}
              {doneTasks.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{doneTasks.length} completed</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  </div>
                  {doneTasks.map(t => <TaskCard key={t.id} task={t} />)}
                  <button onClick={() => setShowConfirm(true)} className="text-xs text-center mt-1 py-1"
                    style={{ color: 'var(--muted)' }}>
                    Clear completed
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} />}

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal slide-up">
            <h3 className="font-bold mb-2">Clear completed tasks?</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>This will unmark all completed tasks.</p>
            <div className="flex gap-3">
              <button className="btn-ghost flex-1 py-2.5" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn-primary flex-1 py-2.5 text-sm" onClick={clearFinished}>Clear</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
