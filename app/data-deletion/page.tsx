import Link from 'next/link'
import { Trash2, Mail, Clock, CheckCircle, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Data Deletion Instructions – MyShiftX',
  description: 'How to request the deletion of your MyShiftX account and personal data.',
}

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-text/60 hover:text-text mb-8 min-h-0 min-w-0">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-warning" />
            </div>
            <h1 className="font-accent text-3xl font-bold text-text">Data Deletion Instructions</h1>
          </div>
          <p className="text-text/60 text-sm">
            Last updated: June 2026 &nbsp;·&nbsp;{' '}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </div>

        <div className="space-y-8 text-text/80 leading-relaxed">

          {/* Overview */}
          <section>
            <p className="text-base">
              MyShiftX is committed to your privacy. If you signed up using Facebook Login (or any
              other method) and would like your account and personal data permanently deleted, this
              page explains exactly how to do that.
            </p>
          </section>

          {/* What data we hold */}
          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">What Data We Store</h2>
            <p className="mb-3">When you create a MyShiftX account (via Facebook or email), we store:</p>
            <ul className="space-y-1.5 list-none pl-0">
              {[
                'Your email address',
                'Your display name (set by you)',
                'Your phone number (optional, if provided)',
                'Shift and request posts you have made',
                'Board memberships',
                'Comments and interest marks on posts',
                'Notification preferences',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-text/60">
              We do <strong>not</strong> store your Facebook password, payment details, or any data
              beyond what is listed above.
            </p>
          </section>

          {/* Option 1 — Self-service */}
          <section className="card shadow-sm border-l-4 border-l-primary">
            <h2 className="font-accent text-lg font-bold text-text mb-2">
              Option 1 — Delete Your Account Yourself
            </h2>
            <p className="text-sm mb-3">
              The fastest way is to deactivate your account directly from within the app:
            </p>
            <ol className="space-y-2 text-sm list-none pl-0 counter-reset">
              {[
                'Log in to MyShiftX',
                'Go to your Profile page',
                'Scroll to the Danger Zone section',
                'Click "Deactivate Account" and confirm',
              ].map((step, i) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="text-xs text-text/50 mt-3">
              This immediately deactivates your account and removes your posts from all boards.
              Full data purge occurs within 30 days.
            </p>
          </section>

          {/* Option 2 — Email request */}
          <section className="card shadow-sm border-l-4 border-l-info">
            <h2 className="font-accent text-lg font-bold text-text mb-2">
              Option 2 — Email Us a Deletion Request
            </h2>
            <p className="text-sm mb-3">
              If you no longer have access to your account, email us and we will delete your data
              manually within <strong>30 days</strong>.
            </p>
            <a
              href="mailto:support@myshiftx.com?subject=Data%20Deletion%20Request&body=Please%20delete%20all%20data%20associated%20with%20my%20account.%0A%0AEmail%20address%20used%20to%20register%3A%20"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Mail className="w-4 h-4" />
              support@myshiftx.com
            </a>
            <p className="text-xs text-text/50 mt-3">
              Please include the email address associated with your account so we can locate your data.
            </p>
          </section>

          {/* Timeline */}
          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">Deletion Timeline</h2>
            <div className="flex items-start gap-3 text-sm">
              <Clock className="w-4 h-4 text-text/40 shrink-0 mt-0.5" />
              <p>
                Once a deletion request is received or initiated, all personal data is permanently
                removed from our systems within <strong>30 days</strong>. Anonymised, aggregated
                data (e.g., total post counts) may be retained for analytics but cannot be linked
                back to you.
              </p>
            </div>
          </section>

          {/* Facebook specific */}
          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">Facebook Login Users</h2>
            <p className="text-sm mb-3">
              If you registered with Facebook Login, you can also revoke MyShiftX&apos;s access
              directly from Facebook without contacting us:
            </p>
            <ol className="space-y-2 text-sm list-none pl-0">
              {[
                'Go to Facebook Settings → Security and Login',
                'Click "Apps and Websites"',
                'Find MyShiftX and click "Remove"',
              ].map((step, i) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-info/15 text-info text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="text-xs text-text/50 mt-3">
              Revoking Facebook access prevents future logins but does not automatically delete your
              MyShiftX account data. To fully delete your data, follow Option 1 or Option 2 above.
            </p>
          </section>

          {/* Contact */}
          <section className="border-t border-border pt-6">
            <p className="text-sm text-text/60">
              Questions about your data?{' '}
              <a href="mailto:support@myshiftx.com" className="text-primary hover:underline">
                support@myshiftx.com
              </a>
              {' '}·{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              {' '}·{' '}
              <Link href="/terms" className="text-primary hover:underline">Terms &amp; Conditions</Link>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
