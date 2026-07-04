import type { LucideIcon } from 'lucide-react'
import { RefreshCw, Gift, Clock, Shield, Zap, AlertTriangle, MessageSquareOff, CalendarClock } from 'lucide-react'

export interface IndustryPainPoint {
  icon: LucideIcon
  title: string
  body: string
}

export interface IndustrySolution {
  icon: LucideIcon
  title: string
  body: string
}

export interface Industry {
  slug: string
  /** Short label used in the "Built For Any Workplace" chip list on the home page. */
  shortName: string
  metaTitle: string
  metaDescription: string
  heroKicker: string
  /** Rendered before the highlighted word in the H1. */
  heroHeadlinePrefix: string
  /** The highlighted (colored, underlined) word or phrase in the H1. */
  heroHeadlineHighlight: string
  heroSubcopy: string
  painPointsIntro: string
  painPoints: IndustryPainPoint[]
  solutionsIntro: string
  solutions: IndustrySolution[]
  ctaHeadline: string
  ctaSubcopy: string
}

export const INDUSTRIES: Industry[] = [
  {
    slug: 'retail',
    shortName: 'Retail Stores',
    metaTitle: 'Shift Swap App for Retail Associates – MyShiftX',
    metaDescription:
      'Stop waiting on a manager to text the group chat. Post open shifts, pick up extra hours, and swap with other associates in minutes.',
    heroKicker: 'Built for Retail Associates',
    heroHeadlinePrefix: 'Open Shifts,',
    heroHeadlineHighlight: 'Filled Fast',
    heroSubcopy:
      "When someone calls out, your manager shouldn't have to burn an hour texting every associate on the schedule. Post the open shift, and whoever's free and qualified can grab it.",
    painPointsIntro: "If any of this sounds familiar, you already know why we built this.",
    painPoints: [
      {
        icon: AlertTriangle,
        title: 'A call-out turns into a scramble',
        body: "One person doesn't show, and suddenly your manager is calling down the list hoping someone picks up. Hours pass before the shift is covered — or it never is.",
      },
      {
        icon: CalendarClock,
        title: 'Your availability never quite matches the schedule',
        body: 'You updated your availability weeks ago, but the system — or the person entering it — is always a step behind. Kronos, UKG, Workday, whatever it is, you\'re still stuck asking a manager to fix a shift by hand.',
      },
      {
        icon: MessageSquareOff,
        title: 'Every swap needs a manager in the middle',
        body: "You and a coworker already agreed to trade — now you both wait for someone with a badge to approve it before it's official.",
      },
    ],
    solutionsIntro: 'How MyShiftX fixes it',
    solutions: [
      {
        icon: RefreshCw,
        title: 'Post it the moment you know',
        body: "Can't make a shift? Post it as an offer the second you know, instead of waiting to see if anyone answers a text.",
      },
      {
        icon: Gift,
        title: 'Pick up hours when you want more',
        body: 'Want extra hours this week? Browse open shifts from associates at your store and grab the ones that fit.',
      },
      {
        icon: Shield,
        title: 'Every trade is out in the open',
        body: 'No side deals in a group chat that a manager finds out about after the fact — every offer and pickup is visible and accounted for.',
      },
    ],
    ctaHeadline: 'Stop chasing coverage. Start posting it.',
    ctaSubcopy: 'Free for associates. Set up your board in minutes.',
  },
  {
    slug: 'restaurants',
    shortName: 'Restaurants',
    metaTitle: 'Shift Swap App for Restaurant Staff – MyShiftX',
    metaDescription:
      'Front of house, back of house, servers, cooks — trade shifts without the group chat chaos or a manager approving every single swap.',
    heroKicker: 'Built for FOH & BOH',
    heroHeadlinePrefix: 'No More',
    heroHeadlineHighlight: 'Clopenings You Can\'t Escape',
    heroSubcopy:
      "Close at midnight, open at 6 AM — clopening shifts wreck your sleep and your life outside work. When you need out of one, MyShiftX gets it in front of every server, cook, and host who could cover it.",
    painPointsIntro: 'The stuff that makes "the schedule" a dirty word',
    painPoints: [
      {
        icon: Clock,
        title: 'The clopening nobody wants',
        body: "Closing the night before opening the next morning barely leaves time to sleep, let alone handle a kid, a second job, or a life. Swapping out of one shouldn't take a miracle.",
      },
      {
        icon: MessageSquareOff,
        title: 'Coverage lives and dies in a group chat',
        body: "Someone posts \"can anyone cover Friday close??\" into a GroupMe with forty people in it and hopes for the best. Half the time nobody sees it in time.",
      },
      {
        icon: AlertTriangle,
        title: 'Every trade waits on a manager',
        body: "You found someone to cover — now you're both waiting on a manager to sign off before you can actually stop worrying about it.",
      },
    ],
    solutionsIntro: 'How MyShiftX fixes it',
    solutions: [
      {
        icon: RefreshCw,
        title: 'Post the shift, not a group text',
        body: 'Offer a shift once and every FOH or BOH teammate on the board sees it — no more hoping the right person scrolls past your message in time.',
      },
      {
        icon: Gift,
        title: 'Request coverage for the shifts you dread',
        body: "Need out of a clopening? Post a request with your preferred time window and let people come to you.",
      },
      {
        icon: Clock,
        title: 'Stale posts disappear on their own',
        body: "Shift posts auto-expire 30 minutes before start time, so you're never digging through offers for a shift that already happened.",
      },
    ],
    ctaHeadline: 'Get your life back from the clopening.',
    ctaSubcopy: 'Free for FOH and BOH staff. Takes two minutes to set up.',
  },
  {
    slug: 'warehouses',
    shortName: 'Warehouses',
    metaTitle: 'Shift Swap App for Warehouse Associates – MyShiftX',
    metaDescription:
      'Flex schedules, VTO, VET, and shifts that vanish the second they post — trade with other associates before the good ones are gone.',
    heroKicker: 'Built for Warehouse Associates',
    heroHeadlinePrefix: 'Grab the Shift',
    heroHeadlineHighlight: 'Before It\'s Gone',
    heroSubcopy:
      "Flex schedules mean your hours change week to week and the shifts you actually want disappear fast. MyShiftX puts every open shift and trade in one place so you're not refreshing an app hoping to get lucky.",
    painPointsIntro: 'What flex scheduling actually feels like',
    painPoints: [
      {
        icon: Clock,
        title: 'The good shifts are gone in seconds',
        body: 'Weekday mornings get claimed almost instantly, leaving nights and weekends for whoever was too slow. Flex means competing against everyone else on shift, every single week.',
      },
      {
        icon: CalendarClock,
        title: "VTO and VET aren't something you can count on",
        body: "Voluntary time off and extra hours show up when they show up — there's no way to plan around them, and no easy way to trade into a shift that actually works for you.",
      },
      {
        icon: AlertTriangle,
        title: 'Your schedule changes, your life doesn\'t',
        body: "Childcare, a second job, a class — none of it moves just because your shift did. Finding someone to trade with shouldn't mean posting into the void and hoping.",
      },
    ],
    solutionsIntro: 'How MyShiftX fixes it',
    solutions: [
      {
        icon: RefreshCw,
        title: 'One board, every open shift',
        body: 'See every shift offer and request from other associates in one place instead of piecing it together from texts and word of mouth.',
      },
      {
        icon: Zap,
        title: 'Filter to what actually fits your role',
        body: "Only see shifts relevant to your role and site — not a wall of postings that don't apply to you.",
      },
      {
        icon: Gift,
        title: 'Request the days you need off',
        body: 'Post exactly what you need — day, time window, role — and let other associates come to you instead of chasing down a trade yourself.',
      },
    ],
    ctaHeadline: 'Stop losing shifts to whoever was faster.',
    ctaSubcopy: 'Free for warehouse associates. Set up your board in minutes.',
  },
  {
    slug: 'hotels',
    shortName: 'Hotels & Resorts',
    metaTitle: 'Shift Swap App for Hotel & Resort Staff – MyShiftX',
    metaDescription:
      'Front desk, housekeeping, F&B, maintenance — five different schedules competing for the same people. Trade shifts across departments without the chaos.',
    heroKicker: 'Built for Front Desk, Housekeeping & F&B',
    heroHeadlinePrefix: 'One Board for',
    heroHeadlineHighlight: 'Every Department',
    heroSubcopy:
      "Front desk, housekeeping, F&B, and maintenance all run on different clocks and pull from the same staff. When someone can't make a shift, MyShiftX gets it in front of the people who can actually cover it.",
    painPointsIntro: 'Five schedules, one exhausted staff',
    painPoints: [
      {
        icon: AlertTriangle,
        title: 'Call-outs are just part of the day',
        body: 'On a team of thirty, one or two people not showing up is normal, not rare. Somebody still has to scramble to cover the gap every single time.',
      },
      {
        icon: CalendarClock,
        title: 'Every department has its own rush hour',
        body: 'Front desk peaks at check-in and check-out, housekeeping peaks mid-morning, F&B follows the meal schedule — coordinating coverage across all of it by hand is a full-time job on its own.',
      },
      {
        icon: MessageSquareOff,
        title: 'Housekeeping turnover leaves gaps nobody plans for',
        body: "It's consistently the hardest role to keep staffed, which means the people who stay end up covering more than their share.",
      },
    ],
    solutionsIntro: 'How MyShiftX fixes it',
    solutions: [
      {
        icon: RefreshCw,
        title: 'Post an open shift in seconds',
        body: "Can't cover a shift? Post it and let staff across your property — not just your department — see it and pick it up.",
      },
      {
        icon: Zap,
        title: 'Filter by role and location',
        body: "See shifts relevant to your role and property so front desk isn't wading through housekeeping postings and vice versa.",
      },
      {
        icon: Shield,
        title: 'Leaders keep oversight',
        body: 'Roles and locations are approved by leadership before they go live, so coverage stays accurate without a manager approving every single trade.',
      },
    ],
    ctaHeadline: 'Cover the gap without the group chat scramble.',
    ctaSubcopy: 'Free for hotel and resort staff. Set up your board in minutes.',
  },
  {
    slug: 'theme-parks',
    shortName: 'Theme Parks',
    metaTitle: 'Shift Swap App for Theme Park Team Members – MyShiftX',
    metaDescription:
      'Rotating attractions, regular-time-for-regular-time trades, and a call board that only updates a few times a day. MyShiftX makes trading shifts simple.',
    heroKicker: 'Built for Attractions & Park Teams',
    heroHeadlinePrefix: 'Trade Shifts',
    heroHeadlineHighlight: 'Without the Guesswork',
    heroSubcopy:
      "Regular time trades for regular time, overtime trades for overtime, and the call board only tells half the story. MyShiftX makes it obvious what's available and who's offering it.",
    painPointsIntro: "What trading a shift actually looks like right now",
    painPoints: [
      {
        icon: AlertTriangle,
        title: 'Matching trades by hand is a headache',
        body: "A regular-time shift can only trade for another regular-time shift, and overtime only trades for overtime. Finding the right match usually means asking around and hoping.",
      },
      {
        icon: CalendarClock,
        title: 'You don\'t always know where you\'ll end up',
        body: "Getting rotated between attractions mid-shift is normal, which makes planning a trade around exactly where you'll be that much harder.",
      },
      {
        icon: Clock,
        title: 'The call board doesn\'t update in real time',
        body: 'Open shifts get released in phases and go stale fast — by the time you check, the good ones are already gone.',
      },
    ],
    solutionsIntro: 'How MyShiftX fixes it',
    solutions: [
      {
        icon: RefreshCw,
        title: 'Real-time board, not a static list',
        body: "Browse and post shift offers as they happen — no waiting for the next scheduled call board update.",
      },
      {
        icon: Zap,
        title: 'Filter by attraction and role',
        body: 'See shifts relevant to the attractions and roles you actually work, across every location on property.',
      },
      {
        icon: Gift,
        title: 'Post a request and let it come to you',
        body: "Need a specific day off? Post a request with your preferred time window instead of asking around one person at a time.",
      },
    ],
    ctaHeadline: 'Make trading a shift as easy as posting it.',
    ctaSubcopy: 'Free for team members. Set up your board in minutes.',
  },
  {
    slug: 'event-venues',
    shortName: 'Event Venues',
    metaTitle: 'Shift Swap App for Event & Venue Staff – MyShiftX',
    metaDescription:
      'Call times, half hour, and crews pulled from a dozen different group chats. Cover shifts across your venue without the scramble.',
    heroKicker: 'Built for Event & Venue Crews',
    heroHeadlinePrefix: 'Cover a Call Time,',
    heroHeadlineHighlight: 'Not a Whole Chat Thread',
    heroSubcopy:
      "Half hour is coming whether or not your crew is full. MyShiftX gets an open call in front of everyone who could cover it, instead of buried in a group chat with people from three different shows ago.",
    painPointsIntro: "The reality of staffing a venue with a rotating crew",
    painPoints: [
      {
        icon: AlertTriangle,
        title: 'Last-minute call-outs are the norm, not the exception',
        body: "Part-time and gig crew juggle multiple venues and jobs, so someone dropping a call time close to half hour happens constantly.",
      },
      {
        icon: MessageSquareOff,
        title: 'Coverage gets coordinated across a dozen threads',
        body: 'Group texts, emails, agency messages — by the time everyone sees the same information, half the crew has already missed it.',
      },
      {
        icon: CalendarClock,
        title: 'Skills have to match the call, every time',
        body: "You can't just fill a slot with anyone — the person covering needs the right role for that call, and finding them fast is its own job.",
      },
    ],
    solutionsIntro: 'How MyShiftX fixes it',
    solutions: [
      {
        icon: RefreshCw,
        title: 'One board for every open call',
        body: "Post an open shift once and every crew member on the board sees it immediately, instead of it getting lost in a thread.",
      },
      {
        icon: Zap,
        title: 'Filter by role and venue',
        body: 'See only the calls relevant to your role and location — not every shift across every event.',
      },
      {
        icon: Clock,
        title: 'Nothing lingers past its call time',
        body: 'Shift posts expire automatically so the board never fills up with calls that already happened.',
      },
    ],
    ctaHeadline: 'Fill the call before half hour, not after.',
    ctaSubcopy: 'Free for event and venue crews. Set up your board in minutes.',
  },
]

export function getIndustry(slug: string): Industry | undefined {
  return INDUSTRIES.find(i => i.slug === slug)
}
