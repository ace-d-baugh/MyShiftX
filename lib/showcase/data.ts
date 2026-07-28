/**
 * Sample data for the public demo (app/preview/*).
 *
 * Deliberately hand-written fixtures rather than a read of the real database:
 * there is then nothing to leak, no RLS to reason about, no query that can
 * fail, and the demo renders identically whatever state production is in.
 *
 * Everything here is fictional. Names are first-name-plus-initial, boards are
 * invented workplaces, and every page that renders this data carries a banner
 * saying so — Google's Publisher Policies forbid presenting fabricated
 * activity as a genuine community, and it would be a lousy thing to do anyway.
 *
 * Dates are computed relative to the render time so the Wall is never full of
 * shifts that already happened; stale listings are their own policy problem.
 * All of that math runs server-side in an RSC and is handed down as
 * pre-formatted strings, so there's no clock-skew hydration mismatch.
 */

export interface ShowcaseBoard {
  id: string
  name: string
  industry: string
}

export interface ShowcaseShift {
  id: string
  boardId: string
  title: string
  poster: string
  /** Days from today. Negative is not used — nothing in the demo is expired. */
  dayOffset: number
  startHour: number
  endHour: number
  kind: 'trade' | 'giveaway'
  overtimeApproved?: boolean
  details?: string
  interestedCount: number
  commentCount: number
}

export interface ShowcaseRequest {
  id: string
  boardId: string
  title: string
  poster: string
  dayOffset: number
  preferredTimes: ('Morning' | 'Afternoon' | 'Evening' | 'Late')[]
  details?: string
  interestedCount: number
}

export interface ShowcaseMessage {
  id: string
  /** true when the sample "you" sent it, so threads read as a conversation. */
  fromMe: boolean
  body: string
  /** Minutes before now. */
  minutesAgo: number
}

export interface ShowcaseConversation {
  id: string
  withName: string
  withRole: string
  boardId: string
  subject: string
  unread: number
  messages: ShowcaseMessage[]
}

export const SHOWCASE_BOARDS: ShowcaseBoard[] = [
  { id: 'b-harbor', name: 'Harborview Resort — Front Office', industry: 'Hotels & Resorts' },
  { id: 'b-summit', name: 'Summit Park — Attractions', industry: 'Theme Parks' },
  { id: 'b-mercado', name: 'Mercado Kitchen — FOH', industry: 'Restaurants' },
  { id: 'b-northline', name: 'Northline Medical — Nursing', industry: 'Healthcare' },
]

export const SHOWCASE_SHIFTS: ShowcaseShift[] = [
  {
    id: 's-01', boardId: 'b-harbor', title: 'Front Desk — PM', poster: 'Priya N.',
    dayOffset: 1, startHour: 15, endHour: 23, kind: 'trade',
    details: 'Happy to swap for any morning next week. I have a class Tuesday night I cannot move.',
    interestedCount: 3, commentCount: 2,
  },
  {
    id: 's-02', boardId: 'b-summit', title: 'Ride Operator — Opening', poster: 'Marcus D.',
    dayOffset: 1, startHour: 6, endHour: 14, kind: 'giveaway',
    details: 'Family in town. Opening crew, so you would be on rotation one.',
    interestedCount: 5, commentCount: 1,
  },
  {
    id: 's-03', boardId: 'b-mercado', title: 'Server — Dinner', poster: 'Tomás R.',
    dayOffset: 2, startHour: 16, endHour: 23, kind: 'trade',
    details: 'Looking for a lunch shift in return. Section 4, usually a good night.',
    interestedCount: 2, commentCount: 4,
  },
  {
    id: 's-04', boardId: 'b-northline', title: 'Med-Surg — Night', poster: 'Dana K.',
    dayOffset: 2, startHour: 19, endHour: 7, kind: 'trade', overtimeApproved: true,
    details: 'OT approved by the charge nurse. Swapping for any day shift this pay period.',
    interestedCount: 4, commentCount: 0,
  },
  {
    id: 's-05', boardId: 'b-harbor', title: 'Night Audit', poster: 'Ellis W.',
    dayOffset: 3, startHour: 23, endHour: 7, kind: 'giveaway',
    details: 'Quiet one. Two arrivals after midnight, rest is reporting.',
    interestedCount: 1, commentCount: 0,
  },
  {
    id: 's-06', boardId: 'b-summit', title: 'Guest Services — Mid', poster: 'Bianca L.',
    dayOffset: 3, startHour: 11, endHour: 19, kind: 'trade',
    interestedCount: 2, commentCount: 3,
  },
  {
    id: 's-07', boardId: 'b-mercado', title: 'Host — Brunch', poster: 'Jo A.',
    dayOffset: 4, startHour: 9, endHour: 15, kind: 'giveaway',
    details: 'Weekend brunch, tips pooled. Busy but the crew is great.',
    interestedCount: 6, commentCount: 2,
  },
  {
    id: 's-08', boardId: 'b-northline', title: 'Telemetry — Day', poster: 'Rashad P.',
    dayOffset: 4, startHour: 7, endHour: 19, kind: 'trade',
    interestedCount: 3, commentCount: 1,
  },
  {
    id: 's-09', boardId: 'b-harbor', title: 'Bell Services — AM', poster: 'Nikolai S.',
    dayOffset: 5, startHour: 7, endHour: 15, kind: 'trade',
    details: 'Big group checkout Saturday, so bring comfortable shoes.',
    interestedCount: 1, commentCount: 0,
  },
  {
    id: 's-10', boardId: 'b-summit', title: 'Attractions — Close', poster: 'Fatima H.',
    dayOffset: 5, startHour: 16, endHour: 1, kind: 'giveaway',
    interestedCount: 4, commentCount: 2,
  },
  {
    id: 's-11', boardId: 'b-mercado', title: 'Bartender — Late', poster: 'Cody V.',
    dayOffset: 6, startHour: 18, endHour: 2, kind: 'trade', overtimeApproved: true,
    details: 'Live music night. Would trade for anything earlier in the week.',
    interestedCount: 7, commentCount: 5,
  },
  {
    id: 's-12', boardId: 'b-northline', title: 'ICU — Night', poster: 'Grace O.',
    dayOffset: 6, startHour: 19, endHour: 7, kind: 'giveaway',
    details: 'Fully staffed unit, two-patient assignment.',
    interestedCount: 2, commentCount: 1,
  },
  {
    id: 's-13', boardId: 'b-harbor', title: 'Concierge — Mid', poster: 'Yusuf B.',
    dayOffset: 7, startHour: 12, endHour: 20, kind: 'trade',
    interestedCount: 0, commentCount: 0,
  },
  {
    id: 's-14', boardId: 'b-summit', title: 'Merchandise — Open', poster: 'Hannah C.',
    dayOffset: 8, startHour: 8, endHour: 16, kind: 'trade',
    details: 'Main street location. Swapping for a closing shift.',
    interestedCount: 3, commentCount: 1,
  },
  {
    id: 's-15', boardId: 'b-mercado', title: 'Line Cook — Dinner', poster: 'Ana G.',
    dayOffset: 9, startHour: 15, endHour: 23, kind: 'giveaway',
    interestedCount: 2, commentCount: 0,
  },
  {
    id: 's-16', boardId: 'b-northline', title: 'Float Pool — Day', poster: 'Devin T.',
    dayOffset: 10, startHour: 7, endHour: 19, kind: 'trade', overtimeApproved: true,
    details: 'Float assignment, unit posted the morning of.',
    interestedCount: 1, commentCount: 2,
  },
  {
    id: 's-17', boardId: 'b-harbor', title: 'Front Desk — AM', poster: 'Simone F.',
    dayOffset: 11, startHour: 7, endHour: 15, kind: 'trade',
    interestedCount: 2, commentCount: 0,
  },
  {
    id: 's-18', boardId: 'b-summit', title: 'Ride Operator — Mid', poster: 'Owen J.',
    dayOffset: 12, startHour: 10, endHour: 18, kind: 'giveaway',
    details: 'Rotation two, indoor attraction, air conditioned.',
    interestedCount: 5, commentCount: 3,
  },
]

export const SHOWCASE_REQUESTS: ShowcaseRequest[] = [
  {
    id: 'r-01', boardId: 'b-harbor', title: 'Need Friday off — wedding', poster: 'Priya N.',
    dayOffset: 5, preferredTimes: ['Morning', 'Afternoon'],
    details: 'Will happily take a double the weekend after to make it up.',
    interestedCount: 2,
  },
  {
    id: 'r-02', boardId: 'b-summit', title: 'Looking for coverage — exam day', poster: 'Bianca L.',
    dayOffset: 3, preferredTimes: ['Morning'],
    details: 'Only need the first half if someone wants to split it.',
    interestedCount: 4,
  },
  {
    id: 'r-03', boardId: 'b-mercado', title: 'Want to pick up a dinner shift', poster: 'Cody V.',
    dayOffset: 2, preferredTimes: ['Evening', 'Late'],
    interestedCount: 1,
  },
  {
    id: 'r-04', boardId: 'b-northline', title: 'Need a night covered', poster: 'Dana K.',
    dayOffset: 6, preferredTimes: ['Late'],
    details: 'Childcare fell through. Anything from 7p on.',
    interestedCount: 3,
  },
  {
    id: 'r-05', boardId: 'b-harbor', title: 'Any morning next week', poster: 'Nikolai S.',
    dayOffset: 8, preferredTimes: ['Morning'],
    interestedCount: 0,
  },
  {
    id: 'r-06', boardId: 'b-summit', title: 'Trading away my Saturday close', poster: 'Fatima H.',
    dayOffset: 4, preferredTimes: ['Afternoon', 'Evening'],
    details: 'Happy to take your weekday close instead.',
    interestedCount: 2,
  },
  {
    id: 'r-07', boardId: 'b-mercado', title: 'Picking up hours before rent', poster: 'Jo A.',
    dayOffset: 1, preferredTimes: ['Morning', 'Afternoon', 'Evening'],
    details: 'Genuinely will take anything. Certified on bar and floor.',
    interestedCount: 5,
  },
  {
    id: 'r-08', boardId: 'b-northline', title: 'Day shift wanted — any unit', poster: 'Rashad P.',
    dayOffset: 9, preferredTimes: ['Morning'],
    interestedCount: 1,
  },
  {
    id: 'r-09', boardId: 'b-harbor', title: 'Need Sunday for travel', poster: 'Ellis W.',
    dayOffset: 10, preferredTimes: ['Morning', 'Afternoon'],
    interestedCount: 2,
  },
  {
    id: 'r-10', boardId: 'b-summit', title: 'Half day — appointment', poster: 'Owen J.',
    dayOffset: 7, preferredTimes: ['Afternoon'],
    details: 'Just need out by 2, happy to open.',
    interestedCount: 3,
  },
]

export const SHOWCASE_CONVERSATIONS: ShowcaseConversation[] = [
  {
    id: 'c-01', withName: 'Priya N.', withRole: 'Front Office', boardId: 'b-harbor',
    subject: 'Front Desk — PM', unread: 2,
    messages: [
      { id: 'm-1', fromMe: false, minutesAgo: 184, body: 'Hey! Saw you marked interested in my Thursday PM. Are you still able to take it?' },
      { id: 'm-2', fromMe: true, minutesAgo: 176, body: 'Yes, still good. Do you want a straight giveaway or are you after a swap?' },
      { id: 'm-3', fromMe: false, minutesAgo: 41, body: 'A swap if you can. I have got a class that night I really cannot miss.' },
      { id: 'm-4', fromMe: false, minutesAgo: 38, body: 'I could take your Monday morning if that works? Then neither of us loses hours.' },
    ],
  },
  {
    id: 'c-02', withName: 'Marcus D.', withRole: 'Attractions', boardId: 'b-summit',
    subject: 'Ride Operator — Opening', unread: 0,
    messages: [
      { id: 'm-5', fromMe: true, minutesAgo: 1490, body: 'Is the opening shift still available? I am certified on rotation one.' },
      { id: 'm-6', fromMe: false, minutesAgo: 1455, body: 'It is! Nobody has claimed it yet. Have you opened that attraction before?' },
      { id: 'm-7', fromMe: true, minutesAgo: 1450, body: 'Plenty of times. I can be there for the 6am park check.' },
      { id: 'm-8', fromMe: false, minutesAgo: 1402, body: 'Perfect, marking it as yours. I will let the coordinator know so it shows up on the board.' },
    ],
  },
  {
    id: 'c-03', withName: 'Tomás R.', withRole: 'Front of House', boardId: 'b-mercado',
    subject: 'Server — Dinner', unread: 1,
    messages: [
      { id: 'm-9', fromMe: false, minutesAgo: 620, body: 'You posted a lunch shift last week — any chance you would swap it for my Saturday dinner?' },
      { id: 'm-10', fromMe: true, minutesAgo: 604, body: 'Tempting. Which section is the dinner?' },
      { id: 'm-11', fromMe: false, minutesAgo: 95, body: 'Section 4. It is usually the best money of the week, honestly.' },
    ],
  },
  {
    id: 'c-04', withName: 'Dana K.', withRole: 'Nursing', boardId: 'b-northline',
    subject: 'Med-Surg — Night', unread: 0,
    messages: [
      { id: 'm-12', fromMe: false, minutesAgo: 2880, body: 'Charge approved the OT on this one, so it will not eat into your regular hours.' },
      { id: 'm-13', fromMe: true, minutesAgo: 2840, body: 'Good to know. Let me check the rest of my week and come back to you tonight.' },
      { id: 'm-14', fromMe: false, minutesAgo: 2835, body: 'No rush. It does not expire until Thursday.' },
    ],
  },
  {
    id: 'c-05', withName: 'Jo A.', withRole: 'Front of House', boardId: 'b-mercado',
    subject: 'Host — Brunch', unread: 0,
    messages: [
      { id: 'm-15', fromMe: true, minutesAgo: 4300, body: 'Are you giving the brunch away outright, or looking to trade?' },
      { id: 'm-16', fromMe: false, minutesAgo: 4280, body: 'Outright. I am trying to get down to four days a week.' },
      { id: 'm-17', fromMe: true, minutesAgo: 4275, body: 'Then I will take it. Thanks!' },
    ],
  },
  {
    id: 'c-06', withName: 'Bianca L.', withRole: 'Guest Services', boardId: 'b-summit',
    subject: 'Looking for coverage — exam day', unread: 0,
    messages: [
      { id: 'm-18', fromMe: false, minutesAgo: 7200, body: 'If nobody takes the whole thing, would you split it? I only really need the morning off.' },
      { id: 'm-19', fromMe: true, minutesAgo: 7150, body: 'I can do the first half. Have the coordinator split it on the board and I will claim it.' },
      { id: 'm-20', fromMe: false, minutesAgo: 7100, body: 'Done — it is up now. You are a lifesaver.' },
    ],
  },
]

export function boardName(boardId: string): string {
  return SHOWCASE_BOARDS.find(b => b.id === boardId)?.name ?? 'Board'
}
