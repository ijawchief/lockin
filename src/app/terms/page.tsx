import Link from 'next/link'
import { Lock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use — LockIn',
  description: 'The terms that govern your use of LockIn.',
}

const EFFECTIVE_DATE = 'May 21, 2026'
const CONTACT_EMAIL = 'support@lockinhq.co'

export default function TermsPage() {
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
            Terms of Use
          </h1>
          <p style={{ color: '#6B7280', fontSize: 15 }}>
            Effective: {EFFECTIVE_DATE} · Questions? <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#E8654A' }}>{CONTACT_EMAIL}</a>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

          <Section title="1. Acceptance">
            <P>By creating an account or using LockIn (&ldquo;the Service&rdquo;), you agree to these Terms of Use. If you do not agree, do not use the Service. These terms form a binding agreement between you and LockIn.</P>
          </Section>

          <Section title="2. The service">
            <P>LockIn is a focus-timer, task management, and team accountability platform. We provide it on an &ldquo;as-is&rdquo; basis. We work hard to keep it reliable, but we cannot guarantee uninterrupted access.</P>
            <P>We reserve the right to modify, suspend, or discontinue any part of the Service with reasonable notice. We will not delete your data without notice unless required by law or these Terms.</P>
          </Section>

          <Section title="3. Your account">
            <P>You must be 13 years or older to use LockIn. You are responsible for keeping your login credentials secure. You are responsible for all activity that occurs under your account.</P>
            <P>One person may not maintain multiple accounts. If we detect abuse, we may suspend or terminate accounts.</P>
          </Section>

          <Section title="4. Founders Advantage">
            <P>The first 100 users to create an account (&ldquo;Founders&rdquo;) are granted access to LockIn free of charge, with no time limit, as long as their account remains in good standing. This is a commitment, not a trial.</P>
            <P>If we introduce paid plans in the future, Founders will retain free access to all features available at the time of their signup, plus any features we add at the same tier.</P>
          </Section>

          <Section title="5. Acceptable use">
            <P>You agree not to:</P>
            <ul style={listStyle}>
              <li>Use the Service for any unlawful purpose or to violate any laws in your jurisdiction</li>
              <li>Attempt to gain unauthorized access to any part of the Service or another user&rsquo;s account</li>
              <li>Reverse-engineer, decompile, or attempt to extract the source code of the Service</li>
              <li>Use the Service to send spam, run bots, or scrape data at scale</li>
              <li>Harass, threaten, or impersonate other users</li>
              <li>Post or transmit any content that is illegal, harmful, or infringes third-party rights</li>
            </ul>
            <P>Violations may result in immediate account termination.</P>
          </Section>

          <Section title="6. Your content">
            <P>You own the content you create in LockIn — your tasks, project names, and notes. By using the Service, you grant us a limited licence to store and display that content to you and your authorized teammates, solely for the purpose of providing the Service.</P>
            <P>We do not claim ownership of your content. We do not sell it or use it to train AI models.</P>
          </Section>

          <Section title="7. Team visibility">
            <P>When you use LockIn within a team, certain information (your active session status, task titles you choose to share, your name) is visible to your teammates. This is a core feature of the Service. You accept this when you join or invite others to a workspace.</P>
          </Section>

          <Section title="8. Termination">
            <P>You may delete your account at any time from Settings. Deletion permanently removes all your data within 30 days.</P>
            <P>We may terminate or suspend your account if you violate these Terms, or if the account has been inactive for more than 24 consecutive months (with prior notice by email).</P>
          </Section>

          <Section title="9. Disclaimer of warranties">
            <P>The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses. Use the Service at your own risk.</P>
          </Section>

          <Section title="10. Limitation of liability">
            <P>To the fullest extent permitted by law, LockIn shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service — including, but not limited to, loss of data, loss of revenue, or loss of goodwill.</P>
            <P>Our total aggregate liability for any claim arising out of these Terms or your use of the Service shall not exceed the greater of $50 USD or the amount you paid us in the 12 months preceding the claim.</P>
          </Section>

          <Section title="11. Indemnification">
            <P>You agree to indemnify and hold harmless LockIn and its team members from any claims, damages, or expenses (including reasonable legal fees) arising from your use of the Service, your violation of these Terms, or your violation of any third-party rights.</P>
          </Section>

          <Section title="12. Governing law">
            <P>These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales, unless local law requires otherwise.</P>
          </Section>

          <Section title="13. Changes to these terms">
            <P>We may update these Terms as the product evolves. We will notify you by email at least 14 days before material changes take effect. Continued use of the Service after that date constitutes acceptance of the updated Terms.</P>
          </Section>

          <Section title="14. Contact">
            <P>For any questions about these Terms, contact us at <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>{CONTACT_EMAIL}</a>.</P>
          </Section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid #E5E7EB', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/privacy" style={footerLinkStyle}>Privacy Policy</Link>
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
const footerLinkStyle: React.CSSProperties = { color: '#9CA3AF', fontSize: 13, textDecoration: 'none', fontWeight: 500 }
