import type { BlogPost } from '@/lib/blog/types'
import FirstBusySeasonBody from '@/lib/blog/posts/first-busy-season-what-shift-workers-wish-they-knew'
import HotelsThemeParksBody from '@/lib/blog/posts/shift-trading-in-hotels-and-theme-parks'
import RestaurantsQsrBody from '@/lib/blog/posts/shift-trading-in-restaurants-and-quick-service'
import CommonMythsBody from '@/lib/blog/posts/common-myths-about-shift-trading'
import SchedulingSoftwareBody from '@/lib/blog/posts/what-scheduling-software-doesnt-solve'
import BurnoutSignalsBody from '@/lib/blog/posts/burnout-signals-for-heavy-traders'
import HolidayPeakSeasonBody from '@/lib/blog/posts/holiday-and-peak-season-coverage-strategies'
import MixedShiftsSleepBody from '@/lib/blog/posts/protecting-sleep-when-trading-mixed-shifts'
import SustainableRotationBody from '@/lib/blog/posts/building-a-sustainable-rotation'
import EscalatingTradeBody from '@/lib/blog/posts/escalating-a-problem-trade'
import InviteOnlyExpandingBody from '@/lib/blog/posts/invite-only-or-expanding-a-board'
import OnboardingNewHiresBody from '@/lib/blog/posts/onboarding-new-hires-to-the-board'
import SamePeoplePickUpBody from '@/lib/blog/posts/same-people-always-pick-up-dynamic'
import BoardRulesBody from '@/lib/blog/posts/board-rules-that-prevent-common-problems'
import ManagerBuyInBody from '@/lib/blog/posts/getting-manager-buy-in-for-a-shift-board'
import PayslipErrorsBody from '@/lib/blog/posts/fixing-payslip-errors-after-swaps'
import TrackingHoursBody from '@/lib/blog/posts/tracking-hours-overtime-and-premiums'
import CannotMakeShiftBody from '@/lib/blog/posts/what-to-do-when-you-cannot-make-a-shift'
import SayNoCleanlyBody from '@/lib/blog/posts/how-to-say-no-to-covering-a-shift'
import MessageTemplatesBody from '@/lib/blog/posts/shift-trading-message-templates'
import PhotoToCalendarBody from '@/lib/blog/posts/using-photo-to-calendar-effectively'
import MultiplePropertiesBody from '@/lib/blog/posts/finding-open-shifts-across-multiple-properties'
import PersonalRulesBody from '@/lib/blog/posts/setting-personal-rules-for-shifts'
import TrueCostBody from '@/lib/blog/posts/calculating-the-true-cost-of-a-shift'
import TradeLedgerBody from '@/lib/blog/posts/keeping-a-simple-trade-ledger'
import ShiftTradeChecklistBody from '@/lib/blog/posts/the-shift-trade-checklist'
import TradeFallsThroughBody from '@/lib/blog/posts/shift-trade-falls-through-day-before'
import PostForCoverageBody from '@/lib/blog/posts/how-to-post-a-shift-for-coverage'
import SwapVsGiveawayBody from '@/lib/blog/posts/shift-swap-vs-giveaway-vs-coverage-request'
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
 * Posts, newest first. Plain TS modules rather than MDX — forty-two articles
 * do not justify a content pipeline, and this way the bodies are ordinary
 * components that typecheck with everything else.
 *
 * The blog index, the sitemap, and the prev/next links all derive from this
 * array, so adding a post is: write the body module, import it, add an entry
 * here in date order. Nothing else needs touching.
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'first-busy-season-what-shift-workers-wish-they-knew',
    title: 'What Shift Workers Wish They Knew Before Their First Busy Season',
    description:
      'An evergreen guide for new workers facing peak pressure, unfamiliar trade norms, and the first time the schedule stops being theoretical.',
    publishedAt: '2026-08-14',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Starting out', 'Scheduling'],
    readingMinutes: 6,
    Body: FirstBusySeasonBody,
  },
  {
    slug: 'shift-trading-in-hotels-and-theme-parks',
    title: 'Shift Trading in Hotels, Theme Parks, Attractions & Event Venues',
    description:
      '24/7 operations, seasonal peaks, multi-property work, guest-facing roles, and event-driven demand.',
    publishedAt: '2026-08-14',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Industry', 'Hospitality & Attractions'],
    readingMinutes: 7,
    Body: HotelsThemeParksBody,
  },
  {
    slug: 'shift-trading-in-restaurants-and-quick-service',
    title: 'Shift Trading Realities in Restaurants & Quick Service',
    description:
      'Split shifts, late closes, weekend demand, floor coverage, and the speed at which last-minute changes move.',
    publishedAt: '2026-08-14',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Industry', 'Restaurants'],
    readingMinutes: 7,
    Body: RestaurantsQsrBody,
  },
  {
    slug: 'common-myths-about-shift-trading',
    title: 'Common Myths About Shift Trading',
    description:
      'It always creates overtime problems. Only unreliable people trade. Managers hate it. The reality is more ordinary and more useful.',
    publishedAt: '2026-08-13',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Shift trading', 'At work'],
    readingMinutes: 6,
    Body: CommonMythsBody,
  },
  {
    slug: 'what-scheduling-software-doesnt-solve',
    title: 'What Good Scheduling Software Still Doesn’t Solve for Shift Workers',
    description:
      'Corporate tools publish the schedule. Workers still need a structured way to offer, request, discuss, and confirm cover with each other.',
    publishedAt: '2026-08-13',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Workplace tools', 'Boards'],
    readingMinutes: 6,
    Body: SchedulingSoftwareBody,
  },
  {
    slug: 'burnout-signals-for-heavy-traders',
    title: 'Recognizing Early Burnout Signals Specific to Heavy Traders',
    description:
      'The patterns that appear weeks after the extra money lands — and what to do before they become a resignation.',
    publishedAt: '2026-08-12',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Overtime', 'Recovery'],
    readingMinutes: 7,
    Body: BurnoutSignalsBody,
  },
  {
    slug: 'holiday-and-peak-season-coverage-strategies',
    title: 'Holiday and Peak-Season Coverage Strategies',
    description:
      'How to plan months ahead, post early, and share the load when everyone wants the same days off.',
    publishedAt: '2026-08-12',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Scheduling', 'At work'],
    readingMinutes: 6,
    Body: HolidayPeakSeasonBody,
  },
  {
    slug: 'protecting-sleep-when-trading-mixed-shifts',
    title: 'Protecting Sleep and Recovery When You Mix Days, Evenings, and Nights Through Trading',
    description:
      'Practical tactics for mixed schedules created by trading, not just for permanent night workers.',
    publishedAt: '2026-08-12',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Night shift', 'Recovery'],
    readingMinutes: 7,
    Body: MixedShiftsSleepBody,
  },
  {
    slug: 'building-a-sustainable-rotation',
    title: 'Building a Sustainable Rotation When the Schedule Changes Every Week or Two',
    description:
      'Anchor days, protected rest blocks, and routines that make an irregular schedule feel less like guesswork.',
    publishedAt: '2026-08-11',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Scheduling', 'Recovery'],
    readingMinutes: 6,
    Body: SustainableRotationBody,
  },
  {
    slug: 'escalating-a-problem-trade',
    title: 'Escalating a Problem Trade Without Burning Bridges',
    description:
      'When to involve a supervisor, how to document cleanly, and how to keep the focus on the shift rather than the person.',
    publishedAt: '2026-08-11',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Shift trading', 'Working with people'],
    readingMinutes: 6,
    Body: EscalatingTradeBody,
  },
  {
    slug: 'invite-only-or-expanding-a-board',
    title: 'Invite-Only or Expanding: How to Choose the Right Board Setup',
    description:
      'Trust, privacy, verification, and workplace size. The trade-offs that decide whether a board stays tight or grows.',
    publishedAt: '2026-08-11',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Boards', 'Workplace tools'],
    readingMinutes: 6,
    Body: InviteOnlyExpandingBody,
  },
  {
    slug: 'onboarding-new-hires-to-the-board',
    title: 'How to Onboard New Hires to the Board Without Overwhelming Them',
    description:
      'A short, low-pressure introduction that gets new people using the board correctly before they learn the hard way.',
    publishedAt: '2026-08-10',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Boards', 'Workplace tools'],
    readingMinutes: 6,
    Body: OnboardingNewHiresBody,
  },
  {
    slug: 'same-people-always-pick-up-dynamic',
    title: 'Handling the “Same People Always Pick Up” Dynamic Fairly',
    description:
      'When a few names appear on every open shift, resentment builds on both sides. Practical ways to widen the pool without forcing anyone.',
    publishedAt: '2026-08-10',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Boards', 'Working with people'],
    readingMinutes: 6,
    Body: SamePeoplePickUpBody,
  },
  {
    slug: 'board-rules-that-prevent-common-problems',
    title: 'The Board Rules That Prevent Most Common Problems',
    description:
      'Eligibility, confirmations, qualifications, last-minute posts, no-shows, and escalation. A practical template you can adapt.',
    publishedAt: '2026-08-10',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Boards', 'Workplace tools'],
    readingMinutes: 6,
    Body: BoardRulesBody,
  },
  {
    slug: 'getting-manager-buy-in-for-a-shift-board',
    title: 'How to Get Manager Buy-In (or at Least Non-Interference) for a Worker-Run Board',
    description:
      'How to present a shift board to management as a low-risk tool that reduces last-minute scrambles rather than as an unofficial parallel system.',
    publishedAt: '2026-08-09',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Boards', 'Workplace tools'],
    readingMinutes: 6,
    Body: ManagerBuyInBody,
  },
  {
    slug: 'fixing-payslip-errors-after-swaps',
    title: 'How to Spot and Fix Common Payslip Errors After Swaps or Overtime',
    description:
      'The lines where mistakes actually live, and how to raise a query that gets fixed instead of ignored.',
    publishedAt: '2026-08-09',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Pay', 'Getting organized'],
    readingMinutes: 6,
    Body: PayslipErrorsBody,
  },
  {
    slug: 'tracking-hours-overtime-and-premiums',
    title: 'How to Track Hours, Overtime, and Premiums Across Multiple Locations',
    description:
      'A simple personal system for people who work more than one property or department so the numbers stay visible before the payslip arrives.',
    publishedAt: '2026-08-09',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Pay', 'Getting organized'],
    readingMinutes: 6,
    Body: TrackingHoursBody,
  },
  {
    slug: 'what-to-do-when-you-cannot-make-a-shift',
    title: 'What to Do When You Cannot Make a Shift (Full Workflow)',
    description:
      'Notify the right person, follow the process, post coverage, confirm the handoff, keep a record. The sequence that keeps your record clean.',
    publishedAt: '2026-08-08',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Shift trading', 'Working with people'],
    readingMinutes: 7,
    Body: CannotMakeShiftBody,
  },
  {
    slug: 'how-to-say-no-to-covering-a-shift',
    title: 'How to Say No Cleanly When Someone Asks You to Cover',
    description:
      'Polite, firm language that protects your boundaries and still leaves the relationship intact.',
    publishedAt: '2026-08-08',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Shift trading', 'Working with people'],
    readingMinutes: 7,
    Body: SayNoCleanlyBody,
  },
  {
    slug: 'shift-trading-message-templates',
    title: 'Copy-and-Paste Templates for Asking to Swap, Give Away, or Request Coverage',
    description:
      'Ready-to-adapt messages that stay clear and professional without sounding desperate or vague.',
    publishedAt: '2026-08-08',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Shift trading', 'Working with people'],
    readingMinutes: 6,
    Body: MessageTemplatesBody,
  },
  {
    slug: 'using-photo-to-calendar-effectively',
    title: 'Using the Photo-to-Calendar Feature Effectively (and What to Double-Check)',
    description:
      'Snap the schedule, review the extracted shifts, and keep one calendar that actually wins. The small checks that stop a wrong import becoming a missed shift.',
    publishedAt: '2026-08-07',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Scheduling', 'Getting organized'],
    readingMinutes: 6,
    Body: PhotoToCalendarBody,
  },
  {
    slug: 'finding-open-shifts-across-multiple-properties',
    title: 'How to Find Relevant Open Shifts When You Work Multiple Properties or Roles',
    description:
      'Filters exist for a reason. How to see only the shifts you can actually take when you work across sites, departments, or skill sets.',
    publishedAt: '2026-08-07',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Shift trading', 'Workplace tools'],
    readingMinutes: 6,
    Body: MultiplePropertiesBody,
  },
  {
    slug: 'setting-personal-rules-for-shifts',
    title: 'How to Set Personal Rules for Which Shifts You’ll Post or Claim',
    description:
      'Overtime thresholds, minimum rest, commute limits, and the days you protect. A short personal policy that stops you deciding the same questions under pressure every week.',
    publishedAt: '2026-08-07',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Shift trading', 'Getting organized'],
    readingMinutes: 6,
    Body: PersonalRulesBody,
  },
  {
    slug: 'calculating-the-true-cost-of-a-shift',
    title: 'Calculating the True Cost of a Shift (Beyond the Hourly Rate)',
    description:
      'Premiums, travel, lost rest, childcare, meals. Two shifts of the same length can cost very different amounts. How to see the real number before you agree.',
    publishedAt: '2026-08-06',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Pay', 'Getting organized'],
    readingMinutes: 7,
    Body: TrueCostBody,
  },
  {
    slug: 'keeping-a-simple-trade-ledger',
    title: 'How to Keep a Simple Trade Ledger So Favors Stay Balanced',
    description:
      'A lightweight way to track who has covered whom without turning every shift into a transaction or a score-settling exercise.',
    publishedAt: '2026-08-06',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Shift trading', 'Working with people'],
    readingMinutes: 6,
    Body: TradeLedgerBody,
  },
  {
    slug: 'the-shift-trade-checklist',
    title: 'The Shift-Trade Checklist: What to Confirm Before You Say Yes',
    description:
      'Six questions that take thirty seconds. The difference between a trade you are glad you took and one you regret for a month.',
    publishedAt: '2026-08-06',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Shift trading', 'Getting organized'],
    readingMinutes: 6,
    Body: ShiftTradeChecklistBody,
  },
  {
    slug: 'shift-trade-falls-through-day-before',
    title: 'What to Do When a Shift Trade Falls Through the Day Before (or Morning Of)',
    description:
      'The shift is still yours, the person who agreed has gone quiet, and the clock is running. A practical order of operations that protects your record and your reputation.',
    publishedAt: '2026-08-05',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Shift trading', 'Working with people'],
    readingMinutes: 8,
    Body: TradeFallsThroughBody,
  },
  {
    slug: 'how-to-post-a-shift-for-coverage',
    title: 'How to Post a Shift for Coverage: A Template That Gets Faster Replies',
    description:
      'Seven details, roughly forty seconds. The difference between a post that gets answered and one that sits there until you end up working it yourself.',
    publishedAt: '2026-08-05',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Shift trading', 'Getting organized'],
    readingMinutes: 8,
    Body: PostForCoverageBody,
  },
  {
    slug: 'shift-swap-vs-giveaway-vs-coverage-request',
    title: 'Shift Swap vs. Shift Giveaway vs. Coverage Request: What’s the Difference?',
    description:
      'Three different posts that all look the same from the outside. The details that tell people which one they’re actually answering.',
    publishedAt: '2026-08-05',
    updatedAt: '2026-08-18',
    author: AUTHOR,
    tags: ['Shift trading', 'Getting organized'],
    readingMinutes: 9,
    Body: SwapVsGiveawayBody,
  },
  {
    slug: 'new-on-the-rota',
    title: 'New on the Schedule: What Nobody Tells You in the First Month',
    description:
      'The job you will pick up. The scheduling culture takes longer — when the schedule is really built, how swaps actually work here, and which of your shifts are worth more than they look.',
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
      'Leave is not granted on the strength of your reason — it is granted on whether saying yes creates a problem. Find out when the schedule is built, and ask before that.',
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
      'A salary is self-checking; a schedule with premiums, swaps, and overtime thresholds is not. The payslip lines where errors actually live, and how to raise one so it gets fixed.',
    publishedAt: '2026-07-29',
    updatedAt: '2026-07-29',
    author: AUTHOR,
    tags: ['Pay', 'Getting organized'],
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
    tags: ['Shift trading', 'Getting organized'],
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
      'Find your cycle length, memorize two anchor days instead of twenty-eight, and keep one calendar that wins. A practical guide to staying on top of a rotation.',
    publishedAt: '2026-04-28',
    updatedAt: '2026-04-28',
    author: AUTHOR,
    tags: ['Scheduling', 'Getting organized'],
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

/** Newer/older neighbors for the prev-next links at the foot of a post. */
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
