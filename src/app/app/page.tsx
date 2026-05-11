'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { AppProvider, useApp } from '@/contexts/AppContext'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import TimerView from '@/components/TimerView'
import TasksSection from '@/components/TasksSection'
import ProjectsView from '@/components/ProjectsView'
import ReportsView from '@/components/ReportsView'
import SettingsView from '@/components/SettingsView'
import InboxView from '@/components/InboxView'
import ProfileSheet from '@/components/ProfileSheet'
import ToastNotification from '@/components/ToastNotification'

function AppContent() {
  const { activeTab } = useApp()
  const [showProfile, setShowProfile] = useState(false)

  return (
    <div className="app-container">
      <Header onAvatarClick={() => setShowProfile(true)} />

      <main>
        {activeTab === 'timer' && (
          <div className="scroll-area">
            <TimerView />
            <TasksSection />
          </div>
        )}
        {activeTab === 'projects' && <ProjectsView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'settings' && <SettingsView />}
        {activeTab === 'inbox' && <InboxView />}
      </main>

      <BottomNav />

      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} />}
      <ToastNotification />
    </div>
  )
}

export default function AppPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user ?? null
      setUser(u)
      if (!u) router.replace('/login')
    })
  }, [])

  if (user === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
      </div>
    )
  }

  if (!user) return null

  return (
    <AppProvider initialUser={user}>
      <AppContent />
    </AppProvider>
  )
}
