import Link from 'next/link'
import { ArrowLeft, Mail, ShieldCheck, HelpCircle } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { getPublicShowAds, getLandingHeaderData } from '@/lib/auth/session'
import { AdRail } from '@/components/features/AdRail'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { Footer } from '@/components/landing/Footer'

// The root layout appends " – MyShiftX" via its title template.
export const metadata = { title: 'Contact Us', alternates: { canonical: '/contact' } }

export default async function ContactPage() {
  const supabase = createServerClient()
  const [showAds, headerData] = await Promise.all([
    getPublicShowAds(supabase),
    getLandingHeaderData(supabase),
  ])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingHeader {...headerData} />
      <main className="flex-1">
        <AdRail showAds={showAds} hasBottomNav={false}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-text/60 hover:text-text mb-8 min-h-0 min-w-0">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="font-accent text-3xl font-bold text-text mb-2">Contact Us</h1>
        <p className="text-text/50 text-sm mb-8">We&apos;d love to hear from you.</p>

        <div className="space-y-3 text-sm text-text/70 leading-relaxed mb-8">
          <p>
            MyShiftX is built and run by a small team, so every message below reaches an actual
            person rather than a support queue. Pick whichever address matches what you need — it
            gets there faster than one general inbox sorting it out afterward.
          </p>
          <p>
            Most questions we get are some version of &ldquo;how do I get my whole team using
            this?&rdquo; or &ldquo;can it do X?&rdquo; Both are welcome. If you run a shift board
            for retail, restaurants, warehouses, hospitality, or anywhere else that runs on a
            posted schedule, we want to hear what is and is not working for you.
          </p>
        </div>

        <div className="space-y-4">
          <div className="card shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-accent font-bold text-text mb-1">General Support</h2>
              <p className="text-sm text-text/70 mb-2">
                Questions, feedback, or trouble using MyShiftX? Reach out and we&apos;ll get back to you.
              </p>
              <a href="mailto:support@myshiftx.com" className="text-primary hover:underline font-medium">
                support@myshiftx.com
              </a>
            </div>
          </div>

          <div className="card shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-accent font-bold text-text mb-1">Legal &amp; DMCA</h2>
              <p className="text-sm text-text/70 mb-2">
                Copyright concerns or legal inquiries related to the Service.
              </p>
              <a href="mailto:dmca@myshiftx.com" className="text-primary hover:underline font-medium">
                dmca@myshiftx.com
              </a>
            </div>
          </div>

          <div className="card shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-accent font-bold text-text mb-1">Help &amp; Support</h2>
              <p className="text-sm text-text/70 mb-2">
                Already have an account? Our in-app Help &amp; Support page covers common questions
                about boards, shifts, and notifications.
              </p>
              <Link href="/help" className="text-primary hover:underline font-medium">
                Visit Help &amp; Support
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border">
          <h2 className="font-accent font-bold text-text mb-4">Before You Write In</h2>
          <div className="space-y-4 text-sm text-text/70 leading-relaxed">
            <div>
              <p className="font-medium text-text mb-1">How fast do you actually respond?</p>
              <p>
                Within 2 business days for most messages, usually sooner. Account-access issues
                and anything affecting your ability to see or trade shifts get priority over
                general feedback.
              </p>
            </div>
            <div>
              <p className="font-medium text-text mb-1">
                Can I request a feature or report a bug?
              </p>
              <p>
                Yes — that is most of what General Support handles. Include what you were trying
                to do and what happened instead; for a bug, the board and browser you were using
                helps us reproduce it faster.
              </p>
            </div>
            <div>
              <p className="font-medium text-text mb-1">
                Do you offer phone support?
              </p>
              <p>
                Not yet. Email keeps a written record of the request, which matters for
                account-recovery and billing questions, so it is the one channel we staff
                properly rather than splitting attention across several.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-xs text-text/40">
          <p>MyShiftX is operated by Digital Elegance LLC d/b/a MyShiftX.</p>
          <p className="mt-1">We aim to respond to all inquiries within 2 business days.</p>
        </div>
      </div>
        </AdRail>
      </main>
      <Footer />
    </div>
  )
}
