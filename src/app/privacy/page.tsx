import Link from 'next/link'
import { Lock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — LockIn',
  description: 'How LockIn collects, uses, and protects your data.',
}

const EFFECTIVE_DATE = 'May 21, 2026'
const CONTACT_EMAIL = 'support@lockinhq.co'

export default function PrivacyPage() {
  return (
    <div style={{
      background: '#fff',
      color: '#1A1A2E',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <header style={{
        background: '#0F0F14',
        borderBottom: '1px solid #1F2937',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E8654A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={15} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, color: 'white', fontSize: 18 }}>LockIn</span>
          </Link>
          <Link href="/login" style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
            Back to app →
          </Link>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px 96px' }}>
        {/* Title block */}
        <div style={{ marginBottom: 56 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#E8654A', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>Legal</p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Privacy Policy
          </h1>
          <p style={{ color: '#6B7280', fontSize: 15 }}>
            Effective: {EFFECTIVE_DATE} · Questions? <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#E8654A' }}>{CONTACT_EMAIL}</a>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

          <Section title="1. Who we are">
            <P>LockIn (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is a focus-timer and productivity platform available at lockinhq.co. We help individuals and teams build deep-work habits.</P>
            <P>If you have questions about this policy, email us at <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>{CONTACT_EMAIL}</a>.</P>
          </Section>

          <Section title="2. What data we collect">
            <P><strong>Account data:</strong> When you sign up, we collect your email address. You may optionally add a full name, username, and social media handles to your profile.</P>
            <P><strong>Usage data:</strong> We record the focus sessions you run (start time, duration, type), tasks you create or complete, streak counts, and project time logs. This is the core data that powers your reports and public profile.</P>
            <P><strong>Device &amp; technical data:</strong> When you use the app, we record your device type (mobile, tablet, or desktop), browser, operating system, and country (derived from your IP address via Vercel&rsquo;s infrastructure). We do not store your IP address itself.</P>
            <P><strong>Communications:</strong> If you contact us by email, we keep that correspondence.</P>
          </Section>

          <Section title="3. How we use your data">
            <ul style={listStyle}>
              <li>To provide and improve the LockIn service</li>
              <li>To display your stats, streaks, and activity on your dashboard and public profile</li>
              <li>To send you streak-protection alerts and important service emails (you can disable notifications in Settings)</li>
              <li>To show team presence — teammates see your first name and current focus status in real time</li>
              <li>To generate anonymous, aggregate product analytics so we can understand usage patterns</li>
            </ul>
            <P>We do not sell your data. We do not use your data for advertising.</P>
          </Section>

          <Section title="4. Third-party services">
            <P>We use the following trusted providers to run the service:</P>
            <ul style={listStyle}>
              <li><strong>Supabase</strong> — database and authentication (data stored in the EU region)</li>
              <li><strong>Vercel</strong> — hosting and edge delivery</li>
              <li><strong>Resend</strong> — transactional email delivery</li>
            </ul>
            <P>Each provider is contractually bound to process your data only as necessary to provide their service to us, and not for their own purposes.</P>
          </Section>

          <Section title="5. Public profiles">
            <P>If you set a username, your public profile at <code style={codeStyle}>lockinhq.co/u/[username]</code> is visible to anyone with the link. It shows your display name, total pomodoro count, current streak, focus level, and weekly session chart. Your email, tasks, and project details are never shown publicly.</P>
            <P>You can remove your username from your profile at any time to make your profile inaccessible.</P>
          </Section>

          <Section title="6. Team visibility">
            <P>When you are running an active focus session, your teammates in the same workspace can see your name, session status, and current task (if set). This is a core feature of LockIn — shared accountability. You can pause visibility by ending your session or signing out.</P>
          </Section>

          <Section title="7. Data retention">
            <P>We retain your data for as long as your account is active. If you delete your account, all personal data — including sessions, tasks, and profile information — is permanently deleted within 30 days.</P>
          </Section>

          <Section title="8. Your rights">
            <P>Depending on where you live, you may have the right to:</P>
            <ul style={listStyle}>
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict certain processing</li>
              <li>Request a portable copy of your data</li>
            </ul>
            <P>To exercise any of these rights, email us at <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>{CONTACT_EMAIL}</a>. We will respond within 30 days.</P>
          </Section>

          <Section title="9. Cookies">
            <P>LockIn uses a session cookie to keep you logged in. We do not use advertising cookies or third-party tracking cookies. We do not display cookie consent banners because we only use strictly necessary cookies.</P>
          </Section>

          <Section title="10. Children">
            <P>LockIn is not directed at children under 13. We do not knowingly collect data from anyone under 13. If you believe a child has created an account, contact us and we will delete it promptly.</P>
          </Section>

          <Section title="11. Changes to this policy">
            <P>We may update this policy as the product evolves. If we make material changes, we will notify you by email before they take effect. The effective date at the top of this page always reflects the current version.</P>
          </Section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid #E5E7EB', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/terms" style={footerLinkStyle}>Terms of Use</Link>
          <Link href="/" style={footerLinkStyle}>Back to home</Link>
          <a href={`mailto:${CONTACT_EMAIL}`} style={footerLinkStyle}>{CONTACT_EMAIL}</a>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A2E', marginBottom: 16, letterSpacing: '-0.01em' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.75, margin: 0 }}>{children}</p>
}

const listStyle: React.CSSProperties = {
  color: '#374151',
  fontSize: 15,
  lineHeight: 1.75,
  paddingLeft: 20,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const linkStyle: React.CSSProperties = { color: '#E8654A', textDecoration: 'none' }
const codeStyle: React.CSSProperties = { background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, fontSize: 13, fontFamily: 'monospace' }
const footerLinkStyle: React.CSSProperties = { color: '#9CA3AF', fontSize: 13, textDecoration: 'none', fontWeight: 500 }
