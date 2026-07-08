import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { getPublicShowAds } from '@/lib/auth/session'
import { AdRail } from '@/components/features/AdRail'

export const metadata = { title: 'About Us – MyShiftX' }

export default async function AboutPage() {
  const showAds = await getPublicShowAds(createServerClient())

  return (
    <AdRail showAds={showAds} hasBottomNav={false}>
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-text/60 hover:text-text mb-8 min-h-0 min-w-0">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="font-accent text-3xl font-bold text-text mb-2">About MyShiftX</h1>
        <p className="text-text/50 text-sm mb-8">The shift trading board built for shift workers.</p>

        <div className="prose prose-sm max-w-none space-y-6 text-text/80">

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">What we do</h2>
            <p>
              MyShiftX is a shift trading and scheduling board for people who work fixed shifts —
              retail associates, restaurant staff, warehouse crews, hotel and resort teams, theme
              park cast members, and event venue staff. Instead of trading shifts over group chats,
              paper sign-up sheets, or word of mouth, MyShiftX gives every workplace a shared board
              where people can post shifts they want to give away or trade, request coverage they
              need, and keep their whole schedule in one calendar.
            </p>
          </section>

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">Why we built it</h2>
            <p>
              Shift work runs on flexibility — people picking up extra hours, covering for each
              other, and swapping shifts around school, family, and life. That coordination usually
              happens in the messiest way possible: scattered texts, group chats nobody reads
              closely, and screenshots of paper schedules. MyShiftX exists to put that coordination
              in one place, organized by workplace, searchable, and easy to act on.
            </p>
          </section>

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">How it works</h2>
            <p>
              Leaders create a board for their team and share an invite code. From there, anyone
              on the board can post a shift offer or a request, mark interest in someone else&apos;s
              post, and message directly to work out the details. Everything is organized by date
              on a shared Wall and a personal calendar, with moderation tools so board leaders stay
              in control of who joins and what gets posted.
            </p>
          </section>

          <section>
            <h2 className="font-accent text-xl font-bold text-text mb-3">Who&apos;s behind MyShiftX</h2>
            <p>
              MyShiftX is operated by Digital Elegance LLC, a Florida-based company. MyShiftX is an
              independent platform — it is not affiliated with, sponsored by, or endorsed by any
              specific employer, and all trademarks referenced on this site are the property of
              their respective owners.
            </p>
            <p className="mt-3">
              Have a question, feedback, or a workplace you&apos;d like to see supported? Visit our{' '}
              <Link href="/contact" className="text-primary hover:underline">Contact page</Link>.
            </p>
          </section>

        </div>
      </div>
    </div>
    </AdRail>
  )
}
