import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { getPublicShowAds, getLandingHeaderData } from '@/lib/auth/session'
import { AdRail } from '@/components/features/AdRail'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { Footer } from '@/components/landing/Footer'
import { INDUSTRIES } from '@/lib/landing/industries'
import { SHOWCASE_MODE } from '@/lib/showcase/mode'

export const metadata = {
  title: 'About Us – MyShiftX',
  description:
    'Who builds MyShiftX, why a dedicated shift board beats a group chat, and how private workplace boards, trades, giveaways, and coverage requests actually work.',
  alternates: { canonical: '/about' },
}

export default async function AboutPage() {
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
        <h1 className="font-accent text-3xl font-bold text-text mb-2">About MyShiftX</h1>
        <p className="text-text/50 text-sm mb-8">The shift trading board built for shift workers.</p>

        <div className="space-y-6 text-text/80 text-sm leading-relaxed">

          <section className="card shadow-sm">
            <h2 className="font-accent text-xl font-bold text-text mb-3">What we do</h2>
            <p>
              MyShiftX replaces the messy, chaotic ways hourly teams swap shifts. Instead of
              tracking trades across fragmented group chats, buried text threads, or paper
              sign-up sheets in a breakroom, we give teams a dedicated, searchable board to
              organize their schedules — post a shift you need covered, request one you want
              to pick up, and keep it all on one calendar.
            </p>
          </section>

          <section className="card shadow-sm">
            <h2 className="font-accent text-xl font-bold text-text mb-3">Why we built it</h2>
            <p>
              Shift work requires constant flexibility. People need to pick up extra hours,
              cover for unexpected life events, and balance school or family. But when
              coordination happens via screenshots of paper schedules texted back and forth,
              things get missed. We built MyShiftX because managing your livelihood
              shouldn&apos;t feel like a second job. Your schedule should just work.
            </p>
            <p className="mt-3">
              The specific frustration that started it is one most shift workers will recognise:
              you post a shift to the workplace group chat, it scrolls out of sight within the
              hour, and the people who most want extra hours never see it — because they were at
              work. Meanwhile the chat is still full of shifts from three weeks ago that look
              exactly like live ones. We wrote about that at length in{' '}
              <Link href="/blog/group-chats-fail-shift-workers" className="text-primary hover:underline">
                why group chats keep failing shift workers
              </Link>
              .
            </p>
          </section>

          <section className="card shadow-sm">
            <h2 className="font-accent text-xl font-bold text-text mb-3">How it works</h2>
            <p>
              Anyone can spin up a board for their specific team, location, or department in
              seconds and share a secure invite code with their co-workers — no manager
              sign-off, no IT ticket. Once your team is in, anyone can post an offer, claim a
              shift, or coordinate directly on the Wall. Built-in moderation tools keep board
              admins in control of who joins and what gets posted, so the board stays as
              trustworthy as the people on it.
            </p>
            <ul className="mt-4 space-y-2.5 list-disc pl-5 text-text/70">
              <li>
                <strong className="text-text">Post a shift</strong> as a trade (you want one back)
                or a giveaway (you just need it covered). Date, hours, position, location, and
                whether overtime is approved all travel with the post.
              </li>
              <li>
                <strong className="text-text">Post a request</strong> when you need a specific date
                off, with the time blocks that would work for you.
              </li>
              <li>
                <strong className="text-text">Everything expires automatically</strong> — shifts
                thirty minutes before they start, requests at the end of the day they&apos;re for.
                The board never fills up with things that already happened.
              </li>
              <li>
                <strong className="text-text">Filters know your roles and locations</strong>, so you
                only see what you could actually work.
              </li>
              <li>
                <strong className="text-text">Messages attach to the shift</strong> they&apos;re
                about, and contact details stay private — no handing your phone number to a coworker
                you&apos;ve met twice.
              </li>
              <li>
                <strong className="text-text">One calendar</strong> holds your own shifts, the ones
                you&apos;ve handed off, and the days your board needs covered.
              </li>
            </ul>
          </section>

          <section className="card shadow-sm">
            <h2 className="font-accent text-xl font-bold text-text mb-3">Who it&apos;s for</h2>
            <p>
              Anyone whose hours are assigned rather than chosen: someone working two jobs who needs
              to move one Thursday, a parent coordinating around childcare, a student whose exam
              week collides with a rotation, and the person who simply wants more hours than the
              rota gave them and cannot find out who is giving them up.
            </p>
            <p className="mt-3">
              It is built for the workers rather than for management. Boards are created and run by
              the people on them. There is no employer dashboard, no productivity monitoring, and
              nothing reported upward — trading shifts is between the people working them.
            </p>
          </section>

          <section className="card shadow-sm">
            <h2 className="font-accent text-xl font-bold text-text mb-3">Built for teams in:</h2>
            <div className="flex flex-wrap gap-3">
              {INDUSTRIES.map(industry => (
                <Link
                  key={industry.slug}
                  href={`/for#${industry.slug}`}
                  className="inline-block bg-background border border-primary/20 text-text rounded-full px-4 py-1.5 text-sm font-medium hover:border-primary/50 hover:shadow-sm transition-all duration-200 min-h-0 min-w-0"
                >
                  {industry.shortName}
                </Link>
              ))}
            </div>
            <p className="mt-4 text-text/60">
              …and any other workplace that runs on fixed shifts. If yours isn&apos;t listed,
              it still works — boards are workplace-agnostic.
            </p>
          </section>

          <section className="card shadow-sm">
            <h2 className="font-accent text-xl font-bold text-text mb-3">Who&apos;s behind MyShiftX</h2>
            <p>
              MyShiftX is operated by Digital Elegance LLC, a Florida-based company. MyShiftX is an
              independent platform — it is not affiliated with, sponsored by, or endorsed by any
              specific employer, and all trademarks referenced on this site are the property of
              their respective owners.
            </p>
            <p className="mt-3">
              Have a question, feedback, or a workplace you&apos;d like to see supported? Visit our{' '}
              <Link href="/contact" className="text-primary hover:underline">Contact page</Link>, or
              start with the{' '}
              <Link href="/faq" className="text-primary hover:underline">FAQ</Link>.
            </p>
          </section>

          {/* CTA */}
          <section className="rounded-xl bg-primary text-center px-6 py-10">
            <h2 className="font-accent text-2xl font-bold text-white mb-2">
              {SHOWCASE_MODE ? 'See it in action' : "Ready to fix your team's schedule?"}
            </h2>
            <p className="text-white/80 mb-6">
              {SHOWCASE_MODE
                ? 'Walk through the Wall, the calendar, and how a trade gets settled.'
                : 'Create a board for your workplace in under two minutes.'}
            </p>
            <Link
              href={SHOWCASE_MODE ? '/wall' : '/register'}
              className="inline-flex items-center gap-2 bg-white text-primary font-bold rounded-md px-8 py-3 text-base hover:bg-white/90 hover:scale-105 transition-all duration-200 group min-h-0"
            >
              {SHOWCASE_MODE ? 'Explore the demo' : 'Get Started'}
              <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </section>

        </div>
      </div>
        </AdRail>
      </main>
      <Footer />
    </div>
  )
}
