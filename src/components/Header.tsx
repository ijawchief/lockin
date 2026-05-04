'use client'

import { Lock } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { getLevel } from '@/lib/types'

interface HeaderProps {
  onAvatarClick: () => void
}

export default function Header({ onAvatarClick }: HeaderProps) {
  const { profile, sessions } = useApp()
  const totalSessions = sessions.length
  const level = getLevel(totalSessions)

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2">
        <Lock size={22} color="var(--primary)" strokeWidth={2.5} />
        <span className="text-lg font-bold" style={{ color: 'var(--text)' }}>LockIn</span>
      </div>
      <button onClick={onAvatarClick} className="relative">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold" style={{ color: 'var(--muted)' }}>
              {profile?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          )}
        </div>
        {/* Level badge */}
        <div
          className="absolute -bottom-1 -right-1 text-xs w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: 'var(--primary)', fontSize: '8px' }}
          title={level.name}
        >
          {level.emoji}
        </div>
        {/* Online dot */}
        <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
      </button>
    </header>
  )
}
