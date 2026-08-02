'use client'

import { CheckSquare, Users, BarChart2, Settings, Inbox } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

export default function BottomNav() {
  const { activeTab, setActiveTab, tasks, user, profile, isTeamManager } = useApp()
  const inboxCount = tasks.filter(t => t.assignment_status === 'pending' && t.assigned_to === user?.id).length

  const tabs = [
    { id: 'timer' as const, label: 'Tasks', Icon: CheckSquare },
    ...(profile?.account_type === 'team' || isTeamManager ? [{ id: 'projects' as const, label: 'Team', Icon: Users }] : []),
    { id: 'reports' as const, label: 'Reports', Icon: BarChart2 },
    { id: 'settings' as const, label: 'Settings', Icon: Settings },
    { id: 'inbox' as const, label: 'Inbox', Icon: Inbox },
  ]

  return (
    <nav className="bottom-nav">
      <div className="flex items-center">
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 relative"
            >
              <div className="relative">
                <Icon
                  size={22}
                  color={active ? 'var(--primary)' : 'var(--muted)'}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                {id === 'inbox' && inboxCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                    style={{ background: 'var(--primary)', fontSize: '9px', fontWeight: 700 }}>
                    {inboxCount}
                  </span>
                )}
              </div>
              <span className="text-xs" style={{ color: active ? 'var(--primary)' : 'var(--muted)', fontWeight: active ? 600 : 400 }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
