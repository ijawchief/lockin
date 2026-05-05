'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

export default function ToastNotification() {
  const { notifications, dismissNotification } = useApp()

  useEffect(() => {
    if (notifications.length === 0) return
    const latest = notifications[notifications.length - 1]
    const timer = setTimeout(() => dismissNotification(latest.id), 5000)
    return () => clearTimeout(timer)
  }, [notifications.length])

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map(n => (
        <div
          key={n.id}
          className="flex items-start gap-3 p-3 rounded-xl shadow-lg pointer-events-auto slide-up"
          style={{ background: 'white', border: '1px solid var(--border)' }}
        >
          <span className="text-lg flex-shrink-0">📋</span>
          <p className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{n.message}</p>
          <button
            onClick={() => dismissNotification(n.id)}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded"
            style={{ color: 'var(--muted)' }}
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
