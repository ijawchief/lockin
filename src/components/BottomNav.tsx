'use client'

import { Timer, FolderOpen, BarChart2, Settings, Inbox } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

const tabs = [
  { id: 'timer', label: 'Timer', Icon: Timer },
  { id: 'projects', label: 'Projects', Icon: FolderOpen },
  { id: 'reports', label: 'Reports', Icon: BarChart2 },
  { id: 'settings', label: 'Settings', Icon: Settings },
  { id: 'inbox', label: 'Inbox', Icon: Inbox },
] as const

export default function BottomNav() {
  const { activeTab, setActiveTab, tasks } = useApp()
  const inboxCount = tasks.filter(t => t.assignment_status === 'pending' && t.assigned_to).length

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
