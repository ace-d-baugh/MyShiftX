import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Terms & Conditions – MyShiftX' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-text/60 hover:text-text mb-8 min-h-0 min-w-0">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="font-accent text-3xl font-bold text-text mb-2">Terms &amp; Conditions</h1>
        <p className="text-text/50 text-sm mb-8">Last updated: January 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-text/80">
          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">1. Acceptance of Terms</h2>
            <p>By registering for and using MyShiftX (&ldquo;the Service&rdquo;), you agree to be bound by these Terms &amp; Conditions. If you do not agree, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">2. Eligibility</h2>
            <p>You must be at least 16 years old to use the Service. By registering, you represent and warrant that all information you provide is accurate and that you will use the Service in good faith.</p>
          </section>

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">3. Disclaimer of Affiliation</h2>
            <p>MyShiftX is an independent platform and is <strong>not</strong> affiliated with, authorized by, endorsed by, or in any way officially connected with any specific employer whose shifts may be posted or discussed by users. All trademarks, service marks, and trade names referenced on the platform are property of their respective owners.</p>
          </section>

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">4. User Conduct</h2>
            <p>You agree to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Post only accurate and honest shift information</li>
              <li>Not post shifts you do not personally hold or control</li>
              <li>Not harass, threaten, or demean other users</li>
              <li>Not use the platform for any commercial purpose</li>
              <li>Comply with all applicable policies and agreements with your employer related to any shifts posted or accepted through the Service</li>
              <li>Not attempt to circumvent any security measures</li>
            </ul>
          </section>

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">5. Shift Transactions</h2>
            <p>MyShiftX facilitates communication between users. We do not guarantee successful shift trades or giveaways. All shift arrangements are solely between the users involved. Always ensure shift changes comply with your employer&apos;s scheduling policies and your leadership.</p>
          </section>

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">6. Account Termination</h2>
            <p>We reserve the right to deactivate accounts that violate these terms, post false information, or engage in conduct detrimental to the community.</p>
          </section>

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">7. Limitation of Liability</h2>
            <p>MyShiftX is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any damages arising from your use of the Service, failed shift arrangements, or any disciplinary actions by your employer.</p>
          </section>

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">8. Changes to Terms</h2>
            <p>We may update these Terms at any time. Continued use of the Service constitutes acceptance of updated Terms.</p>
          </section>

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">9. Contact</h2>
            <p>For questions about these Terms, please contact us through the platform.</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-xs text-text/40 text-center">
            MyShiftX is an independent platform and is not affiliated with, sponsored by, or endorsed by any specific employer.
          </p>
        </div>
      </div>
    </div>
  )
}
