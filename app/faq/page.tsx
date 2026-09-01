import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { Footer } from '@/components/landing/Footer'
import { AdRail } from '@/components/features/AdRail'
import { createServerClient } from '@/lib/supabase/server'
import { getLandingHeaderData } from '@/lib/auth/session'

export const metadata = {
  title: 'Frequently Asked Questions',
  description:
    'How boards, trades, giveaways, requests, expiry, moderation, privacy, and pricing work on MyShiftX — answered plainly.',
  alternates: { canonical: '/faq' },
}

interface QA {
  q: string
  /** What the reader sees — may contain links. */
  a: React.ReactNode
  /**
   * The same answer as plain text, for the FAQPage structured data. Google
   * requires the markup to match the visible content, and JSX can't be
   * serialised into JSON-LD, so the two are kept deliberately in step here.
   */
  plain: string
}

const SECTIONS: { heading: string; items: QA[] }[] = [
  {
    heading: 'The basics',
    items: [
      {
        q: 'What is MyShiftX?',
        a: (
          <>
            A private shift board for a workplace. People post shifts they need covered and shifts
            they want to pick up, and coworkers sort it out between themselves. It replaces the
            group chat, the Facebook group, and the sign-up sheet in the break room.
          </>
        ),
        plain:
          'A private shift board for a workplace. People post shifts they need covered and shifts they want to pick up, and coworkers sort it out between themselves. It replaces the group chat, the Facebook group, and the sign-up sheet in the break room.',
      },
      {
        q: 'What is the difference between a trade, a giveaway, and a request?',
        a: (
          <>
            A <strong>trade</strong> means you are offering a shift and want one of theirs in
            return. A <strong>giveaway</strong> means you are handing it over with nothing expected
            back. A <strong>request</strong> is the opposite direction entirely — you need a
            specific date off and are asking whether anyone can take it. Every post says which it
            is, so nobody gets ambushed halfway through a conversation.
          </>
        ),
        plain:
          'A trade means you are offering a shift and want one of theirs in return. A giveaway means you are handing it over with nothing expected back. A request is the opposite direction entirely — you need a specific date off and are asking whether anyone can take it. Every post says which it is, so nobody gets ambushed halfway through a conversation.',
      },
      {
        q: 'Do posts stay up forever?',
        a: (
          <>
            No, and this is deliberate. A shift comes down thirty minutes before it starts; a
            coverage request comes down at the end of the day it is for. Nobody has to tidy up, and
            the board only ever shows things that can still happen — which is most of what makes it
            different from a chat thread.
          </>
        ),
        plain:
          'No, and this is deliberate. A shift comes down thirty minutes before it starts; a coverage request comes down at the end of the day it is for. Nobody has to tidy up, and the board only ever shows things that can still happen — which is most of what makes it different from a chat thread.',
      },
      {
        q: 'Does my employer have to set this up?',
        a: (
          <>
            No. Anyone can create a board for their team, location, or department and share an
            invite code with coworkers. There is no manager sign-off and no IT ticket. Boards are
            run by the people on them.
          </>
        ),
        plain:
          'No. Anyone can create a board for their team, location, or department and share an invite code with coworkers. There is no manager sign-off and no IT ticket. Boards are run by the people on them.',
      },
    ],
  },
  {
    heading: 'Boards and members',
    items: [
      {
        q: 'Who can see my board?',
        a: (
          <>
            Only approved members. Boards are private and invite-only — they are not listed, not
            searchable, and not visible to anyone outside them. Someone has to have the invite code
            and be approved to join.
          </>
        ),
        plain:
          'Only approved members. Boards are private and invite-only — they are not listed, not searchable, and not visible to anyone outside them. Someone has to have the invite code and be approved to join.',
      },
      {
        q: 'Who decides which roles and locations I can post under?',
        a: (
          <>
            The board&apos;s leader approves them. That is what stops the board filling up with
            posts for positions nobody on it actually works, and it is why you can trust that a
            shift labelled for your role really is one you could take.
          </>
        ),
        plain:
          "The board's leader approves them. That is what stops the board filling up with posts for positions nobody on it actually works, and it is why you can trust that a shift labelled for your role really is one you could take.",
      },
      {
        q: 'Can I be on more than one board?',
        a: (
          <>
            Yes. People who work multiple properties or hold two jobs are one of the main reasons
            filtering exists — you can see everything at once, or narrow to a single board.
          </>
        ),
        plain:
          'Yes. People who work multiple properties or hold two jobs are one of the main reasons filtering exists — you can see everything at once, or narrow to a single board.',
      },
      {
        q: 'What if somebody posts something they should not?',
        a: (
          <>
            Any member can flag a post, and board moderators review flags and can remove content.
            Moderation is handled by the board rather than by us, on the basis that the people on a
            board know their workplace better than we ever will.
          </>
        ),
        plain:
          'Any member can flag a post, and board moderators review flags and can remove content. Moderation is handled by the board rather than by us, on the basis that the people on a board know their workplace better than we ever will.',
      },
    ],
  },
  {
    heading: 'Trading shifts',
    items: [
      {
        q: 'Does a trade on MyShiftX count as approved at work?',
        a: (
          <>
            No — and this catches people out. MyShiftX handles the part where two people find each
            other and agree. Whether your employer needs to approve the change, and who has to tell
            them, depends entirely on your workplace. We wrote a{' '}
            <Link href="/blog/getting-coverage-approved" className="text-primary hover:underline">
              list of questions worth asking your scheduler
            </Link>{' '}
            so you know the rules before you need them.
          </>
        ),
        plain:
          'No — and this catches people out. MyShiftX handles the part where two people find each other and agree. Whether your employer needs to approve the change, and who has to tell them, depends entirely on your workplace. We have written a list of questions worth asking your scheduler so you know the rules before you need them.',
      },
      {
        q: 'How do I know a shift is worth taking?',
        a: (
          <>
            Each post carries the date, hours, position, board, and whether overtime has been
            approved, so you can judge most of it without messaging anyone. For the parts that are
            not on the post — how busy the day is, who else is on, how you get home — see{' '}
            <Link href="/blog/what-makes-a-trade-fair" className="text-primary hover:underline">
              what makes a trade fair
            </Link>
            .
          </>
        ),
        plain:
          'Each post carries the date, hours, position, board, and whether overtime has been approved, so you can judge most of it without messaging anyone. For the parts that are not on the post — how busy the day is, who else is on, how you get home — see our guide to what makes a trade fair.',
      },
      {
        q: 'Do I have to give out my phone number?',
        a: (
          <>
            No. You message people through their post, and contact details stay private unless you
            choose to share them.
          </>
        ),
        plain:
          'No. You message people through their post, and contact details stay private unless you choose to share them.',
      },
    ],
  },
  {
    heading: 'Privacy and cost',
    items: [
      {
        q: 'Is it free?',
        a: (
          <>
            The core board — posting, trading, requests, messages, and the calendar — is free. A
            paid tier removes ads and adds extras like calendar sync to Apple or Google Calendar.
            Details are on the{' '}
            <Link href="/upgrade" className="text-primary hover:underline">pricing page</Link>.
          </>
        ),
        plain:
          'The core board — posting, trading, requests, messages, and the calendar — is free. A paid tier removes ads and adds extras like calendar sync to Apple or Google Calendar.',
      },
      {
        q: 'Can my employer see what I post?',
        a: (
          <>
            There is no employer dashboard and no reporting upward. A manager who is a member of a
            board sees what any other member sees, and nothing else. We do not sell workforce
            analytics.
          </>
        ),
        plain:
          'There is no employer dashboard and no reporting upward. A manager who is a member of a board sees what any other member sees, and nothing else. We do not sell workforce analytics.',
      },
      {
        q: 'What do you do with my data?',
        a: (
          <>
            What we collect and why is set out in full in the{' '}
            <Link href="/privacy" className="text-primary hover:underline">privacy policy</Link>. If
            you want your account and data removed, the{' '}
            <Link href="/data-deletion" className="text-primary hover:underline">data deletion page</Link>{' '}
            explains how.
          </>
        ),
        plain:
          'What we collect and why is set out in full in our privacy policy. If you want your account and data removed, the data deletion page explains how.',
      },
      {
        q: 'Why are there ads?',
        a: (
          <>
            They keep the free tier free. Members on the paid tier do not see them. Our{' '}
            <Link href="/privacy" className="text-primary hover:underline">privacy policy</Link>{' '}
            covers what third-party advertising cookies do and how to control them.
          </>
        ),
        plain:
          'They keep the free tier free. Members on the paid tier do not see them. Our privacy policy covers what third-party advertising cookies do and how to control them.',
      },
    ],
  },
]

export default async function FaqPage() {
  const headerData = await getLandingHeaderData(createServerClient())

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SECTIONS.flatMap(s =>
      s.items.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.plain },
      }))
    ),
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingHeader {...headerData} />

      <main className="flex-1">
        <AdRail showAds hasBottomNav={false}>
          <div className="max-w-3xl mx-auto px-4 py-12">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-text/60 hover:text-text mb-8"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>

            <h1 className="font-accent text-3xl md:text-4xl font-bold text-text mb-2">
              Frequently Asked Questions
            </h1>
            <p className="text-text/55 mb-10">
              How boards, trades, moderation, privacy, and pricing actually work.
            </p>

            <div className="space-y-10">
              {SECTIONS.map(section => (
                <section key={section.heading}>
                  <h2 className="font-accent text-xl font-bold text-text mb-4 pb-2 border-b border-border">
                    {section.heading}
                  </h2>
                  <dl className="space-y-5">
                    {section.items.map(item => (
                      <div key={item.q} className="card shadow-sm">
                        <dt className="font-accent font-bold text-text mb-2">{item.q}</dt>
                        <dd className="text-sm text-text/70 leading-relaxed">{item.a}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>

            <div className="card bg-primary-light/40 border-none mt-12 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <h2 className="font-accent text-xl font-bold text-text mb-1">
                  Still have a question?
                </h2>
                <p className="text-sm text-text/60">We read everything that comes in.</p>
              </div>
              <Link href="/contact" className="btn btn-primary gap-2 shrink-0 min-h-0 h-11 px-6">
                Contact us
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </AdRail>
      </main>

      <Footer />
    </div>
  )
}
