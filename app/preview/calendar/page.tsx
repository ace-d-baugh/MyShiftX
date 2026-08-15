import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ShowcaseBanner } from '@/components/showcase/ShowcaseBanner'
import { ShowcaseCalendar } from '@/components/showcase/ShowcaseCalendar'
import { Prose } from '@/components/ui/Prose'
import { getShowcaseCalendar } from '@/lib/showcase/render'

export const metadata = {
  title: 'The Calendar — Your Whole Schedule in One Place',
  description:
    'How the MyShiftX calendar works: your own shifts, the ones you have traded away, and the coverage your coworkers are looking for, all on one month view.',
}

export const revalidate = 3600

export default function PreviewCalendarPage() {
  const month = getShowcaseCalendar()

  return (
    <>
      {/* No AdRail here by design — a month grid is a navigation surface, so
       * it is off the ad-enabled list in AdRail.tsx. */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        <h1 className="font-accent text-3xl md:text-4xl font-bold text-text mb-3">
          The Calendar
        </h1>

        <ShowcaseBanner what="The month below is filled with sample shifts so you can see the layout." />

        <Prose className="max-w-3xl mb-8">
          <p>
            Most shift workers keep their schedule in three places at once: a photo of the paper
            rota on their phone, a work app that logs them out every other week, and their own
            memory. The calendar exists to collapse those into one view.
          </p>
          <p>
            Shifts you post to the Wall show up here automatically, colour-coded by whether you
            offered them as a trade or a giveaway. When somebody takes one, it stays on your
            calendar marked as handed off rather than vanishing — because handoffs occasionally
            fall through, and a shift silently disappearing from your schedule is how people end
            up as a no-show.
          </p>
          <p>
            You can also see what your coworkers need. Days where somebody on your board is
            looking for coverage are marked, so if you are trying to pick up hours you can scan a
            month rather than scroll a feed.
          </p>
          <p>
            For members on the paid tier the calendar syncs out to Apple Calendar, Google
            Calendar, or anything else that speaks iCal, so your work schedule sits next to the
            rest of your life instead of in a separate app.
          </p>
        </Prose>

        <ShowcaseCalendar month={month} />

        <div className="card bg-primary-light/40 border-none mt-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h2 className="font-accent text-xl font-bold text-text mb-1">
              Rotating schedule wearing you down?
            </h2>
            <p className="text-sm text-text/60">
              We wrote a practical guide to keeping track of one without losing your week.
            </p>
          </div>
          <Link
            href="/blog/reading-a-rotating-schedule"
            className="btn btn-primary gap-2 shrink-0 min-h-0 h-11 px-6"
          >
            Read the guide
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  )
}
