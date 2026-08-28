# MyShiftX

> A private, invite-only platform for trading, giving away, and claiming shifts — with photo schedule import, reliability tracking, and a Pro subscription tier.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.7.0--beta-orange.svg)](package.json)

**Status:** Beta — core product (auth, boards, wall, moderation, notifications, calendar sync, in-app messaging) is feature-complete, and **monetization is done**: Stripe checkout, the four Pro plans, the 14-day trial, the customer portal, and the webhook→membership pipeline are all live, with the live-mode checkout verified on production `2026-08-05`. What remains before public launch (`1.0.0`) is opening the front door — AdSense review is in progress and signups are currently closed while the site runs in showcase mode. Legal/business formation is still outstanding. See [TASKS.md](TASKS.md) for the full breakdown.

**⚠️ Disclaimer:** MyShiftX is an independent platform and is not affiliated with, sponsored by, or endorsed by any specific employer. It was built for fun.

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Roles](#roles)
- [Getting Started](#getting-started)
- [Development](#development)
- [Database Schema](#database-schema)
- [Security & Privacy](#security--privacy)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

MyShiftX replaces the chaos of Facebook groups with a structured, secure platform organized around **invite-only boards**. Users join a board with a code, then post, claim, and track shifts scoped to only the boards they belong to — with a real claim-and-confirm loop, push/email/calendar notifications, and an AI-powered photo import that gets a new user's whole schedule onto the app in one photo.

- **Trade or give away shifts** you can't work, and **claim** open ones with a visible reliability record
- **Request specific shifts**, with automatic matching and notification when a fitting offer appears
- **Import your schedule from a photo** — Gemini reads a screenshot of your paper or on-screen schedule and creates the shifts for you
- **Stay scoped** — only see posts from boards you've joined
- **Sync to your own calendar** (Google, Apple, Outlook) via a live iCal feed

Built as an installable Progressive Web App (works offline-tolerant, adds to the Home Screen on iOS/Android/desktop) with web push notifications, board-level moderation, and a Stripe-backed Pro subscription tier.

---

## The Problem

People coordinating shift trades and coverage today rely on Facebook groups or word-of-mouth threads, which creates:

- **Noise:** Hundreds of unrelated posts make finding a relevant shift difficult
- **Security risks:** No verification of user status or group membership — anyone can see or post to a Facebook group
- **No structure:** Posts lack standardized formatting, so filtering by date, board, or type is impossible
- **Ghosting:** People say "I'll take it" and then don't follow through, with no accountability and no record of who's reliable
- **Manual entry friction:** Getting a whole schedule into any app means typing it in shift-by-shift, so most people never bother and the tool goes unused

---

## The Solution

MyShiftX solves each of those directly:

1. **Board-Based Access:** Users join private boards via invite codes — posts are scoped to your boards only, so there's no public noise or unverified members
2. **The Wall:** A unified, filterable, realtime feed of all shift offers and requests across your boards
3. **Claim-and-Confirm Trade Loop:** Claiming a shift is a real toggle with a live claim count, not a post that just vanishes — every user builds a visible reliability record (shifts posted, claims followed through, claims backed out of), which is what actually solves ghosting
4. **Shift Bundles:** Multiple shifts can be tied together so a claimant takes all of them or none, for schedules that only make sense as a set
5. **Photo Schedule Import:** A photo of a paper or on-screen schedule goes through Gemini 2.5 Flash and comes back as real shifts on the calendar in seconds — the fastest path from "just signed up" to "actually has data in the app"
6. **Matching & Notifications:** New offers/requests are matched against standing requests/offers automatically, with email and web push alerts (SMS planned for Pro)
7. **Verification & Moderation:** Email verification, flagging with a resolution workflow, and a two-level role system (platform-wide Global Roles + per-board Board Roles) keep boards trustworthy
8. **Audit Trails:** Soft deletes and flag/removal-reason tracking preserve accountability instead of silently erasing history
9. **Sustainable Free Tier:** A $4.99+/mo Pro tier (ad-free, live Wall, unlimited photo imports, calendar sync) funds the product without paywalling the core trade/give/request loop

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Row-Level Security, Realtime, Storage)
- **Payments:** Stripe (Checkout, subscriptions, customer portal, webhooks)
- **Email:** Resend (transactional templates for verification, matches, billing, digests)
- **AI:** Google Gemini 2.5 Flash (photo → structured schedule extraction)
- **Notifications:** Web Push (VAPID) for installed-PWA push, incl. iOS 16.4+
- **Calendar:** iCal feed generation for Google Calendar / Apple Calendar / Outlook sync
- **Charts:** Recharts (admin leaderboard & stats)
- **Deployment:** Vercel (serverless functions + cron for expirations and downgrades)
- **Target:** Progressive Web App — installable on iOS, Android, and desktop

---

## Key Features

### 🏠 The Wall
- Unified, realtime feed of shift offers and requests across all your boards
- Filter by board, date, keyword, post type, or your own posts
- Posts auto-expire before shift start time
- Pro members see new posts live; Basic members get a "refresh to see it" banner

### 🔄 Shift Posts (Offers) & Claiming
- Badges: Trade, Giveaway, Overtime Approved
- Claim toggle ("I'll take this") with a live claim count — claiming registers interest without pulling the post, so multiple people can signal at once
- Every user builds a reliability record (posted / claimed-and-followed-through / backed-out) visible on the Admin Leaderboard
- Shift bundles: tie multiple shifts together so a claim is all-or-nothing
- Auto-expires 30 minutes before shift start; edit/deactivate your own posts

### 📋 Request Posts
- Post shift requests by date and preferred time window
- Automatic matching against new offers, with email + push notification to both sides
- Owner can mark a request Fulfilled
- Auto-expires at end of requested date

### 📷 Photo Schedule Import
- Photograph a paper or on-screen schedule; Gemini 2.5 Flash reads it and creates shifts automatically
- Recognizes and skips named absence codes (Holiday, PTO, Sick, FMLA, etc.)
- Review/conflict handling before shifts are committed
- 4 imports/month on Free, unlimited on Pro

### 💬 In-App Messaging
- Real-time threads between board-mates (shared-board only, no cross-board DMs)
- Unread badges, read receipts, reactions, and push notifications

### 🔔 Notifications
- Web push (installable PWA, including iOS 16.4+ after Add to Home Screen)
- Transactional email via Resend (verification, shift matches, billing, weekly digest)
- Match alert emails and a live Wall are Pro perks; push stays free for everyone

### 📅 Calendar
- Personal calendar with month grid and list views
- Live iCal feed + one-click `.ics` download for Google Calendar, Apple Calendar, and Outlook (Pro)

### ⭐ Subscriptions (Stripe)
- Free tier covers the full trade/give/request/claim loop
- Pro ($4.99/mo, with quarterly/semiannual/annual options and a 14-day trial): ad-free, live Wall, match alert emails, unlimited photo imports, calendar sync
- Stripe Checkout, customer portal (plan changes, invoices, cancellation), and webhook-driven membership sync

### 🏷️ Board System
- Private boards joined via invite codes
- Leaders create boards and manage invite codes (pause/resume, regenerate)
- Users can leave boards; Leaders can delete boards
- Pending join requests shown to Mods/Leaders for approval
- Join attempt rate limiting: 5 attempts/minute, 15 failures/24h → account deactivation

### 🚩 Moderation & Leadership
- Flag inappropriate posts, comments, or profiles, with a resolution workflow
- Archive view of past/expired/removed posts with removal reason tracking
- Admin panel: user management, board management, a leaderboard (most posted / most claimed-through / most backed-out, ranked in SQL), and stats with board filtering and charts
- Soft deletes and audit trails preserve accountability

### 🎨 Personalization
- Profile pictures with upload + crop
- 6 themes (Light, Nordic, Kitty, Dark, Midnight, Cyberpunk) with persisted preference
- Dark mode toggle, guided onboarding tour

### 📱 Mobile-First, Installable
- WCAG 2.1 AA compliant (7:1 contrast, 44×44px touch targets)
- Responsive across phones, tablets, desktops
- PWA install flow, including a guided iOS Add-to-Home-Screen walkthrough for push support

---

## Roles

MyShiftX uses two independent role systems.

> **Naming note:** the labels below are what users see as of 2026-07-18. Internally
> (DB values, RLS policies, route paths, code) the board "Admin" is still stored as
> `Leader` and the global "Overlord" as `Admin` — the display mapping lives in
> `lib/roles.ts`.

### Global Roles (platform-wide)

| Role | Permissions |
|------|-------------|
| **Guest** | View landing page, login, register |
| **User** | Join boards, view The Wall, post shifts/requests, manage profile |
| **Overlord** (stored as `Admin`) | Full platform control — manage users, boards, and global settings |

### Board Roles (per-board)

| Role | Permissions |
|------|-------------|
| **User** | View and post on the board |
| **Mod** | User permissions + moderate posts, manage flags and approvals |
| **Admin** (stored as `Leader`) | Mod permissions + manage invite code, rename board, delete board, promote/demote members |

Board roles are independent of Global Roles. A platform User can be a board Admin on one board and a Mod on another.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/ace-d-baugh/wdwshiftx.git
cd wdwshiftx

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase URL and anon key

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

### Environment Variables

See [.env.example](.env.example) for the full list with comments. The core ones:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (subscriptions)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_QUARTERLY=
STRIPE_PRICE_PRO_SEMIANNUAL=
STRIPE_PRICE_PRO_ANNUAL=

# Resend (transactional email)
RESEND_API_KEY=

# Gemini (photo schedule import)
GEMINI_API_KEY=

# Web Push (VAPID keypair)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Cron / feature flags
CRON_SECRET=
NEXT_PUBLIC_REGISTRATION_OPEN=1
NEXT_PUBLIC_SHOWCASE_MODE=
```

Every paid or third-party-dependent feature (Stripe, push, photo import, ads) is gated on its own env var being set — unset it locally and that feature quietly disables instead of erroring (`isStripeConfigured()`, `lib/showcase/mode.ts`, and similar checks).

---

## Development

### Project Structure

```
wdwshiftx/
├── app/                      # Next.js App Router pages
│   ├── (auth)/               # Auth routes (login, register, etc.)
│   ├── (dashboard)/          # Protected app routes
│   │   ├── wall/             # The Wall — main feed + new post forms
│   │   ├── profile/          # Profile + My Boards management
│   │   ├── leader/           # Mod/Leader tools (approvals, flags, archive)
│   │   └── admin/            # Admin panel (users, boards)
│   └── actions/              # Server actions (boards, shifts, requests)
├── components/               # React components
│   ├── ui/                   # Reusable UI primitives
│   └── features/             # Feature-specific components
├── lib/                      # Utilities and helpers
│   ├── supabase/             # Supabase client setup
│   └── validations/          # Zod schemas
├── public/                   # Static assets
└── supabase/                 # Database migrations
```

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
npm run db:migrate   # Push migrations to remote Supabase
npm run db:reset     # Reset local database (dev only)
```

---

## Database Schema

### Core Tables

- **users** — User accounts with global role (`Guest | User | Admin`), active status, `membership` (`Basic | Pro | Trial`), Stripe customer/subscription IDs, and avatar
- **boards** — Private boards with name, invite code, and enabled flag
- **user_boards** — Board membership with per-board role (`User | Mod | Leader`) and approval status
- **board_join_attempts** — Rate-limiting log for invite code attempts
- **shifts** — Shift offers (trades/giveaways), scoped to a board
- **shift_bundles** / bundle membership — ties multiple shifts together for all-or-nothing claiming
- **shift_claims** — "I'll take this" claims, with reliability tracking (followed-through vs. backed-out)
- **requests** — Shift requests, scoped to a board, with a `fulfill_own_request()` completion path
- **match_events** — one row logged per shift/request match, for the leaderboard and stats
- **comments** — Comments on shifts and requests
- **flags** — Moderation flags on posts/profiles, scoped to a board, with removal-reason tracking
- **conversations / messages** — in-app messaging with reactions and read receipts, board-scoped
- **push_subscriptions** — Web Push subscription endpoints per user
- **schedule_import quota tracking** — monthly photo-import counters (Free vs. Pro limits)

### Key Design Decisions

- **Soft Deletes:** `is_active` flags preserve audit trails on posts and comments
- **RLS via SECURITY DEFINER helpers:** `is_board_member()`, `is_board_moderator()`, `is_board_leader()`, and `is_any_board_moderator()` prevent RLS recursion while enforcing board-scoped access
- **Invite Code Format:** 10-character alphanumeric from an unambiguous 32-char charset (no O/0, I/1 confusion), generated with `crypto.randomBytes` and masked to 5 bits per character so there is no modulo bias. Codes issued before 2026-07-27 are 7 characters and remain valid; the join flow accepts 7–10.
- **Generated Columns:** `expires_at` auto-calculated for shifts and requests

---

## Security & Privacy

### What We Store
- Display name, email, phone (optional)
- Board memberships and roles
- Shift/request posts, comments, flags

### What We DON'T Store
- Passwords (Supabase Auth handles hashing)

### Security Measures
- Email verification required before accessing the app
- Invite code rate limiting (DB-backed, 24-hour rolling window)
- Row-Level Security (RLS) on all tables — board membership enforced at the database level
- HTTPS only
- Server Actions for all mutations (no exposed REST endpoints for writes)

---

## Roadmap

### Phase 1: Alpha — done
- [x] Authentication flow (register, verify, login, reset password, OAuth)
- [x] Board system (create, join, leave, manage invite codes)
- [x] The Wall — unified, realtime shift/request feed with filtering
- [x] Board-level moderation (approvals, flags, archive)
- [x] Admin panel (users, boards, leaderboard, stats)
- [x] PWA support

### Phase 2: Beta — done
- [x] Monetization — Stripe checkout, four Pro plans, 14-day trial, customer portal, webhook→membership pipeline (live checkout verified on production `2026-08-05`)
- [x] Push notifications, incl. guided iOS Add-to-Home-Screen install flow
- [x] Trade loop — claim a shift, reliability tracked (posted / followed-through / backed-out)
- [x] Photo schedule import (Gemini) — schedule-first onboarding
- [x] In-app messaging, calendar sync (iCal), shift bundles
- [x] Full security audit closed (RLS hardening, column locks, function lockdown)

### Phase 3: Public Launch — in progress
- [ ] Open the front door — showcase mode is currently on, so registration is closed while the site awaits AdSense re-review
- [ ] Get AdSense approved on the public/marketing surface
- [ ] Broader rollout and marketing to shift-trading communities ("N shifts covered on MyShiftX" as the proof point)
- [ ] 500+ verified users

### Not Yet Started
- Discount/promo codes (Stripe coupons)
- SMS notifications (Twilio, Pro tier)
- Trade preferences (preferred shift types/times factored into matching)
- Bulk shift import (CSV / multi-week photo scan)
- Analytics platform decision (PostHog / Sentry)

### Deferred
- Native mobile app (Year 2+)
- Remaining IP/legal filings
- Facebook OAuth
- Multi-language support

---

## Contributing

This is currently a solo project, but contributions are welcome once the alpha is stable.

### Guidelines
- Follow existing code style (Prettier + ESLint configs)
- Write tests for new features
- Update documentation for API changes

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Support

- **Issues:** [GitHub Issues](https://github.com/ace-d-baugh/wdwshiftx/issues)
- **Discussions:** [GitHub Discussions](https://github.com/ace-d-baugh/wdwshiftx/discussions)

---

**Remember:** Always verify shift trades and OT approval on your employer's official scheduling pages. MyShiftX is a bulletin board only — communication and final execution are your responsibility.
