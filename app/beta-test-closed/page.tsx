import Link from 'next/link'
import { isSurveyClosed } from '@/lib/beta-schedule'

export const metadata = { title: 'Beta Testing Has Wrapped Up – MyShiftX' }

export default function BetaTestClosedPage() {
  const surveyClosed = isSurveyClosed()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="font-accent text-3xl font-bold text-text mb-2">The beta has wrapped up</h1>
        <p className="text-text/50 text-sm mb-8">Closed July 4, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-text/80">

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">What happened</h2>
            <p>
              Beta testing with this group has concluded. MyShiftX went fully dark at{' '}
              <strong className="text-text">11:59 PM on Saturday, July 4th</strong> while I process
              everyone&rsquo;s feedback.{' '}
              {surveyClosed ? (
                'The survey has since closed — thank you to everyone who responded.'
              ) : (
                <>
                  If you haven&rsquo;t already, you can still{' '}
                  <Link href="/survey" className="text-primary underline hover:text-primary/70">fill out the survey</Link>{' '}
                  — it&rsquo;s the single biggest thing that shapes what happens next.
                </>
              )}
            </p>
          </section>

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">Why</h2>
            <p>
              This is a passion project for me that I have been dreaming about for years. I&rsquo;ve been working on it tirelessly, and the feedback from this beta group is invaluable in shaping the final product. I want to make sure that I roll this out without any conflicts while working for a large company and sharing it with its employees, my coworkers and most of all... you, my friends. I know this was short notice, but your input has been crucial. Thank you!
            </p>
          </section>

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">What&rsquo;s next</h2>
            <p>
              This isn&rsquo;t the end of MyShiftX — the plan is to take everything from this beta and roll out the
              full site soon. Thank you for being some of the very first people to use it, break it, and tell me
              what needed to change.
            </p>
          </section>

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">Questions?</h2>
            <p>
              I sent a message directly to everyone through MyShiftX&rsquo;s own messaging system before the site
              went dark, but feel free to reach out any time at{' '}
              <a href="mailto:support@myshiftx.com" className="text-primary hover:underline">support@myshiftx.com</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
