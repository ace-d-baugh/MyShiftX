import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AdRail } from '@/components/features/AdRail'
import { ShowcaseBanner } from '@/components/showcase/ShowcaseBanner'
import { ShowcaseShiftCard } from '@/components/showcase/ShowcaseShiftCard'
import { ShowcaseRequestCard } from '@/components/showcase/ShowcaseRequestCard'
import { Prose } from '@/components/ui/Prose'
import { getShowcaseWall } from '@/lib/showcase/render'

export const metadata = {
  // No brand suffix here — the root layout's title template appends "– MyShiftX".
  title: 'The Wall — See How Shift Trading Works',
  description:
    'A walkthrough of the MyShiftX Wall: how shift trades, giveaways, and coverage requests are posted, filtered, and claimed by coworkers on a private workplace board.',
  // Middleware rewrites the real /wall to this route; the canonical points
  // back at /wall (not /preview/wall, which robots.txt disallows) so a
  // crawler doesn't see two different URLs for the same content.
  alternates: { canonical: '/wall' },
}

// Sample data, but the dates are computed relative to render time — hourly is
// often enough to keep "Tomorrow" honest without rebuilding on every hit.
export const revalidate = 3600

export default function PreviewWallPage() {
  const { shifts, requests, boards } = getShowcaseWall()

  return (
    <>
      <AdRail showAds hasBottomNav={false}>
        <div className="max-w-6xl mx-auto px-4 py-8">

          <h1 className="font-accent text-3xl md:text-4xl font-bold text-text mb-3">
            The Wall
          </h1>

          <ShowcaseBanner what="Every shift, request, and name below is sample data used to show how the Wall works." />

          {/* Real explanatory content — this is the page's actual value, not the card grid. */}
          <Prose className="max-w-3xl mb-10">
            <p>
              The Wall is the single place a workplace posts shifts it needs covered. It replaces
              the group chat where an offer scrolls out of sight in ten minutes, and the Facebook
              group where half the posts are from people who left the company a year ago.
            </p>
            <p>
              Two things get posted here. A <strong className="text-text">shift</strong> is one
              somebody already has and wants to hand off — either as a{' '}
              <strong className="text-primary">trade</strong> (they want one of yours back) or a{' '}
              <strong className="text-success">giveaway</strong> (they just need it gone). A{' '}
              <strong className="text-info">request</strong> is the reverse: somebody needs a
              specific date off and is asking whether anyone can take it.
            </p>
            <p>
              Every post carries the date, the hours, the board it belongs to, and whether overtime
              has been approved, so you can tell at a glance whether a shift is worth taking without
              messaging anyone. Posts expire automatically — shifts thirty minutes before they
              start, requests at the end of the day they&apos;re for — so the board is never full of
              things that already happened. That single rule is most of the difference between this
              and a group chat.
            </p>
            <p>
              Boards are private and invite-only. Members join a specific workplace, and a board&apos;s
              leader approves the roles and locations people can post under, so you are trading with
              actual coworkers rather than strangers.
            </p>
          </Prose>

          {/* Sample boards */}
          <div className="mb-10">
            <h2 className="font-accent text-lg font-bold text-text mb-3">Boards in this demo</h2>
            <div className="flex flex-wrap gap-2">
              {boards.map(b => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-1.5 text-sm text-text/70"
                >
                  {b.name}
                  <span className="text-[11px] text-text/40">{b.industry}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Offers */}
          <section className="mb-12">
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <h2 className="font-accent text-2xl font-bold text-text">Shifts up for grabs</h2>
              <span className="text-sm text-text/50">{shifts.length} open</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {shifts.map(shift => (
                <ShowcaseShiftCard key={shift.id} shift={shift} />
              ))}
            </div>
          </section>

          {/* Requests */}
          <section className="mb-12">
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <h2 className="font-accent text-2xl font-bold text-text">Coverage requests</h2>
              <span className="text-sm text-text/50">{requests.length} open</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {requests.map(request => (
                <ShowcaseRequestCard key={request.id} request={request} />
              ))}
            </div>
          </section>

          <div className="card bg-primary-light/40 border-none flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <h2 className="font-accent text-xl font-bold text-text mb-1">
                Want the reasoning behind all this?
              </h2>
              <p className="text-sm text-text/60">
                We wrote up why group chats and Facebook groups keep failing shift workers.
              </p>
            </div>
            <Link href="/blog" className="btn btn-primary gap-2 shrink-0 min-h-0 h-11 px-6">
              Read the blog
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </AdRail>
    </>
  )
}
