'use client'

import { Check, X } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

export default function InboxView() {
  const { tasks, acceptTask, declineTask, user } = useApp()
  const inboxTasks = tasks.filter(t => t.assigned_to === user?.id && t.assignment_status === 'pending')

  return (
    <div className="scroll-area px-4 pt-4">
      <h1 className="text-2xl font-bold mb-1">Inbox</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>Tasks assigned to you</p>

      {inboxTasks.length === 0 ? (
        <div className="card p-8 flex flex-col items-center gap-3">
          <div className="text-4xl">📥</div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No pending tasks</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {inboxTasks.map(task => (
            <div key={task.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{task.title}</p>
                  {task.notes && (
                    <p className="text-sm mt-0.5 text-gray-500 line-clamp-2">{task.notes}</p>
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
                </div>
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
      )}
    </div>
  )
}
