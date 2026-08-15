import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ShowcaseBanner } from '@/components/showcase/ShowcaseBanner'
import { ShowcaseMessages } from '@/components/showcase/ShowcaseMessages'
import { Prose } from '@/components/ui/Prose'
import { getShowcaseConversations } from '@/lib/showcase/render'

export const metadata = {
  title: 'Messages — Sorting Out a Trade Without the Group Chat',
  description:
    'How direct messages work on MyShiftX: every conversation attached to the shift it is about, so a trade gets settled in one thread instead of scattered across a group chat.',
}

export const revalidate = 3600

export default function PreviewMessagesPage() {
  const conversations = getShowcaseConversations()

  return (
    <>
      {/* No AdRail here by design — a private inbox carries no publisher
       * content, so it is off the ad-enabled list in AdRail.tsx. */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        <h1 className="font-accent text-3xl md:text-4xl font-bold text-text mb-3">
          Messages
        </h1>

        <ShowcaseBanner what="These conversations are written examples, not real messages between real people." />

        <Prose className="max-w-3xl mb-8">
          <p>
            Posting a shift is the easy part. The friction is everything after: working out
            whether it is a straight giveaway or a swap, whether the other person is actually
            certified for your position, and who is telling the scheduler.
          </p>
          <p>
            On MyShiftX that conversation is attached to the shift it is about. Open a thread and
            you can see which post started it, which board it belongs to, and what was agreed —
            rather than scrolling back through a group chat trying to remember whether Marcus said
            yes to Thursday or Friday.
          </p>
          <p>
            Contact details stay private. You message somebody through their post; nobody has to
            hand out a phone number to a coworker they have met twice, and nobody has to join a
            Facebook group under their real name to pick up a shift.
          </p>
          <p>
            Threads are one-to-one by design. There is no channel where forty people are notified
            every time somebody says &ldquo;bump&rdquo;, which is the single most common reason
            people mute the workplace group chat and then miss the shift they wanted.
          </p>
        </Prose>

        <ShowcaseMessages conversations={conversations} />

        <div className="card bg-primary-light/40 border-none mt-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h2 className="font-accent text-xl font-bold text-text mb-1">
              There are unwritten rules to this
            </h2>
            <p className="text-sm text-text/60">
              What to say, what to confirm, and how not to become the person nobody trades with.
            </p>
          </div>
          <Link
            href="/blog/shift-trading-etiquette"
            className="btn btn-primary gap-2 shrink-0 min-h-0 h-11 px-6"
          >
            Read the etiquette guide
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  )
}
