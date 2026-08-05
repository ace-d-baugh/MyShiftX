import type { BlogPost } from '@/lib/blog/types'
import GroupChatsBody from '@/lib/blog/posts/group-chats-fail-shift-workers'
import EtiquetteBody from '@/lib/blog/posts/shift-trading-etiquette'
import RotatingScheduleBody from '@/lib/blog/posts/reading-a-rotating-schedule'
import FairTradeBody from '@/lib/blog/posts/what-makes-a-trade-fair'
import CoverageApprovedBody from '@/lib/blog/posts/getting-coverage-approved'
import NightsBody from '@/lib/blog/posts/working-nights-without-wrecking-your-week'
import ShiftPostBody from '@/lib/blog/posts/writing-a-shift-post-that-gets-answered'
import GhostingBody from '@/lib/blog/posts/when-someone-ghosts-a-shift-trade'
import StartingBoardBody from '@/lib/blog/posts/starting-a-shift-board-at-work'
import ExtraHoursBody from '@/lib/blog/posts/picking-up-extra-hours-without-burning-out'
import ShiftPayBody from '@/lib/blog/posts/checking-your-shift-pay'
import TimeOffBody from '@/lib/blog/posts/asking-for-time-off'
import NewOnRotaBody from '@/lib/blog/posts/new-on-the-rota'

const AUTHOR = 'The MyShiftX Team'

/**
 * Posts, newest first. Plain TS modules rather than MDX — thirteen articles do
 * not justify a content pipeline, and this way the bodies are ordinary
 * components that typecheck with everything else.
 *
 * The blog index, the sitemap, and the prev/next links all derive from this
 * array, so adding a post is: write the body module, import it, add an entry
 * here in date order. Nothing else needs touching.
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'new-on-the-rota',
    title: 'New on the Rota: What Nobody Tells You in the First Month',
    description:
      'The job you will pick up. The scheduling culture takes longer — when the rota is really built, how swaps actually work here, and which of your shifts are worth more than they look.',
    publishedAt: '2026-08-04',
    updatedAt: '2026-08-04',
    author: AUTHOR,
    tags: ['Starting out', 'Scheduling'],
    readingMinutes: 7,
    Body: NewOnRotaBody,
  },
  {
    slug: 'asking-for-time-off',
    title: 'Asking for Time Off and Actually Getting It',
    description:
      'Leave is not granted on the strength of your reason — it is granted on whether saying yes creates a problem. Find out when the rota is built, and ask before that.',
    publishedAt: '2026-08-01',
    updatedAt: '2026-08-01',
    author: AUTHOR,
    tags: ['Time off', 'At work'],
    readingMinutes: 7,
    Body: TimeOffBody,
  },
  {
    slug: 'checking-your-shift-pay',
    title: 'Checking Your Shift Pay: What to Look For and How to Query It',
    description:
      'A salary is self-checking; a rota with premiums, swaps, and overtime thresholds is not. The payslip lines where errors actually live, and how to raise one so it gets fixed.',
    publishedAt: '2026-07-29',
    updatedAt: '2026-07-29',
    author: AUTHOR,
    tags: ['Pay', 'Getting organised'],
    readingMinutes: 8,
    Body: ShiftPayBody,
  },
  {
    slug: 'picking-up-extra-hours-without-burning-out',
    title: 'Picking Up Extra Hours Without Burning Out',
    description:
      'Extra shifts are the most available pay rise most shift workers have — and the cost arrives weeks after the money does. Count rest rather than hours, and set the ceiling before anyone asks.',
    publishedAt: '2026-07-26',
    updatedAt: '2026-07-26',
    author: AUTHOR,
    tags: ['Overtime', 'Recovery'],
    readingMinutes: 8,
    Body: ExtraHoursBody,
  },
  {
    slug: 'starting-a-shift-board-at-work',
    title: 'Starting a Shift-Trading Board at Your Workplace',
    description:
      'The technology is the easy part. Who gets in, what counts as a yes, who files the paperwork, and why you should tell your manager — the decisions that determine whether a board works.',
    publishedAt: '2026-07-23',
    updatedAt: '2026-07-23',
    author: AUTHOR,
    tags: ['Boards', 'Workplace tools'],
    readingMinutes: 8,
    Body: StartingBoardBody,
  },
  {
    slug: 'when-someone-ghosts-a-shift-trade',
    title: 'When Someone Ghosts a Shift Trade',
    description:
      'Three different failures get called ghosting, and only one of them is. How to get an unambiguous yes, what to do when the shift is tomorrow and still yours, and when to escalate.',
    publishedAt: '2026-07-21',
    updatedAt: '2026-07-21',
    author: AUTHOR,
    tags: ['Shift trading', 'Working with people'],
    readingMinutes: 8,
    Body: GhostingBody,
  },
  {
    slug: 'writing-a-shift-post-that-gets-answered',
    title: 'How to Write a Shift Post People Actually Answer',
    description:
      '“Anyone want Friday?” gets nothing. Seven details, forty seconds — date, hours, position, giveaway or swap, overtime status, the context only you have, and who does the paperwork.',
    publishedAt: '2026-07-17',
    updatedAt: '2026-07-17',
    author: AUTHOR,
    tags: ['Shift trading', 'Getting organised'],
    readingMinutes: 7,
    Body: ShiftPostBody,
  },
  {
    slug: 'group-chats-fail-shift-workers',
    title: 'Why Facebook Groups and Group Chats Keep Failing Shift Workers',
    description:
      'A group chat is a stream ordered by time. A shift board is a set of records ordered by relevance. Six structural reasons the first can never do the job of the second.',
    publishedAt: '2026-07-14',
    updatedAt: '2026-07-14',
    author: AUTHOR,
    tags: ['Shift trading', 'Workplace tools'],
    readingMinutes: 7,
    Body: GroupChatsBody,
  },
  {
    slug: 'shift-trading-etiquette',
    title: 'Shift Trading Etiquette: The Nine Unwritten Rules',
    description:
      'Nobody hands you the code on your first day — you learn it by breaking it. The unwritten rules of trading shifts, written down.',
    publishedAt: '2026-06-23',
    updatedAt: '2026-06-23',
    author: AUTHOR,
    tags: ['Shift trading', 'Working with people'],
    readingMinutes: 6,
    Body: EtiquetteBody,
  },
  {
    slug: 'what-makes-a-trade-fair',
    title: 'What Makes a Shift Trade Fair (It Is Not Equal Hours)',
    description:
      'Two shifts of the same length can cost wildly different amounts. Pay, rest, difficulty, and travel — how to work out what a shift is actually worth before you agree to it.',
    publishedAt: '2026-05-19',
    updatedAt: '2026-05-19',
    author: AUTHOR,
    tags: ['Shift trading', 'Pay'],
    readingMinutes: 6,
    Body: FairTradeBody,
  },
  {
    slug: 'reading-a-rotating-schedule',
    title: 'How to Read a Rotating Schedule Without Losing Track of Your Life',
    description:
      'Find your cycle length, memorise two anchor days instead of twenty-eight, and keep one calendar that wins. A practical guide to staying on top of a rotation.',
    publishedAt: '2026-04-28',
    updatedAt: '2026-04-28',
    author: AUTHOR,
    tags: ['Scheduling', 'Getting organised'],
    readingMinutes: 7,
    Body: RotatingScheduleBody,
  },
  {
    slug: 'getting-coverage-approved',
    title: 'Getting Coverage Approved: The Questions to Ask Your Scheduler',
    description:
      'Most people never find out what their workplace’s actual coverage policy is. Seven questions worth asking before you need the answers, and how to write a request that gets approved.',
    publishedAt: '2026-03-31',
    updatedAt: '2026-03-31',
    author: AUTHOR,
    tags: ['Scheduling', 'At work'],
    readingMinutes: 6,
    Body: CoverageApprovedBody,
  },
  {
    slug: 'working-nights-without-wrecking-your-week',
    title: 'Working Nights Without Wrecking the Rest of Your Week',
    description:
      'Protect the sleep block, use light in both directions, front-load the caffeine, and know which day is your write-off. Practical habits from people who work nights.',
    publishedAt: '2026-02-24',
    updatedAt: '2026-02-24',
    author: AUTHOR,
    tags: ['Night shift', 'Recovery'],
    readingMinutes: 7,
    Body: NightsBody,
  },
]

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(p => p.slug === slug)
}

/** Newer/older neighbours for the prev-next links at the foot of a post. */
export function adjacentPosts(slug: string): { newer?: BlogPost; older?: BlogPost } {
  const i = BLOG_POSTS.findIndex(p => p.slug === slug)
  if (i === -1) return {}
  return { newer: BLOG_POSTS[i - 1], older: BLOG_POSTS[i + 1] }
}

export function formatPostDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
