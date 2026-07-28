import type { BlogPost } from '@/lib/blog/types'
import GroupChatsBody from '@/lib/blog/posts/group-chats-fail-shift-workers'
import EtiquetteBody from '@/lib/blog/posts/shift-trading-etiquette'
import RotatingScheduleBody from '@/lib/blog/posts/reading-a-rotating-schedule'
import FairTradeBody from '@/lib/blog/posts/what-makes-a-trade-fair'
import CoverageApprovedBody from '@/lib/blog/posts/getting-coverage-approved'
import NightsBody from '@/lib/blog/posts/working-nights-without-wrecking-your-week'

const AUTHOR = 'The MyShiftX Team'

/**
 * Posts, newest first. Plain TS modules rather than MDX — six articles do not
 * justify a content pipeline, and this way the bodies are ordinary components
 * that typecheck with everything else.
 */
export const BLOG_POSTS: BlogPost[] = [
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
