import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Beta Testing Update – MyShiftX' }

export default function BetaTestPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/wall" className="inline-flex items-center gap-1.5 text-sm text-text/60 hover:text-text mb-8 min-h-0 min-w-0">
          <ArrowLeft className="w-4 h-4" /> Back to the Wall
        </Link>

        <h1 className="font-accent text-3xl font-bold text-text mb-2">The beta is wrapping up</h1>
        <p className="text-text/50 text-sm mb-8">Posted July 4, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-text/80">

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">What&rsquo;s happening</h2>
            <p>
              Beta testing with this group is concluding. MyShiftX will go fully dark, tonight at{' '}
              <strong className="text-text">11:59 PM on Saturday, July 4th</strong> while I process everyone&rsquo;s
              feedback. If you haven&rsquo;t already, please{' '}
              <Link href="/survey" className="text-primary underline hover:text-primary/70">fill out the survey</Link>{' '}
              before then — it&rsquo;s the single biggest thing that shapes what happens next.
            </p>
          </section>

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">Why now</h2>
            <p>
              This is a passion project for me that I have been dreaming about for years. I&rsquo;ve been working on it tirelessly, and the feedback from this beta group is invaluable in shaping the final product. I want to make sure that I roll this out without any conflicts while working for a large company and sharing it with its employees, my coworkers and most of all... you, my friends.  I know this was short notice, but your input has been crucial. Thank you!
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
              I&rsquo;ll be sending a message directly to everyone through MyShiftX&rsquo;s own messaging system, but
              feel free to reach out any time at{' '}
              <a href="mailto:support@myshiftx.com" className="text-primary hover:underline">support@myshiftx.com</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
