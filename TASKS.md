# MyShiftX — Task Board

## Where things stand — `2026-08-05`

**The product is built and Stripe is closed.** Auth, boards, the Wall, messaging, claims, bundles, photo import, push, calendar sync, Stripe (live checkout verified on production `2026-08-05`), feature gating, ads, and the full security audit are all shipped and live. What's left is not "finish the app" — it's **get the front door open**.

**Blocking everything commercial:**

| # | What | Who | Note |
|---|---|---|---|
| **25** | AdSense re-review — showcase mode is live, needs Search Console check + resubmit | 👤 You | Registration is **404 while showcase mode is on**. Nobody can sign up until it's reverted |
| **25** | Open the site for real signups (unset `NEXT_PUBLIC_SHOWCASE_MODE`) | 👤 You | See the deadlock note below — this, not Stripe, is now the actual bottleneck |

> **⚠️ The launch deadlock.** As of `2026-08-05` nobody is using MyShiftX, because launch is being held until ads work. That is circular: ad revenue is pageviews × RPM, and pageviews are currently zero, so AdSense approval on every page in the site would still earn exactly $0. Stripe is now proven and a handful of $4.99 subscribers would out-earn the ads by an order of magnitude. The recommended order is **launch first, monetise second**: open signups → grow real traffic and blog content → get AdSense approved on the public surface → add a crawler login and enable the Wall ad slot once there is traffic worth serving.

**✅ The security audit is fully closed on both apps** as of `2026-07-28` — S8's column lock applied and verified on MyShiftX, and all three WDWShiftX database steps run and PASSing. No security work is outstanding.

**Genuinely not started** (everything else is done or deferred): **9** discount codes · **11** SMS/Twilio · **18** trade preferences · **20** bulk import · **24** analytics *(awaiting your decision)*.

**Deferred by choice:** **13** the remaining IP/legal filings · **14** the native app *(Year 2+)* · Facebook OAuth.

---

## What's Done ✅

### Auth & Access
- ✅ Email/password registration with display name validation
- ✅ Email verification flow (Supabase + custom HTML template)
- ✅ Login page with session management
- ✅ Forgot password + reset password pages (full flow)
- ✅ Role-based access control (User → Mod → Leader → Admin)
- ✅ Account deactivation flow

### Boards
- ✅ Board creation (Leaders only)
- ✅ Invite-code join system with moderator approval queue
- ✅ Board management: rename, invite code toggle/regenerate, member role changes, ownership transfer, deletion
- ✅ Mobile-responsive board management UI with three-dot action menu
- ✅ "My Boards" section on profile with + button to create

### The Wall (Shift & Request Posts)
- ✅ Post shift offer form with validation (title, date/time, type, OT, details)
- ✅ Post shift request form with preferred time slots
- ✅ Edit shift and edit request (owner only)
- ✅ Remove / deactivate posts (owner only)
- ✅ Wall filtered by board, date, and post type tabs (Offers / Requests)
- ✅ ShiftCard and RequestCard with collapsible details, compact mobile layout
- ✅ Interest marking (one-tap star with confirmation to remove)
- ✅ Comment system with reply, edit, delete, and flagging
- ✅ Contact button (email mailto) for non-owners; disabled state when contact not set up

### Moderation & Leadership
- ✅ Join request approvals queue
- ✅ Flagging system (posts and comments) with resolution workflow
- ✅ Archive view of past/expired posts
- ✅ User management page for Admins

### Infrastructure
- ✅ Shift and request auto-expiration via Vercel cron (`/api/cron/expirations`, runs 3 AM daily)
- ✅ Expiration cron secured with `CRON_SECRET` header
- ✅ Email delivery infrastructure: Resend SDK wired up at `/api/send`
- ✅ Transactional email templates (verify email, password reset, generic notification)
- ✅ Supabase Row-Level Security on all tables
- ✅ Form validation (client + server) across auth, shifts, and boards

### UI / UX
- ✅ Responsive layout with mobile bottom nav and hamburger menu (with open/close animation)
- ✅ Dark mode (toggle in account menu, persisted to localStorage)
- ✅ My Calendar page
- ✅ 404 page with falling stars and floating compass
- ✅ Design token system (CSS variables + Tailwind config)
- ✅ `2026-07-19`: 6 themes (Light, Nordic, Kitty, Dark, Midnight, Cyberpunk — Dracula retired, replaced by Kitty, a soft-pastel light theme built from mint/sky/lavender/blush hexes). Picker grid groups light themes together on both breakpoints (desktop 3×2: Light/Nordic/Kitty over Dark/Midnight/Cyberpunk; mobile 2×3: Light/Dark, Nordic/Midnight, Kitty/Cyberpunk) via explicit per-item grid placement in `ProfileClient.tsx`, since one DOM order can't satisfy two different row-major layouts at once.

### Trade Loop v2 — bundles & claim rework (`2026-07-22` → `07-26`, ported from WDWShiftX)

This wave shipped after the last TASKS.md update and had no entry until `2026-07-28`. Every item is merged to `main` and its migration applied to production.

- ✅ **Shift bundles** (`bc7a3d4`) — a `shift_bundles` parent row ties two or more shifts together so a claimant takes all of them or none. Post/edit offers "Bundle with other shifts?" with three ways to add members (pick from your own upcoming schedule, add a new shift inline, or join another of your bundles on the same board). A DB trigger enforces that every bundled shift shares the bundle's board and owner, so claim eligibility stays one membership check. Bundled shifts show a Layers icon that filters the Wall to that bundle; claiming needs an all-or-nothing confirmation and accepting archives every member at once. Departure dissolves the bundle via an AFTER UPDATE/DELETE trigger pair
- ✅ **Claiming no longer removes the post** (`bc7a3d4`) — "I'll take this" now registers interest and leaves the post standing, so several people can independently signal on the same shift
- ✅ **"Interested" star retired on shifts** (`7eb8527`) — the one-tap star and the claim system were doing the same job with different amounts of structure. The star survives on **requests** (which have no claim system) behind a `showInterest` prop. The claim control moved into the post's action row as a real toggle (outlined → filled, click again to withdraw) with a live claim count for every viewer, via the new `get_shift_claim_counts()` SECURITY DEFINER aggregate — bare per-post counts with no identity attached, since `shift_claims_select_parties` only exposes individual rows to the claimant and owner
- ✅ **Mark Fulfilled on requests** (`b3fa3d4`) — requests had no "someone actually covered this" outcome, only expired / self-deleted / mod-removed. Owner's menu gained a confirmed action backed by a narrow `fulfill_own_request()` RPC; the `removed_reason` constraint was widened to accept it
- ✅ **Match logging** (`b3fa3d4`) — matches were computed to fire a notification and then thrown away. `match_events` now logs one row per match (board, shift, request, poster, requester), written only by the server-side notification path. RLS on with **no policies at all**, so it's service-role write / admin-RPC read only; a unique index on `(shift_id, request_id)` makes retries idempotent. Matches before this ships can't be reconstructed — the count starts at zero
- ✅ **Admin Leaderboard + Stats redesign** (`07596e8`) — new Leaderboard tab with three ranked Top 10 lists (most shifts posted, most claims followed through, most backed out of), ranked entirely in SQL via a partitioned window function rather than shipping every user's totals to the client. Stats gained a board filter, pie charts with per-slice counts and percentages, a real "No data yet" empty state, and the two new match metrics
- ✅ **Calendar List view** (`37fc2a6`) — vertical day-by-day list alongside the month grid, with a Grid/List toggle persisted in localStorage per user id. Both views gained click-anywhere-on-a-future-day to open the create form prefilled with that date (a per-day "+" icon was tried and rejected as clutter), and both show the bundle Layers icon
- ✅ **Role-aware nav dropdown** (`d46cfe5`) — the dropdown builder moved out of `Navbar` into a shared `components/layout/AccountDropdown`, so the marketing header and the app header stopped duplicating role-branching logic. Approvals, Flags, and Messages each carry their own badge tied to their own pending count, with a dot on the trigger when any is non-zero
- ✅ **Schedule-import polish** — named absence codes (Holiday, FMLA, ADO, Vacation, PTO, Sick) added to the prompt's skip list (`ffe03cd`); a friendly message instead of a raw error when Gemini's rate limit is hit (`94c087c`)
- ✅ **`@disney.com` signups blocked** (`527846f`) — rejected in both the client-side Zod schema (generic message, no reason given) and the `handle_new_user()` DB trigger, so calling the Auth API directly doesn't bypass it. Verified the deployed predicate blocks `someone@disney.com` and `someone@Disney.COM` while leaving `someone@mydisney.com` and `someone@disney.com.evil.net` unaffected
- ✅ **Help page brought current** (`2fa7fa2`) — bundles, interest-based claiming, List view, and Mark Fulfilled

---

## Priority To-Do List

Tasks are ordered by impact. Each has a **🤖 Claude handles** section (code I write for you) and a **👤 You handle** section (accounts, config, decisions that only you can do). Check off steps as you go.

---

### 1 — Live Updates (Supabase Realtime) ✅ DONE

**🤖 Claude handled:**
- ✅ Added Realtime channel subscriptions to `WallClient.tsx` for `shifts` and `requests` tables
- ✅ INSERT / active UPDATE → silent re-fetch (no loading spinner flicker)
- ✅ Deactivation UPDATE / DELETE → instant removal from local state
- ✅ Channels cleaned up on component unmount

**👤 You handled:**
- ✅ Enabled Realtime replication for `shifts` and `requests` tables in Supabase dashboard

**👤 Still needed:**
- ✅ Tested with two browser tabs — live updates confirmed working

---

### 2 — Interest Notification Email ✅ DONE

**Why second:** When someone marks interest on your shift, you currently have no idea unless you manually check. This closes the most critical communication loop in the app.

**🤖 Claude handled:**
- ✅ Created `app/actions/notifications.ts` — `notifyInterest()` server action using service-role Supabase client
- ✅ Reads owner's email and `notify_via_email` pref before sending (respects opt-out)
- ✅ Calls Resend directly (no intermediate `/api/send` hop needed)
- ✅ Added `interestedHtml()` template to `email-template.tsx` with matching header/footer style
- ✅ Hooked into `CommentSection.tsx` — fires on both the quick-star pill and the comment form when "Interested?" is checked; fire-and-forget so it never blocks the UI

**👤 You handled:**
- ✅ `RESEND_API_KEY` confirmed in Vercel environment variables
- ✅ Sending domain `noreply@myshiftx.com` verified in Resend
- ✅ Tested — email received successfully

---

### 3 — Shift Match Notifications ✅ DONE

**🤖 Claude handled:**
- ✅ Matching logic: same board + same date (ET) + shift start time falls within preferred time window
- ✅ `notifyShiftPosted()` — finds active requests that match and emails both parties
- ✅ `notifyRequestPosted()` — finds active shifts that match and emails both parties
- ✅ `shiftMatchHtml()` email template with role-aware copy for each recipient
- ✅ Deduplication by user ID prevents double emails from duplicate DB records
- ✅ Added `request_title` field to request form and card

**👤 You handled:**
- ✅ Added `request_title` column to `requests` table in Supabase
- ✅ Tested both directions — emails confirmed working

---

### 4 — OAuth Login (Google + LinkedIn) ✅ DONE

**🤖 Claude handled:**
- ✅ `OAuthButtons` component — branded Google LinkedIn buttons with SVG icons
- ✅ Buttons added to login and register pages with a divider
- ✅ `/auth/callback` route — exchanges code, sends new OAuth users to profile to set display name
- ✅ Profile page welcome banner for first-time OAuth arrivals

**👤 You handle — complete each provider below, then test:**

#### Google
- ✅ Go to **console.cloud.google.com** → select or create a project
- ✅ APIs & Services → **OAuth consent screen** → External → fill in App name, support email, developer email → Save & Continue through all steps
- ✅ APIs & Services → **Credentials** → Create Credentials → **OAuth client ID**
  - Application type: **Web application**
  - Authorized redirect URIs → Add: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
  - *(your ref is the subdomain part of your Supabase project URL — find it in Supabase → Settings → General)*
- ✅ Copy **Client ID** and **Client Secret**
- ✅ Supabase Dashboard → **Authentication → Providers → Google** → Enable → paste both → Save
- ✅ Test: click Google on the login page, sign in, verify you land on profile or wall

#### LinkedIn
- ✅ Go to **linkedin.com/developers** → **Create app**
  - App name: `MyShiftX`, LinkedIn Page: create/use a company page (required by LinkedIn), upload logo
- ✅ **Auth** tab → OAuth 2.0 settings → Authorized redirect URLs → **Add URL**:
  `https://<your-supabase-ref>.supabase.co/auth/v1/callback` → Update
- ✅ **Products** tab → **Sign In with LinkedIn using OpenID Connect** → **Request access** (usually instant)
- ✅ **Auth** tab → copy **Client ID** and **Client Secret**
- ✅ Supabase Dashboard → **Authentication → Providers → LinkedIn (OIDC)** → Enable → paste both → Save
  *(Use the **OIDC** provider specifically — not the older plain LinkedIn OAuth provider)*
- ✅ Test: click LinkedIn on the login page

---

### 5 — Feature Tier Reference 🗂️

This is the canonical Free vs Pro feature list. Use this when building the upgrade funnel (Task 8), feature gating (Task 10), and the ad system (Task 12). Emoji key: ✅ already built · 🔲 planned in task list · 🆕 new — not yet in roadmap

#### 🆓 Free (Basic) — $0

| Feature | Status |
|---|---|
| Account creation & profile | ✅ |
| Join unlimited boards (invite-only) | ✅ |
| Post shift offers and requests to board wall | ✅ |
| Mark interest in shifts (actual trade completed via company system) | ✅ |
| Manual shift entry & calendar view | ✅ |
| In-app comments & flagging | ✅ |
| In-app messaging with anyone in the same board | ✅ |
| Claim a shift ("I'll take this") + per-user reliability record | ✅ |
| Shift bundles — take all of them or none | ✅ |
| In-app push notifications (web push / PWA, incl. iOS 16.4+) | ✅ Tasks 16 + 23 |
| 4 photo schedule imports per month (Gemini → auto-creates shifts) | ✅ Task 15 |
| Ads displayed (right sidebar on desktop, static at bottom of screen on mobile) | ⚠️ Built — blocked on AdSense approval (Tasks 12 + 25) |

#### ⭐ Pro — $4.99/mo · $13.99/3 mo · $26.99/6 mo · $47.99/year

| Feature | Status |
|---|---|
| Everything in Free | — |
| **Ad-free experience** | ✅ Task 10 |
| **Match alert emails** (web push stays free for everyone) | ✅ Task 10 |
| **Live-updating Wall** (Basic gets a "refresh to see it" banner instead) | ✅ Task 10 |
| **SMS notifications** for shift matches (up to 30/mo) | 🔲 Task 11 — not started |
| **Unlimited photo schedule imports** | ✅ Task 15 |
| **Calendar export & sync** (Google Calendar, Apple iCal) | ✅ Task 17 |
| **Trade preferences** — set preferred shift types, time of day, etc. for smarter matching | 🔲 Task 18 — not started |
| **Bulk shift import** — CSV upload or multi-week photo scan | 🔲 Task 20 — not started |

#### 🆕 New features not yet in the roadmap

The following Pro and Free features have not been scoped yet and will need dedicated tasks before launch or shortly after:

- ~~**Photo schedule import**~~ — ✅ Done (Task 15): user photographs their paper or on-screen schedule and Gemini 2.5 Flash reads it onto their calendar in seconds, with review/conflict handling. The highest-value Free feature and the biggest differentiator from manual entry. 4/month Free, unlimited Pro.
- ~~**In-app messaging**~~ — ✅ Done (Task 19): real in-app threads between board-mates with Realtime, unread badges, and push notifications. All tiers, shared-board only.
- **In-app push notifications** — browser-native web push (PWA-style) using the Push API and a service worker. Free tier. Works on desktop Chrome/Edge/Firefox, Android Chrome, **and iOS 16.4+ once the PWA is added to the Home Screen** (Task 23 ships a guided install walkthrough; the old "not available on iOS" note was outdated). Supplements or replaces email for non-SMS users. Medium complexity.
- ~~**Calendar export/sync**~~ — ✅ Done (Task 17): live-sync iCal feed URL + one-click `.ics` download, works with Google Calendar, Apple Calendar, and Outlook. Pro only.
- **Trade preferences** — users set preferred shift types, days of week, and time windows; the matching engine factors these in when firing notifications. Extends the existing `notifyShiftPosted`/`notifyRequestPosted` logic. Medium complexity.
- ~~**Direct messaging outside boards**~~ — Removed. Messaging is board-member only for all tiers.
- **Bulk shift import (CSV / multi-week photo)** — upload a CSV of shifts or scan multiple weeks of a schedule at once. Pro only. Extends photo import (Task 15).

---

### 6 — Membership Schema (Database) ✅ DONE

**Why first:** Everything else — Stripe, feature gating, ads — depends on knowing a user's membership tier.

**🤖 Claude handles:**
- ✅ Add `membership` column (`text`, default `'Basic'`, values: `'Basic'` | `'Pro'` | `'Trial'`) to the `users` table migration
- ✅ Add `trial_ends_at` column (`timestamptz`, nullable) — set when a Trial starts, checked on each login/request
- ✅ Add `trial_used` column (`boolean`, default `false`) — prevents a second trial on the same account even if they cancel and re-register (tracked by email)
- ✅ Update TypeScript types (`lib/database.types.ts` matches the live schema)
- ✅ Nightly downgrade job — folded into the existing `/api/cron/expirations` Vercel cron (runs 3 AM daily) rather than a separate Supabase Edge Function; flips `Trial` → `Basic` and clears `trial_ends_at` once it has passed
- ✅ RLS/write protection: a `BEFORE UPDATE` trigger (`enforce_membership_protection`) silently reverts any change to `membership`/`trial_ends_at`/`trial_used` made by the `authenticated` role — only the service role (Stripe webhook) can actually change them
- ✅ RLS/read protection: `2026-07-01` — found that `membership`/`trial_ends_at`/`trial_used` were readable by *any* logged-in user (not just the owner) via the broad `users_select_authenticated` policy. Fixed by revoking column-level `SELECT` on those three columns from `anon`/`authenticated` and adding a `get_own_membership()` RPC that returns only the caller's own values (`SECURITY DEFINER`, filtered by `auth.uid()`). Verified: selecting `membership` as the `authenticated` role now fails with "permission denied for table users"; all other columns (`display_name`, `email`, `role`, etc.) remain readable as before, so comments/board-member/admin/mod features are unaffected. Migrations: `20260701152617_membership_schema_backfill.sql`, `20260701152628_restrict_membership_column_access.sql`, `20260701152710_fix_membership_column_grant_precedence.sql`

**👤 You handle:**
- ✅ Migration SQL already run directly in Supabase — columns are live in the `users` table
- ✅ Confirmed columns appear correctly (verified via Supabase schema inspection)
- ✅ N/A — used the existing Vercel cron instead of a separate Supabase Edge Function; already enabled

**Note:** these schema changes existed live in Supabase but had no corresponding migration file in the repo (applied via SQL Editor directly). Backfilled as `20260701152617_membership_schema_backfill.sql` so a fresh DB restore from the repo stays in sync. Two unrelated migrations (`handle_new_user_google_display_name`, `handle_new_user_fullname_fallback` — from the OAuth display-name work) were *also* live but missing from the repo; backfilled as `20260624224803_handle_new_user_google_display_name.sql` and `20260624225745_handle_new_user_fullname_fallback.sql` so the full migration history (30 files) now matches production exactly.

**Follow-up hardening (2026-07-01):** ran the Supabase security advisor as a broader check and fixed two more real issues, both applied + backfilled as migrations:
- `protect_membership_fields()` (the trigger from this task) and five other trigger functions were missing a pinned `search_path`, a standard SECURITY DEFINER hardening measure — fixed in `20260701153736_harden_trigger_functions.sql`.
- `protect_membership_fields`, `auto_add_admins_to_board`, `handle_new_user`, and `handle_email_verified` are trigger-only functions but were directly callable via PostgREST RPC (`/rest/v1/rpc/...`) by any signed-in or anonymous user — revoked `EXECUTE` from `anon`/`authenticated` on all four in the same migration.
- Still open (dashboard setting, not a migration): Supabase's "Leaked Password Protection" (HaveIBeenPwned check) is disabled — recommend enabling it under Authentication → Policies.

---

### 7 — Stripe Integration & Checkout ✅ DONE

**Why now:** The database schema is live; now wire up real payments before building the sales page around it.

**Status `2026-08-05`: closed.** Code shipped, migration applied, all four flows verified end-to-end in the sandbox, live-mode keys/prices/webhook/portal all configured on Vercel, and Ace has now run the live-mode checkout on production himself and confirmed the flow works end to end. Nothing about Stripe is blocking launch. The two test-mode items below are moot — the account is on live keys.

**👤 You handle (do these first):**
- ✅ Create a Stripe account at **stripe.com** (use your business email)
- ✅ In Stripe Dashboard → **Products** → **Add product**: `MyShiftX Pro`
  - Add price: **$4.99 / month** (recurring, monthly) "Pro Monthly" Badge: None (or "Best for Flexibility") price_1TvLnJRkt6cn1JfFJ9FfomWy
  - Add price: **$13.99 / 3 month** (recurring, monthly) "6.7% off monthly" price_1TvLnJRkt6cn1JfFxwJwoVZh
  - Add price: **$26.99 / 6 months** (recurring, every 6 months) "Pro Semi-Annual" Badge: SAVE 10% "Billed every 6 months. Saves you $3." price_1TvLnJRkt6cn1JfFOwpqG5xE
  - Add price: **$47.99 / year** (recurring, yearly) "Pro Annual" Badge: SAVE 20% BEST VALUE or 2 MONTHS FREE "Billed annually. Saves you $12 compared to monthly." price_1TvLnJRkt6cn1JfFBXS1THIJ
  - Note the **Price IDs** for each (format: `price_xxxxx`) — Claude needs these
- ✅ **`MyShiftX Pro Trial` product / $0.00 price — archive this, it's a trap.** A $0.00 price that recurs every 14 days doesn't convert to paid; it renews at $0.00 forever, so anyone picking it gets permanent free Pro. Stripe deliberately doesn't expose trial days on the Price edit page either — the price-level `trial_from_plan` route is deprecated in favour of `subscription_data.trial_period_days` on the Checkout Session ([docs](https://docs.stripe.com/payments/checkout/free-trials)). The trial now lives as `trialDays: 14` on the Monthly plan in `lib/pricing.ts` and is passed to Stripe at checkout; Stripe still owns the whole trial (card verification, countdown, reminder email, first charge, dunning).
- ✅ Stripe Dashboard → **Developers → API Keys** → copy **Publishable Key** and **Secret Key**
- ✅ Add to Vercel environment variables:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET` *(generate after Claude sets up the webhook endpoint)*
- ✅ Stripe Dashboard → **Developers → Webhooks** → **Add endpoint**:
  - URL: `https://myshiftx.com/api/webhooks/stripe`
  - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
  - Copy the **Signing Secret** → add as `STRIPE_WEBHOOK_SECRET` in Vercel
- ✅ In Stripe Dashboard → **Products** → **Add product**: `MyShiftX Pro`
  - Add test price: **$4.99 / month** (recurring, monthly) "Pro Monthly" Badge: None (or "Best for Flexibility") price_1TvRbbRkt6cn1JfFLHAmjG3N
  - Add test price: **$13.99 / 3 month** (recurring, monthly) "6.7% off monthly" price_1TvRbVRkt6cn1JfFWzCnDWPX
  - Add test price: **$26.99 / 6 months** (recurring, every 6 months) "Pro Semi-Annual" Badge: SAVE 10% "Billed every 6 months. Saves you $3." price_1TvRbKRkt6cn1JfFmxAKX8VX
  - Add test price: **$47.99 / year** (recurring, yearly) "Pro Annual" Badge: SAVE 20% BEST VALUE or 2 MONTHS FREE "Billed annually. Saves you $12 compared to monthly." price_1TvRb1Rkt6cn1JfFSWmXBHJ4
- ✅ In Stripe Create Test API Keys → copy **Publishable Key** and **Secret Key**
  - Add to Vercel env: `STRIPE_SECRET_KEY`
  - Add to Vercel env: `STRIPE_PUBLISHABLE_KEY`


**🤖 Claude handled (shipped `2026-07-20`; code complete, migration NOT yet applied):**
- ✅ `stripe` npm package (v22.3.2). Client in `lib/stripe.ts`, pinned to API version `2026-06-24.dahlia` so a future `npm update` can't shift response shapes under the webhook. Whole surface gated on `STRIPE_SECRET_KEY` via `isStripeConfigured()` — same env-flip pattern as AdSense/push/Gemini
- ✅ Migration `20260720120000_stripe_customer_columns.sql` — `stripe_customer_id` (partial unique) + `stripe_subscription_id` (partial index) on `users`. Both deliberately left OUT of the client SELECT grant (the Task 6 lockdown made grants an explicit column list, so new columns are private by default). Also extends `protect_membership_fields()` + its trigger WHEN clause to cover both columns, so `authenticated` can't repoint their row at someone else's Stripe customer
- ✅ `/api/checkout` — client posts a plan **key**, never a Price ID, so a tampered request can't check out against an arbitrary price. Reuses an existing `stripe_customer_id` rather than minting duplicate customers; blocks if already Pro; `allow_promotion_codes: true` so Task 9's coupons work with no further code; omits `payment_method_types` entirely per Stripe guidance (dynamic payment methods convert better than hardcoded card-only)
- ✅ `/api/webhooks/stripe` — signature-verified against the raw body (`req.text()`, not `req.json()`). Handles `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_failed`. Status→tier map: `trialing`→Trial, `active`/`past_due`→Pro, everything else→Basic. **`past_due` deliberately keeps Pro** — Stripe is still retrying, and revoking features mid-dunning punishes someone for an expired card. DB write failures throw a 500 so Stripe retries rather than silently leaving a paying customer on Basic
- ✅ `trial_used` is burned the moment a trialing subscription exists, so cancel-and-resubscribe can't farm free months
- ✅ `/api/customer-portal` — Stripe-hosted portal for plan changes, card updates, **invoice downloads**, and cancellation. Nothing transactional is rebuilt in-app
- ✅ `paymentFailedHtml` email template (Resend), respects `notify_via_email`; a send failure never fails the webhook
- ✅ UI: `CheckoutButton` on all four `/upgrade` cards (Monthly reads "Start Free Trial" + a "Start with 14 days free" line), new `/upgrade/success` page that reports actual DB state rather than assuming the webhook already landed, `MembershipSection` card on Profile (`#membership`) with the Manage Billing button, new trial FAQ
- ✅ Verified: `tsc --noEmit` clean, `next lint` clean, `next build` passes with all three API routes registered

**👤 You handle (after Claude ships the code):**
- ✅ **Apply the migration** — `20260720120000_stripe_customer_columns.sql`. Applied to prod `2026-07-20` via Supabase MCP (`apply_migration`) after a first checkout test proved the columns were missing — every webhook was 500ing on `column users.stripe_customer_id does not exist`. Columns + trigger now confirmed live
- ~~Switch to test-mode keys before testing.~~ **Moot** — sandbox testing is finished and the account is on live keys. Kept for the note that **Price IDs are mode-specific**, which matters again if you ever need to re-test in the sandbox: the four `STRIPE_PRICE_*` values need test-mode equivalents when you flip
- ✅ Add to Vercel env: `STRIPE_PRICE_PRO_MONTHLY`, `_QUARTERLY`, `_SEMIANNUAL`, `_ANNUAL` (live-mode IDs are already in `.env.local`)
- ✅ Add `customer.subscription.created` to the webhook endpoint's event list in the Stripe Dashboard — the handler covers it, but the endpoint was configured before it existed
- [ ] Archive the `MyShiftX Pro Trial` product and its $0.00 price (see the ⚠️ note above)

**✅ Local sandbox testing — all four flows verified end-to-end `2026-07-20` (test user Lucas Hayes):**
- ✅ Checkout → Stripe → webhook → DB: `membership` flips to `Trial` (monthly), `billing_cycle=monthly`, `trial_used=true`, customer + subscription IDs linked
- ✅ First real gotcha caught: every webhook was 500ing because migration `20260720120000` had been marked done but never applied — fixed by applying it (see the migration line above)
- ✅ Renewal-failure path: forced a real `invoice.payment_failed` (attached Stripe's always-fails card `pm_card_chargeCustomerFail`, ended the trial early). Email **delivered** via Resend ("Your MyShiftX Pro payment did not go through"); member correctly **stayed Pro** (`past_due` keeps Pro by design). Note: the $2.25 charge in that test was a proration artifact of ending the trial early — a real trial user is charged the full $4.99 on day 14, no proration
- ✅ Cancel path: immediate cancel → `customer.subscription.deleted` → `membership` back to `Basic`, `billing_cycle`/`stripe_subscription_id` cleared, `stripe_customer_id` retained (so a re-subscribe reuses the same customer)
- ✅ Fixed along the way: canceled users no longer keep a stale `trial_ends_at` (webhook now nulls it for Basic). Duplicate test subs (from pre-fix retries) all shared one `user_id`, so deleting them fired delete-webhooks that flipped the user to Basic — a test-only artifact, impossible in prod where the "already Pro" guard blocks a second sub
- ✅ Test the Customer **Portal** UI itself once in the browser (Manage Billing → cancel / update card / download invoice) — the cancel path was verified via API, but clicking through the hosted portal is worth doing once

---

#### 🚀 Production go-live checklist (Stripe + Vercel) — do these before real customers

Everything above was **test mode**. Live mode is a completely separate world in Stripe: separate keys, separate products/prices, separate webhook endpoint, separate portal config. Nothing configured in the sandbox carries over.

**Stripe Dashboard — switch to LIVE mode (toggle off "Test mode" top-right):**
- ✅ Confirm the live `MyShiftX Pro` product exists with all four live prices (the live Price IDs are already in TASKS.md / commented in `.env.local`: monthly `price_1TvLnJ…FJ9FfomWy`, quarterly `…FxwJwoVZh`, semiannual `…FOwpqG5xE`, annual `…FBXS1THIJ`)
- ✅ Archive the live `MyShiftX Pro Trial` $0.00 product (the trap price) if it still exists in live mode
- ✅ **Developers → Webhooks → Add endpoint** (live mode): URL `https://myshiftx.com/api/webhooks/stripe`, events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Copy that endpoint's **live** `whsec_` — it is NOT the local `stripe listen` one
- ✅ **Settings → Billing → Customer portal** (live mode): enable Cancel subscription, Update payment method, Invoice history, then **Save** (portal config is per-mode; the test-mode save doesn't count)
- ✅ Confirm business/branding is set for live invoices: **Settings → Branding** (logo, accent color, support email) so live invoice PDFs read "MyShiftX"

**Vercel → Project → Settings → Environment Variables (Production):**
- ✅ `STRIPE_SECRET_KEY` = the **live** `sk_live_…` key
- ✅ `STRIPE_PUBLISHABLE_KEY` = the **live** `pk_live_…` key
- ✅ `STRIPE_WEBHOOK_SECRET` = the **live** endpoint's `whsec_…` (from the step above — not the CLI one)
- ✅ `STRIPE_PRICE_PRO_MONTHLY` / `_QUARTERLY` / `_SEMIANNUAL` / `_ANNUAL` = the four **live** Price IDs
- ✅ Redeploy so the new env vars take effect (Vercel doesn't apply env changes to the running deployment automatically)

**Post-deploy smoke test (live mode, real card, small commitment):**
- ✅ `2026-08-05` — Ace ran the live checkout on production and reported the flow working end to end. Marking this closed on his verification rather than a transcript of each step; if a real customer ever hits a checkout problem, re-verify the four sub-steps below individually before assuming a code regression
- ✅ On production, run one real checkout on the **Monthly** plan → land on `/upgrade/success` as Trial, DB row flips
- ✅ In Stripe live **Developers → Webhooks**, endpoint shows recent `200` deliveries (not `4xx`/`5xx`)
- ✅ Cancel that subscription via Manage Billing → return to Basic
- [ ] (Optional) Refund the proration/charge from the live Dashboard if you charged yourself

---

### 8 — Subscription Sales / Upgrade Page ✅ DONE

**Why now:** Users need a destination to convert. Build this alongside Stripe so the checkout button has somewhere to go.

**🤖 Claude handles:**
- ✅ `2026-07-09`: `/upgrade` page built — hero ("Stop Refreshing. Start Swapping."), 4 pain-point cards, 4-card pricing grid (Monthly/3-Month/6-Month/Annual with per-month framing + savings badges, Annual featured), Basic-vs-Pro comparison table (coming-soon rows labeled honestly), FAQ accordion, footer CTA. Plan data + comparison rows live in `lib/pricing.ts` (single source of truth; each plan carries its future `STRIPE_PRICE_*` env name). Buy buttons render "Launching Soon" until `STRIPE_SECRET_KEY` is set — same env-flip pattern as everything else. Already-Pro members see a thank-you ribbon instead of CTAs. Added to sitemap.
- ✅ Wire each "Go Pro" button to `/api/checkout` with the correct Price ID (blocked on Task 7 Stripe setup — buttons + price IDs are staged in `lib/pricing.ts`)
- ✅ `2026-07-09`: "Upgrade to Pro" ⭐ entry in the account dropdown for Basic users (`showUpgrade` prop on Navbar, driven by the tier signal in the dashboard layout)
- ✅ `2026-07-09`: Dismissible-per-session upgrade nudge banner on the Wall for Basic users (`UpgradeNudge`, sessionStorage)
- ✅ Post-purchase: redirect to a `/upgrade/success` confirmation page (with Task 7)

**👤 You handle:**
- ✅ Review the copy Claude writes — adjust any phrasing to match your voice
- ✅ Approve the design before Claude calls it done
- ✅ Decide trial length: 7 days, 14 days, or 30 days
- ✅ Decide whether trial requires a credit card upfront (Stripe supports both options)

---

### 9 — Discount Codes & Promotional Pricing `NEXT`

**Why now:** Set these up in Stripe before launch so they're ready to share.

**👤 You handle (all in Stripe Dashboard → Promotions → Coupons):**
- [ ] **Disney Cast Member discount** — create a coupon (e.g., 20–30% off monthly, forever or for 6 months) + a Promotion Code (e.g., `CASTMEMBER`) to share via internal Cast Member channels
- [ ] **Friends & Family discount** — create a coupon + Promotion Code (e.g., `FRIENDS`) for personal sharing
- [ ] **Holiday / event promos** — create time-limited coupons with expiration dates (e.g., `SUMMER25`, `HOLIDAY25`) — set amount off or % off and an expiration date on the coupon
- [ ] Decide whether promo codes are one-time-use per customer or unlimited

**🤖 Claude handles:**
- [ ] Add a **Promo Code input field** to the Stripe Checkout Session (one line of config — Stripe renders the UI automatically in hosted Checkout)
- [ ] If using Stripe Elements instead: build a custom promo code field that calls the Stripe API to validate and apply the discount before confirming

---

### 10 — Feature Gating (Pro vs Basic) ✅ CODE COMPLETE — *needs your testing*

**Why now:** The membership column exists and Stripe is wired up — now enforce the tiers in the app.

**🤖 Claude handles:**
- ✅ `2026-07-09`: `getMembership()` + `isProTier()` server helpers in `lib/auth/session.ts` (wrap the `get_own_membership` RPC; fail toward Basic so a lookup error never leaks a paid perk)
- ✅ `2026-07-09`: **Shift match notifications** — match alert *emails* in `sendMatchNotifications()` are now per-recipient gated to Pro/Trial (membership fetched via service role in both `notifyShiftPosted` and `notifyRequestPosted`); web push stays free-tier per the Feature Tier Reference
- ✅ `2026-07-09`: **Wall auto-refresh (Realtime)** — Basic users' realtime events raise a "New activity — refresh to see it" banner (with a "Pro members see new posts instantly" upsell link) instead of applying live; Pro/Trial get the live Wall via the `liveWall` prop
- ✅ **Ad suppression** — already live via `getShowAds()` + `AdRail` (Task 12)
- ✅ **Trial expiration** — handled by the existing daily expirations cron (demotes Trial→Basic and clears `trial_ends_at`); the profile badge shows days remaining, so no separate page-load gate/modal needed
- ✅ **Trial eligibility check** (`trial_used`) — lands with the trial start flow in Task 7 (Stripe); `getMembership()` already surfaces `trialUsed`
- ✅ `2026-07-09`: Membership badge on Profile — Basic shows "Basic · Upgrade ⭐" linking to /upgrade; Pro shows "⭐ Pro"; Trial shows "⭐ Trial · N days left"

**👤 You handle:**
- ✅ Test each gated feature as a Basic user (create a second test account)
- [ ] Test trial expiration by temporarily setting `trial_ends_at` to a past timestamp in the DB

---

### 11 — SMS Notifications (Pro Tier) `NEXT`

**Previously deferred** — now a core Pro benefit. Up to 30 SMS/month per user.

**👤 You handle (do these first):**
- [ ] Create a **Twilio** account at **twilio.com**
- [ ] Buy a phone number (or use the trial number for testing)
- [ ] In Twilio Console → copy **Account SID** and **Auth Token**
- [ ] Add to Vercel environment variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

**🤖 Claude handles:**
- [ ] Add `phone_number` field to the user profile form and `users` table (optional, user-supplied)
- [ ] Add `notify_via_sms` preference (boolean, default `false`) and `sms_count_this_month` counter (integer, default `0`) to users table
- [ ] Add `sms_reset_date` column — reset `sms_count_this_month` to `0` on the 1st of each month via Supabase cron
- [ ] Install `twilio` npm package; create `lib/sms.ts` with a `sendSms()` helper that:
  - Checks `membership === 'Pro' || 'Trial'`
  - Checks `notify_via_sms === true`
  - Checks `sms_count_this_month < 30`
  - Sends via Twilio, then increments `sms_count_this_month`
- [ ] Wire `sendSms()` into `notifyShiftPosted()` and `notifyRequestPosted()` alongside the existing email
- [ ] Add SMS opt-in/out toggle and current month usage counter (`X / 30 SMS used`) to the Profile / Notifications settings page

**👤 You handle (after Claude ships the code):**
- [ ] Add your own phone number to your test account and confirm SMS arrives when a match fires
- [ ] Test that the 30/month cap is enforced (set `sms_count_this_month = 30` in DB and verify no SMS sends)

---

### 12 — Ad System (Placeholders + Google AdSense) `BLOCKED ON ADSENSE RE-REVIEW`

**Why last:** Ads are a Basic-tier experience. Get subscriptions shipping first; then monetize the free tier.

**⚠️ Status as of `2026-07-28`: AdSense REJECTED the site, and the fix is deployed but not yet resubmitted.** The code below is all correct and has been for weeks — the blocker was never the integration. See Task 25 for the current state and the remaining steps.

**Placement (as of 2026-07-01):** Wall, My Calendar, Profile, individual Board (Members) page, Approvals, Flags, Archive, Help & Support. Sticky right rail on desktop/tablet (≥ 1024px, reserves real layout space so it never overlaps page content), sticky bar just above the mobile bottom nav on phones. No ads on the landing/marketing pages or any auth/OAuth page.

**🤖 Claude handles:**
- ✅ `2026-07-01`: `<AdSlot>` component (`components/features/AdSlot.tsx`) — styled placeholder ("Advertisement", dashed border) when no `data-ad-slot` ID is wired for a placement yet; swaps to a real AdSense `<ins>` unit once one is added
- ✅ `2026-07-01`: `<AdRail>` wrapper (`components/features/AdRail.tsx`) — path-gated, renders the sticky desktop rail + mobile bottom bar only on the 8 pages listed above
- ✅ `2026-07-01`: Ads suppressed for Pro/Trial — `getShowAds()` in `lib/auth/session.ts` reads membership via the existing `get_own_membership()` RPC (defaults to **no ads** if the lookup ever fails, so an error can't accidentally show ads to a paying member)
- ✅ `2026-07-01`: AdSense account script wired into the root layout via `next/script`, gated on `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` being set
- ✅ `2026-07-01`: Cookie consent banner (built earlier, disabled) now tied to the same `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` env var instead of a separate flag — activates automatically now that the AdSense script is live
- ✅ `2026-07-01`: `public/ads.txt`, `google-adsense-account` meta tag, `app/robots.ts`, `app/sitemap.ts` added — none of these existed before (site had zero SEO/crawl config)
- ✅ `2026-07-01`: Google-certified CMP (Funding Choices) wired in — 3-choice consent message (Consent / Do Not Consent / Manage) for EEA/UK/Switzerland. `middleware.ts` reads Vercel's `x-vercel-ip-country` edge header (no geo-IP service needed) and sets a `myshiftx-region` cookie; the custom `CookieConsentBanner` reads it and suppresses itself for EEA/UK/CH visitors so they don't get two consent prompts — Google's CMP handles that region instead
- ✅ `2026-07-01`: First real ad unit live — "Sticky Desktop" (slot `2239887190`) wired into the desktop rail via `NEXT_PUBLIC_ADSENSE_SLOT_STICKY_DESKTOP`. Along the way, corrected `<AdSlot>` to mirror whatever format AdSense actually generated per-unit instead of forcing one template on every slot. Originally created as fixed 300×600; switched to auto/responsive (`display:block`, min-height 250px reserved in the sticky rail) to match the updated unit
- ✅ `2026-07-01`: Second real ad unit live — "Sticky Mobile" (auto/responsive format, slot `5339481808`) wired into the mobile bottom bar via `NEXT_PUBLIC_ADSENSE_SLOT_STICKY_MOBILE`. Both placements from the original plan (desktop rail + mobile bar) now have real ad units — no more placeholders on either.
- ✅ `2026-07-08`: Now that the U.S. states message is published in AdSense too, `middleware.ts` buckets `US` visitors into their own `myshiftx-region=us` cookie value (previously lumped into `other`), and `CookieConsentBanner` suppresses itself for that region same as it already did for `eea` — Google's CMP now handles consent for both EEA/UK/CH and U.S. visitors, our own banner only shows to the remaining "other" regions.

**👤 You handle:**
- ✅ Publisher ID confirmed: `ca-pub-4865817496577079` (added to `.env.local`and to Vercel env for production)
- ✅ Sign up for **Google AdSense** at **adsense.google.com** if not already approved (requires a live site with content)
- ✅ **Create the actual consent message(s)** in AdSense → Privacy & messaging — the EEA/UK/CH GDPR message and the U.S. states message are both published now
- ✅ Ad units created in AdSense and wired in — "Sticky Desktop" (`2239887190`) and "Sticky Mobile" (`5339481808`) are the only two placements needed; `AdRail` reuses them across all `AD_ENABLED_PATHS` rather than needing one unit per page
- ✅ Review the placeholder layout — confirm sizing/placement (300×600 desktop rail, mobile bar above the bottom nav) feels right before real ad units go live
- ✅ Google flagged crawl trouble — **Vercel Authentication** was on for Production, blocking Googlebot entirely; scoped it to Preview deployments only so myshiftx.com is publicly crawlable again (Wall/Calendar/Profile/etc. still require login, so Google can only ever crawl the public marketing/legal pages — expected)
- ✅ `2026-07-08`: Went through AdSense's site-readiness checklist — found two gaps (no standalone About/Contact pages; footer only linked Terms/Privacy/Log In). Claude built `/about` and `/contact`, extracted the previously-duplicated landing footer into `components/landing/Footer.tsx`, and added About/Contact/Data Deletion links to it (Data Deletion existed but was never linked from anywhere public-facing). Both new pages are in the sitemap and ad-enabled, matching Terms/Privacy
- [ ] Confirm ads are now working — **blocked**: no ad can fill until the site is approved. See Task 25

---

### 13 — Business Entity & Legal Protection `PARALLEL`

**Structure:** The LLC is **Digital Elegance LLC** (parent company). MyShiftX operates as a registered **DBA (fictitious name)**. All revenue, contracts, and bank accounts go under Digital Elegance LLC d/b/a MyShiftX. This is Florida-based — steps and links reflect Florida law.

Complete in order — each step unlocks the next.

---

#### 👤 Formation (do these first, in order) — one-time cost ~$175

- ✅ **1. Get your EIN** — free, instant at **irs.gov** → Apply for EIN Online. Do this before anything else; you need it for the bank account. Takes 5 minutes.
- ✅ **2. File LLC Articles of Organization** — **sunbiz.org** → File Online → LLC Articles. Fee: **$100** + $25 registered agent. Processing: 2–3 business days online. Keep the stamped copy.
  - Registered agent: you can serve as your own agent using your Florida business address — free. No need to pay a registered agent service.
- ✅ **3. File MyShiftX fictitious name (DBA)** — **sunbiz.org** → File Online → Fictitious Name. Fee: **$50**. Renew every 5 years. File simultaneously with or right after the Articles.
- ✅ **4. Open a dedicated business bank account** — **Mercury** (mercury.com) or **Relay** recommended — both are free, online-first, and built for small businesses. Do NOT use a personal account. Mixing funds can pierce the LLC's liability protection.
- ✅ **5. Draft an Operating Agreement** — not required in FL but strongly recommended. AI-drafted is sufficient at launch. Have an attorney review once revenue is consistent. Defines ownership, decision-making, and what happens if you bring in a partner.

---

#### 👤 IP & Legal — one-time cost ~$421

- [ ] **6. Post Privacy Policy, Terms of Service & DMCA notice** — required before launch. Claude drafts these (see below). Flag for attorney review once shift-trading employment nuances matter (FL + Disney are non-trivial). Cost: $0 if AI-drafted.
- [ ] **7. Register DMCA designated agent** — **dmca.copyright.gov** → Register. Fee: **$6 / 3 years**. Post the DMCA policy page on the site at the same time. Copyright Office emails a renewal reminder before expiration.
- [ ] **8. Register Twilio 10DLC brand + campaign** — required by carriers to send A2P SMS (the Pro-tier match notifications). In Twilio Console: **Messaging → Regulatory → 10DLC**. Cost: **~$16 one-time** (~$4.50 brand registration + ~$11.50 campaign vetting). Do this before launching SMS features.
- [ ] **9. File USPTO trademark — MyShiftX (Class 42)** — **USPTO Trademark Center** → TEAS Plus. **Class 42** = Software as a Service. Fee: **$350**. Use the ID Manual dropdown to select the exact description — this avoids the $200 surcharge for non-standard descriptions. Processing: 8–14 months, but protection dates back to your filing date. Can file after launch.
- [ ] **10. Register copyright — MyShiftX code & UI** — **copyright.gov** → Register → Online Registration. Fee: **~$65**. File as a "collection" — covers all original code, email templates, and UI copy in one filing. Can file after launch.

---

#### 🤖 Claude handles — Legal Documents

- ✅ **Terms of Service** (`/terms`) and **Privacy Policy** (`/privacy`, covers cookies in Section 7) exist and are substantive. **Still missing:** standalone **Refund & Cancellation Policy** and **Cookie Policy** pages. *(Flag all for attorney review before charging real money.)*
- ✅ `2026-07-01`: Cookie consent banner built (`components/features/CookieConsentBanner.tsx`, bottom bar with Accept/Decline, stores the choice in localStorage) — but intentionally **disabled** (`COOKIE_BANNER_ENABLED = false`) until Google AdSense actually ships. Right now the only cookies MyShiftX sets are Supabase Auth session cookies, which are "strictly necessary" and exempt from GDPR/ePrivacy/CCPA consent requirements, so showing a banner today would be friction with no legal purpose. Flip the flag to `true` as part of Task 12 (Ad System).

---

#### 👤 Ongoing Compliance — annual

- [ ] **Florida LLC annual report** — due **May 1** every year at **sunbiz.org**. Fee: **$138.75**. Late filing penalty: **+$400**. Set a calendar reminder for April 15 so you don't miss it.
- [ ] **Quarterly estimated federal taxes** — due **Apr 15, Jun 15, Sep 15, Jan 15** (IRS Form 1040-ES). Florida has no state income tax, so federal only. Set aside ~25–30% of net revenue each quarter.
- [ ] **DMCA agent renewal** — every 3 years at dmca.copyright.gov (~$6). Copyright Office will email a reminder.
- [ ] **USPTO trademark maintenance** — Section 8 declaration due between **years 5–6** of registration. USPTO will NOT remind you — calendar it now.
- [ ] **S-Corp election** — once net profit consistently exceeds ~$40k/year, an S-Corp election reduces self-employment tax. Talk to a CPA at that point.
- [ ] **Business insurance** — General Liability + Tech E&O (Errors & Omissions) once revenue starts. Hiscox, Next Insurance, and CoverWallet offer online quotes.

---

#### 💰 Monthly Infrastructure Costs (Reference)

| Service | Cost | Notes |
|---------|------|-------|
| RackNerd VPS (digitalelegance.com) | $10/mo | Existing VPS, 1 TB transfer |
| Vercel Pro | $20/mo | 1 seat, includes 1M edge requests |
| Supabase Pro | $35/mo | $25 base + usage; budget $35–$60/mo at launch |
| Claude Pro (dev) | $20/mo | Includes Claude Code |
| Domains (myshiftx + digitalelegance) | $2/mo | ~$11/yr each, amortized |
| Stripe | Per transaction | 2.9% + $0.30 flat fee; no monthly fee |
| Twilio SMS (paid users only) | ~$0.37/paid user/mo | At 30 SMS/user; base + carrier cost |
| **Floor total (excl. Twilio + Stripe)** | **$88/mo** | Scales with paid users beyond this |

**Year 1 estimated total:** ~$175 formation + $421 IP/legal + ($88 × 12 infra) = **~$2,652 all-in before Stripe/Twilio variable costs.**

---

### 14 — Dedicated Mobile App (React Native / Expo) `YEAR 2+`

**When to start:** Not during beta. The right trigger is **three conditions met simultaneously:**
1. The web app is feature-stable (most tasks above are complete)
2. You have consistent paid users — roughly **50+ active Pro subscribers** justifies the investment
3. You are ready to expand beyond the first park/employer (Year 2 in the financial model: WDW + Universal)

Building the app before these conditions wastes development time on a moving target. The web app handles 100% of use cases until then.

---

**Why a dedicated app matters at scale:**

- **Native push notifications (FCM/APNs)** — free via Firebase, works on Android and iOS without requiring SMS. At scale this replaces or dramatically reduces the Twilio SMS cost (~$0.012/message) while delivering a better user experience
- **Home screen presence** — app icon on a Cast Member's phone vs. a browser bookmark is a significant engagement difference
- **Faster interactions** — native navigation, haptic feedback, and background sync feel noticeably better than a mobile browser
- **App Store discoverability** — users searching for shift swap tools can find MyShiftX organically

---

**Technology recommendation: Expo (React Native)**

Because the existing codebase is React/TypeScript, Expo is the natural path — business logic, TypeScript types, Zod schemas, and Supabase client calls can all be shared with the web app. The app mirrors the web rather than duplicating it.

**What the app includes (mirrors the web):**
- The Wall (shift offers and requests, with real-time updates)
- Post/edit shift and request forms
- Board management and member list
- Profile and notification settings
- Calendar view
- Native push notifications for shift matches (replacing SMS for in-app users)

**What stays web-only:**
- Admin tools and moderation pages (not worth building for the small admin audience)
- Legal pages (Terms, Privacy, Data Deletion) — link to myshiftx.com
- The upgrade/subscription sales page — Apple takes 30% on in-app purchases; link to web checkout instead

---

**👤 You handle — Before Development:**
- [ ] **Apple Developer Program** — enroll at developer.apple.com. Fee: **$99/year**. Required to publish to the App Store and test on real iOS devices. Takes 24–48 hrs to approve.
- [ ] **Google Play Developer account** — enroll at play.google.com/console. Fee: **$25 one-time**. Required to publish to the Play Store. Takes 1–3 days to verify.
- [ ] **Firebase project** — create a Firebase project (free) for FCM push notifications. One project covers both iOS and Android.
- [ ] **App Store listing assets** — icon (1024×1024), screenshots at required sizes for iPhone and iPad, short and long description, keywords, privacy policy URL, support URL
- [ ] **Decide subscription model for App Store** — Apple takes 30% (15% after year 1) on in-app purchases. Recommended: gate subscription purchase behind a web link to avoid Apple's cut. Users subscribe at myshiftx.com, app detects Pro status via Supabase.
- [ ] **Trademark** — confirm USPTO trademark for MyShiftX is filed before App Store submission (prevents another party from filing a takedown on your listing)

**🤖 Claude handles:**
- [ ] Scaffold Expo project with shared TypeScript types from the web codebase
- [ ] Set up Supabase auth in the app (same session system, supports OAuth and email/password)
- [ ] Build the Wall screen with real-time Supabase subscription (same logic as WallClient)
- [ ] Build post/edit forms (reuse validation schemas from `lib/validations/`)
- [ ] Implement FCM/APNs push notification registration and handlers
- [ ] Build profile and settings screens
- [ ] App Store and Play Store submission configuration (app.json, EAS Build)

**👤 You handle — Submission:**
- [ ] **Apple App Review** — 1–7 day review process. Common rejection reasons: missing privacy policy, incomplete app, metadata mismatch. Submit early.
- [ ] **Google Play Review** — typically 1–3 days for new apps. Less strict than Apple but requires a privacy policy URL in the listing.
- [ ] **App Store Connect setup** — pricing, age rating (likely 12+ or 17+), primary category (Business or Productivity), territories

**💰 Additional costs once live:**
| Item | Cost | Notes |
|------|------|-------|
| Apple Developer Program | $99/yr | Required to stay on the App Store |
| Google Play Developer | $25 one-time | Already paid at enrollment |
| Firebase (FCM) | Free | Up to 10,000 subscribers free; scales cheaply beyond that |
| Expo EAS Build | ~$0–$99/mo | Free tier handles early stage; paid tier for faster builds |

---

### 15 — Photo Schedule Import (Gemini 2.5 Flash) `CODE COMPLETE — needs Vercel env var`

**Fix 2026-07-18 (found in Ace's onboarding test):** wide weekly-grid screenshots returned "No shifts were found" while tall list layouts worked. Root cause: the client downscale capped the *longest* side at 1600px, so a 2000×661 grid shrank to 1600×529 — crushing the text height (which lives in the short side) below what Gemini could read. `toJpeg` now scales by pixel *area* (small screenshots upload untouched; big photos shrink but never below ~720px on the short side), and the extraction prompt explicitly describes weekly-grid layouts (dates as column headers, multiple stacked week-tables, "No Shifts" cells). Re-test both orientations.

**Feedback loop 2026-07-18:** when the reader disappoints, the user can now send the exact processed photo to support@myshiftx.com with one tap — new `/api/schedule-import/report` route (auth-required, Resend email with the image attached, what the reader returned as JSON, and reply-to set to the user). Links appear in the "no shifts found" error banner and the review-step footer; explicit user action only, never automatic. 👤 Test: trigger a bad import, tap "Send this photo to our team", confirm the email lands in support@ with the attachment.

**Tier:** Free = 4 imports/month · Pro = unlimited
**Why it matters:** The single biggest UX unlock for Cast Members. Instead of manually entering each shift, they photograph their paper or screen schedule and MyShiftX reads it onto their calendar in seconds.

**Architecture overview:**
```
Browser → /api/schedule-import (Next.js) → Gemini 2.5 Flash (Google API) → parsed JSON → review UI → Supabase
```

Gemini reads the photo with a hand-tuned parsing prompt that isolates the target employee's row (the modal sends the user's display name), resolves year-less dates by day-of-week alignment, and returns explicit overnight `end_date`s. The route tries the free-tier `generativelanguage` endpoint first and falls back to the billing-gated Vertex `aiplatform` endpoint on 401/403 (Google issues look-alike `AQ.` keys for both surfaces). Photos are processed per-request and never stored. Whole feature is gated on `GEMINI_API_KEY` — invisible until the env var lands in Vercel, then flips on automatically (marketing on the landing page and the Help docs section are gated the same way).

**Final benchmark (2026-07-08):** 2/2 exact on a real scheduling-app screenshot (dates, times, titles) and 8/8 exact on a dense synthetic 2-week schedule incl. an overnight shift, 5–10s per image, ~1k tokens (~0.1¢ paid / $0 free tier).

---

**👤 You handle:**
- ✅ `2026-07-08`: Created Google AI Studio project + free-tier API key (in `.env.local` as `GEMINI_API_KEY`); wrote the parsing prompt the route now uses
- [ ] Add `GEMINI_API_KEY` to Vercel env vars to turn the feature (and its landing/Help marketing) on in production — free-tier key works; the paid Vertex key (project 126596084990) needs API + billing enabled in its Cloud project if/when volume justifies it
- ✅ `2026-07-08`: Remove the retired `VPS_OLLAMA_URL` / `VPS_OLLAMA_SECRET` / `OLLAMA_VISION_MODEL` vars from Vercel
- ✅ `2026-07-08`: Delete the `ai.myshiftx.com` DNS A record; refund/repurpose the Contabo VPS (wiped clean 2026-07-08)

**🤖 Claude handles:**
- ✅ `schedule_import_count` + `schedule_import_month` columns on `users`, with `get_schedule_import_status()` / `consume_schedule_import()` `SECURITY DEFINER` RPCs that reset the counter lazily when the ET month rolls over — no cron changes needed (`supabase/migrations/20260701235216_schedule_import_quota.sql`)
- ✅ `/api/schedule-import/route.ts` — verifies auth, checks quota up front (consumed only after a successful parse so a backend hiccup doesn't burn an import), accepts multipart image upload (8 MB max, JPEG/PNG/WebP) + the user's display name, calls Gemini, extracts/validates the JSON (zod, AM/PM salvage), returns shifts + remaining count
- ✅ `ScheduleImportModal` — camera/file picker (client-side downscale + JPEG re-encode keeps HEIC/multi-MB photos out of the pipeline), photo shown above the editable review table, live any-overlap conflict detection against the selected board with keep/replace/edit resolution (replace uses the `deactivate_own_shift` RPC), overnight-shift handling, manual add-a-row, remaining-imports counter
- ✅ Import button wired into the Calendar page; landing-page selling-point section + Help page section/FAQ, all gated on `GEMINI_API_KEY`
- ✅ `2026-07-08`: **VPS backend evaluated and retired.** Full story in `schedule-from-image.md`: built Ollama + qwen2.5vl:3b on a Contabo VPS (nginx/TLS/secret-gated at ai.myshiftx.com), found and fixed a prompt bug (today-date anchoring caused models to extract only today's row) and an nginx 180s timeout that was killing production imports; benchmarked 3B/7B/granite — best case was still minutes-per-photo with unreliable extraction on app-screenshot layouts. Gemini 2.5 Flash scored perfectly in seconds, so the route moved to Gemini exclusively and the VPS was wiped (Ollama, nginx vhost, TLS cert removed; sshd hardened to key-only while it lived)

---

### 16 — In-App Push Notifications (Web Push) ✅ DONE

*(Header was stale: the VAPID env vars were added to Vercel on `2026-07-01` — see the ✅ items under "You handle" below. Extended on iOS by Task 23's install walkthrough.)*

**Tier:** Free (Basic and Pro both get push)
**Why it matters:** Silent real-time alerts without SMS cost. Works on desktop and Android Chrome; limited on iOS Safari (supported since iOS 16.4 via PWA install).

**Architecture:** Browser Push API + VAPID keys. Next.js stores push subscriptions in Supabase. When a match or interest fires, the notification action also sends a web push to subscribed devices. Entire feature is gated on `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — all push UI stays hidden until the env vars land in Vercel, then flips on automatically.

**🤖 Claude handled:**
- ✅ `2026-07-01`: Generated VAPID key pair — in `.env.local`; **needs adding to Vercel** as `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY`
- ✅ `2026-07-01`: `push_subscriptions` table created + applied live (RLS: users manage only their own rows; sending reads via service role). Migration: `20260702000000_push_subscriptions.sql`
- ✅ `2026-07-01`: `/api/push/subscribe` (upsert on `user_id,endpoint`) and `/api/push/unsubscribe` routes with zod validation
- ✅ `2026-07-01`: `public/sw.js` — shows notifications on `push` (graceful on non-JSON payloads), focuses/opens the target URL on click. Registered lazily from `lib/push.ts` only when a user enables push
- ✅ `2026-07-01`: `sendPushNotification()` in `notifications.ts` — fires alongside email for interest, both match directions, and board approval; prunes dead subscriptions (410/404). Deliberately *not* exported (exports from a `'use server'` file are client-callable — would let anyone push to anyone). Push is independent of the `notify_via_email` pref; that pref now only gates email
- ✅ `2026-07-01`: "Push Notifications" toggle in Profile → Notifications (per-device, instant, hidden on unsupported browsers) + one-time dismissible prompt banner on the Wall
- ✅ `2026-07-01`: `app/manifest.ts` web app manifest (`display: standalone`) — required for iOS 16.4+ push via Add to Home Screen
- ✅ `2026-07-01`: Verified end-to-end locally in Edge: subscribed against a real WNS push endpoint with the site VAPID key, sent via web-push, service worker displayed the notification (title/body/url/icon all correct); unauthenticated API calls → 401; wrong VAPID keys rejected by the push service

**👤 You handle:**
- ✅ `2026-07-01`: Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` (values in `.env.local`) to Vercel env vars — the feature is invisible in production until then
- ✅ `2026-07-01`: Test on desktop Chrome, Android Chrome, and iOS Safari (requires "Add to Home Screen" first on iOS): enable via the Wall banner or Profile toggle, then have a second account mark interest on your post
- ✅ `2026-07-01`: Square 512×512 app icon supplied — moved to `app/apple-icon.png` (Next.js serves it and emits the `apple-touch-icon` link automatically); manifest and push notification icons now use it
- ✅ `2026-07-01`: Live two-device test found pushes *delivered* but not *popping up* (OS presentation settings, not code). Response: `requireInteraction: true` so desktop toasts stay until dismissed, `urgency: 'high'` on sends so dozing devices get them promptly, and a per-platform "Push Notifications" how-to (Windows / Mac / Android / iPhone) added to Help & Support

---

### 17 — Calendar Export & Sync (iCal / Google Calendar) ✅ CODE COMPLETE

**Tier:** Pro only
**Why:** Users want their shift calendar to live in their native calendar app, not just in MyShiftX. A live-sync iCal feed means it updates automatically when shifts change.

**Architecture:** Generate a secret per-user iCal feed URL. Calendar apps (Google Calendar, Apple Calendar, Outlook) subscribe to it and refresh periodically. No OAuth required — the URL is the authentication.

**🤖 Claude handled:**
- ✅ `2026-07-01`: `ical_token` column on `users` (UUID, unique, nullable, generated on first use). Because it's the feed's only credential, it's excluded from the client-readable SELECT column grant (same idiom as the membership fields) — access goes through two `SECURITY DEFINER` RPCs scoped to `auth.uid()`: `get_or_create_ical_token()` and `reset_ical_token()`, both returning NULL for Basic. Migration `20260702010000_ical_feed_token.sql`, applied live
- ✅ `2026-07-01`: `/api/calendar/[token].ics` route (token also accepted without `.ics`) — hand-rolled RFC 5545 generation in `lib/ical.ts` (UTC times, escaping, 75-octet line folding, 1-hour refresh hints). Serves active shifts from 30 days back through all upcoming — the same `user_id + is_active` definition My Calendar uses. Bad token, unknown token, deactivated account, and non-Pro membership all return a uniform 404
- ✅ `2026-07-01`: Token rotation via the `reset_ical_token()` RPC + server action (`app/actions/calendar.ts`) rather than a dedicated route — same behavior, matches the codebase's server-action convention
- ✅ `2026-07-01`: Calendar Sync card on Profile (Pro/Trial only): copyable feed URL with a treat-it-like-a-password note, link to the setup guides, one-click Download .ics (`?download=1` → attachment), and Reset feed URL behind a subscriptions-will-break confirmation
- ✅ `2026-07-01`: Step-by-step subscribe guides for Google Calendar, Apple Calendar (iPhone/Mac), and Outlook written into Help & Support (`/help#calendar-sync`); the Profile card links there
- ✅ `2026-07-01`: Verified live: real feed URL returns valid ICS with correct UTC event times, escaping, and folding (tested with a temporary shift, since deleted); all invalid-token paths 404; `ical_token` confirmed absent from client SELECT grants; roadmap card moved to Done

**👤 You handle:**
- ✅ Your feed token is already generated — open Profile → Calendar Sync for the URL. Test the subscription flow in Google Calendar (Other calendars → From URL) and Apple Calendar
- ✅ Heads-up for testing: Google refreshes subscribed feeds on its own schedule (often 6–24 h), so don't judge sync speed by it — Apple Calendar lets you pick the refresh interval

---

### 18 — Trade Preferences (Smart Matching) `WITH PRO LAUNCH` — **not started; scope corrected 2026-07-28**

**Tier:** Pro only
**Why:** Extends the shift matching system so Pro users only get notified for shifts that actually fit their preferences — reducing notification fatigue.

**Accuracy check `2026-07-28` — nothing here is built.** `trade_preferences` appears nowhere outside this file: no column, no migration, no UI, no reference in `notifications.ts`. Four things in the original plan were wrong or out of date, and one design decision has to be made before any code gets written.

**1. Half of this already exists — at the post level, not the user level.** `requests.preferred_times` (`'morning' | 'afternoon' | 'evening' | 'late'`, see `lib/database.types.ts:8`) is already stored per request and already filters matching in **both** directions via `shiftMatchesPreferences()` in `app/actions/notifications.ts:156`. So a user-level `preferred_times` adds nothing for a **requester** — they set it every time they post — and would quietly contradict the per-request value when the two disagree. The real gap is the **shift poster**, who has no preference input at all today. Either scope this to shift posters only, or define the precedence rule (recommendation: the per-post value always wins; the user-level value is the default the form is seeded with).

**2. There is no shift `type` field.** Shifts carry two independent booleans, `is_trade` and `is_giveaway`, and both can be true at once. `"preferred_types": ["trade", "giveaway"]` should be phrased against those booleans, and the UI's "Trade / Giveaway / Either" needs a fourth state for "both flags set."

**3. The new `users` column needs an explicit `GRANT SELECT`.** Task 6's lockdown replaced the table-wide grant with an explicit column list, so any new column is unreadable by clients by default — that is exactly what broke Profile and the Wall in Task 22 (`20260718140000_grant_select_onboarding_columns.sql`). Profile reads this column, so the migration must grant it.

**4. Both notify functions were rewritten by S1 and now take only an ID.** They read everything server-side through `createAdminClient()`. Preferences get added to the existing `users` selects (`email, notify_via_email, membership`) in both functions — no signature change, no caller change.

**⚠️ Decide first: which channel does the filter apply to?** Match **emails** are already Pro/Trial-only (Task 10); web **push** is free for everyone. If trade preferences are a Pro perk that only suppresses email, a Pro user still gets the push for every match and the feature barely registers. Recommendation: **apply the filter to both channels for users who have set preferences**, and keep the preference *UI* Pro-only. That makes it a real quieting feature rather than a technicality.

**Note:** this reduces *match* notifications only. Since `7eb8527`/`bc7a3d4`, most Wall noise is claim traffic ("someone wants your shift"), which is a different notification path and is deliberately not filtered — you always want to hear that.

**🤖 Claude handles:**
- [ ] Add `trade_preferences` JSONB column to `users` (nullable) **plus `GRANT SELECT` on it** (see #3 above). Null and `{}` both mean "no filtering" — never fail closed, or a lookup hiccup silently stops someone's alerts:
  ```json
  {
    "preferred_types": ["trade", "giveaway"],
    "preferred_times": ["morning", "afternoon"],
    "preferred_days": [1, 2, 3, 4, 5]
  }
  ```
- [ ] Add Trade Preferences section to Profile → Notifications for Pro users:
  - Preferred shift types (Trade / Giveaway / Both flags / Any) — mapped to `is_trade` / `is_giveaway`, not a `type` enum
  - Preferred time of day (Morning / Afternoon / Evening / Late Night / Any) — reuse the exact `PreferredTime` union and the 6/12/18/24 ET hour boundaries from `shiftMatchesPreferences()` rather than defining a second set
  - Preferred days of week (multi-select Mon–Sun) — evaluated on the **ET** date, same as `getETDate()`, not the server's local day
- [ ] Update `notifyShiftPosted()` and `notifyRequestPosted()` — before sending match notifications, check if the recipient has trade preferences set and whether the shift/request satisfies them. If preferences are set and the match doesn't fit, skip the notification.
- [ ] **Keep logging suppressed matches to `match_events`.** That table (added `b3fa3d4`) is what feeds the admin "matches made" stat. A match that happened but wasn't announced is still a match; dropping the row would make the Stats page under-report as soon as anyone sets a preference. Skip the send, not the insert.
- [ ] Seed the Post Request form's `preferred_times` from the user-level value so the two never silently disagree (see #1)

---

### 19 — In-App Messaging (Within Boards — All Tiers) ✅ CODE COMPLETE

**Tier:** Free and Pro — available to all users, within shared boards only. Direct messaging outside of boards is not permitted.
**Why:** Replaces the current email mailto: contact button with a real in-app conversation thread. Keeps communication on the platform and creates network stickiness.

**🤖 Claude handled:**
- ✅ `2026-07-02`: `conversations`, `conversation_participants`, `messages` tables created + applied live. Migration `20260702120000_in_app_messaging.sql`. RLS: participants can only read conversations/messages they belong to; only the sender can insert their own messages (`sender_id = auth.uid()` enforced); `last_read_at` is the *only* updatable participant column (column-level grant, so a row can't be moved to another conversation/user)
- ✅ `2026-07-02`: Conversations are created only through the `get_or_create_conversation()` RPC (`SECURITY DEFINER`) — verifies the other user is active, not yourself, and that both users share ≥1 approved board ("You can only message members of your boards."); idempotent (same pair always returns the same thread, advisory-locked against double-click races). No INSERT policies exist for `authenticated`, so the RPC is the only door in
- ✅ `2026-07-02`: `messages` added to the `supabase_realtime` publication — postgres_changes respects RLS, so subscribers only receive messages from their own conversations
- ✅ `2026-07-02`: `/messages` page — conversation list (via `get_conversations()` RPC: other participant, last-message preview, unread count) with unread badges, newest activity first, live-refreshes on incoming messages
- ✅ `2026-07-02`: `/messages/[conversationId]` page — chat-bubble thread with Realtime append, send box (max 1000 chars, Enter to send), marks read on open and on incoming messages, `router.refresh()` so the navbar badge clears immediately
- ✅ `2026-07-02`: Unread badge in Navbar via `get_unread_message_count()` RPC — Messages tab added to the desktop sub-nav and the mobile bottom nav (Wall · Calendar · Messages), both with count badges
- ✅ `2026-07-02`: Disabled "Contact — coming soon" replaced with a working **Message** action on both ShiftCard and RequestCard (⋮ menu + pill row) — opens or creates the thread with the post owner; disabled for posts whose owner account is gone
- ✅ `2026-07-02`: Web push on new message ("New message from X" + preview, links to the thread) — `sendPushNotification()` moved from `notifications.ts` into shared `lib/push-server.ts` (still not client-callable) so both notification actions and messaging use it
- ✅ `2026-07-02`: Verified with role-impersonated SQL against the live DB (10/10 pass): shared-board rule enforced, outsider sees 0 rows, sender spoofing blocked by RLS, unread counts correct before/after mark-read, participant-row move blocked by column grant, conversation creation idempotent. `npm run build` + type-check clean; test data cleaned up

**🤖 Follow-up round (same day, from live testing feedback):**
- ✅ `2026-07-02`: **Read receipts** — own messages show an eye (read) / crossed-out eye (not read yet) in front of the timestamp, based on the other participant's `last_read_at`; updates live while the thread is open (`conversation_participants` added to the Realtime publication). Migration `20260702130000_message_reactions_read_receipts.sql`, applied live
- ✅ `2026-07-02`: **Reactions** — one per message, recipient-only (can't react to your own): 👍 😂 😮 😢 😠 + the site's yellow star. An empty yellow star sits right of the other person's bubble (vertically centered); clicking it opens a popup bar under the star with the six options; the choice replaces the star and can be tapped again to swap. Enforced in the DB: `reaction` column with CHECK constraint, UPDATE policy limited to non-senders, column-level grant so *only* `reaction` is updatable (body/sender/timestamps immutable). Optimistic UI with rollback; syncs to the other side via Realtime UPDATE events
- ✅ `2026-07-02`: **Message hygiene** — bodies are sanitized server-side (control characters stripped, 3+ blank lines collapsed, trimmed, 1000-char cap) and always rendered as plain text (React escaping — `<script>` etc. stays inert text; there is no HTML rendering path). Reaction values validated server-side against the allowed list on top of the DB constraint
- ✅ `2026-07-02`: **Ads on Messages** — `/messages` and `/messages/[id]` added to the AdRail page list (same sticky desktop rail + mobile bottom bar as Wall/Calendar; Pro/Trial still ad-free)
- ✅ `2026-07-02`: **Stale-thread bug fixed** — opening a chat from the list could show an outdated (even empty) thread because Next's client-side router cache re-serves a prior render for up to ~30s. Both the list and the thread now re-fetch fresh data from Supabase on mount, treating server-rendered props as a starting point only
- ✅ `2026-07-02`: **Start a chat** — button on `/messages` opens a directory modal of everyone sharing an approved board with you (`get_messageable_users()` RPC, active users only) with a name search filter; picking someone opens/creates the thread
- ✅ `2026-07-02`: Reaction rules verified with role-impersonated SQL against the live DB (7/7 pass): recipient can react + replace, sender gets 0 rows on own message, invalid value hits the CHECK constraint, body edit hits column permissions, outsider gets 0 rows, directory returns board-mates only. Sanitizer unit-tested (NUL/ESC/DEL/CR stripped, `\n`/`\t` kept); build + type-check clean
- ✅ `2026-07-02`: **Chat delete** — trash icon on each row in `/messages` (with confirmation). Per-user semantics like WhatsApp: sets `hidden_at` on *your* participant row only — the other person keeps the full conversation; your list entry disappears, your view of the history is cleared, and a newer message from either side brings the chat back showing only messages after that point. Nothing is ever removed from the `messages` table. Unread counts and previews respect `hidden_at`. Migration `20260702140000_conversation_delete.sql`, applied live; verified with impersonated SQL (hidden → unlisted + 0 unread; reappears with only the new message; other participant unaffected)
- ✅ `2026-07-02`: **Polish round from live testing:** (1) reaction picker is now portalled + viewport-clamped so it never gets cut off at the screen edge on short messages; (2) unread dot (same style as the approvals/flags dot) added to the desktop Messages tab icon alongside the count badges; (3) read receipts + unread badge now update *instantly* while both users have the chat open — marking read fires a Realtime **broadcast** to the other side (with the postgres_changes participant subscription kept as fallback) and `router.refresh()` keeps the navbar badge live; (4) Start-a-chat gained a board filter dropdown above the search (checkbox multi-select with an "All boards" master; hidden when the user has only one board); the directory RPC now returns `board_ids` and excludes `is_hidden` memberships on both sides, so auto-added admins only appear on boards they joined explicitly (verified: hidden admin absent from Halle's directory, present where explicitly joined) — migration `20260702150000_directory_boards_filter.sql`, applied live; (5) app-wide `MessageToast` (mounted in the dashboard layout): a new message while not viewing that thread shows a 5-second bottom toast with sender + preview that links to the chat, and refreshes the navbar badge live
- ✅ `2026-07-02`: **Live-receipt reliability + chat management round:** (1) Root-caused the "seen/badge still needs a refresh" report — Realtime's replication pipeline picks up newly published tables lazily, and the logs show `conversation_participants` was only registered ("Found new oids") after the earlier tests; belt-and-braces fix: an open thread now also polls every 4 s (tab-visible only, incremental — participants row + only messages newer than the last one held) so new messages and read receipts converge within seconds even if realtime drops events entirely; (2) chat header gained a ⋮ menu with **Flag User** (reuses `FlagModal` with `target_type='user'`, lands in the admin/mod flag queue; modal copy now adapts to the target type instead of always saying "Report Post") and **Delete Chat** (same per-user semantics as the list delete, returns to `/messages`); (3) **Terms** Section 5 gained a Direct Messaging conduct clause (professional use, no profanity/offensive language/harassment/spam; misuse → suspension/removal; MyShiftX may review messages when investigating flags) and Section 7 now covers messages as User Content; (4) **Privacy** Section 2 and Section 5 updated: messages/reactions/read-status listed as collected data, message visibility spelled out (participants only, not moderators; reviewable on abuse reports), per-user delete semantics disclosed, and the stale "Contact button email" bullet replaced; (5) **Help & Support**: stale Contact FAQ rewritten for in-app messaging, two new FAQs (who can message / how deletion works), and a dedicated Messages section (`/help#messages`) covering starting chats, read receipts, reactions, notifications, delete semantics, and a keep-it-professional note linking to the Terms and the Flag User path
- ✅ `2026-07-02`: **Testing incident (disclosed):** two of the SQL verification runs used `get_or_create_conversation` between the real Ace and Ace-User B accounts, which returned their *existing* live thread instead of creating a fresh one — the cleanup step then hard-deleted that conversation, including a few real messages from live testing. Unrecoverable. The Ace-Admin ↔ Halle N. conversation was untouched. Later verification runs build throwaway conversations directly and never call `get_or_create_conversation` on real user pairs

**👤 You handle:**
- ✅ `2026-07-02`: Two-account smoke test in the browser: from account A open the ⋮ menu on one of B's posts → **Message** → send; confirm B sees the navbar badge, the thread updates live in a second window, and a "New message from…" push arrives on a push-enabled device
- ✅ `2026-07-02`: In that same test: watch your sent message flip from crossed-out eye → eye when B opens the thread; as B, react to A's message (star → picker → emoji) and confirm A sees the reaction appear live
- ✅ `2026-07-02`: Try **Start a chat** — search for a board-mate by name and confirm the thread opens
- ✅ `2026-07-02`: Try **Delete chat** (trash icon on a row): confirm it disappears for you but not the other account, and that a new message from them brings it back without the old history
- ✅ `2026-07-02`: Confirm messaging someone after leaving your only shared board is blocked (expected: "You can only message members of your boards.")

---

### 20 — Bulk Shift Import (CSV + Multi-Week Photo) `YEAR 1 POST-LAUNCH`

**Tier:** Pro only — extends Task 15 (Photo Import)
**Why:** Power users with multi-week schedules don't want to import one photo at a time. CSV gives IT-minded users a clean path; multi-photo handles paper schedules.

**Rescoped `2026-07-28` against the shipped Task 15 code.** The original plan was written before the import pipeline existed and assumed a server-side batch endpoint and a `type` column. Neither survives contact with the code:

- **Imported shifts are calendar-only.** `ScheduleImportModal.handleSave()` inserts with `is_trade: false, is_giveaway: false, is_overtime_approved: false` — an import has never posted to the Wall, deliberately (the `enforce_wall_post_membership` trigger blocks those flags on boards you're only pending in). So the CSV template must **not** have a `type` column; it would promise Wall posting that the import path doesn't do. Wall posting stays a separate, deliberate action.
- **Multi-photo must loop on the client, not batch on the server.** `/api/schedule-import` is one image per request by design: `maxDuration = 90`, `MODEL_BUDGET_MS = 75_000` shared across the two Gemini endpoint attempts, an 8 MB cap, and a comment explaining the memory drop for a single 8 MB upload. Four photos in one request is 4× the memory and blows the time budget on a slow inference. Uploading them **sequentially from the modal** to the existing route needs no route change, gets per-photo progress for free, and lets one bad photo fail without losing the other three.
- **Quota is a non-issue for Pro but the reservation still runs.** `reserve_schedule_import` returns `import_limit = -1` for Pro/Trial, so N photos cost nothing — but each photo is still one round trip through reserve/release. Confirm a Pro loop of 4 doesn't trip the release path on a zero-shift photo.

**🤖 Claude handles:**

**CSV import:**
- [ ] CSV template for download: `date, start_time, end_time, title` — no `type` column (see above). Document the accepted formats: `date` as `YYYY-MM-DD`, times as 24-hour `HH:MM`, `title` optional and capped at **35 chars** (the same `parsedShiftSchema` limit the photo path enforces)
- [ ] Add `papaparse` (not currently a dependency) and build the upload UI — parse client-side, then hand the rows to the **same review table `ScheduleImportModal` already renders**, so CSV and photo share conflict detection, keep/replace/edit, overnight handling, and the manual add-a-row. Two entry points, one review step
- [ ] Overnight rows come from the same rule as the photo path — `end <= start` means the shift ends the next day. Don't invent an `end_date` column in the CSV
- [ ] Per-row validation with inline fix-or-skip: malformed date/time, `title` over 35 chars, and rows colliding with an existing shift (reuse `conflictsFor()` + the `deactivate_own_shift` RPC for replace)
- [ ] Gate on Pro/Trial with `isProTier()` from `lib/auth/session.ts`, and show Basic users the upgrade path rather than a dead button
- [ ] Decide the row cap before building. `handleSave()` does one `supabase.from('shifts').insert(rows)` — fine for a week, untested for a year of shifts. Suggest capping at ~200 rows per file and chunking the insert

**Multi-week photo import:**
- [ ] "This is a multi-week schedule" toggle in `ScheduleImportModal`, Pro/Trial only — switches the file picker to accept up to 4 images
- [ ] Upload them **sequentially to the existing `/api/schedule-import`** (one per request), showing per-photo progress; a failed or empty photo reports itself and the others still land
- [ ] Merge the returned shifts into one review table, deduplicating on `date + start_time` (overlapping week photos routinely repeat a day)
- [ ] Run the existing conflict check across the merged set — including **row-vs-row** collisions between two photos, which the single-photo path never had to handle

**Open questions before starting:**
- [ ] Do bundled shifts (`shift_bundles`) participate? Recommendation: no — bulk import creates plain calendar shifts, and bundling stays a deliberate act on the post form
- [ ] Is CSV worth it at all for this audience? Cast Members photograph a posted schedule; almost none will have a CSV. Consider shipping multi-week photo first and holding CSV until someone asks

---

### 21 — Trade Loop: Claims, Confirmation & Reliability ✅ DONE — *tested; superseded in part by Trade Loop v2*

**Note `2026-07-28`:** the claim mechanic described below was reworked after this task closed. Claiming no longer removes the post, the "Interested" star is retired on shifts, and bundles added all-or-nothing claiming — see **Trade Loop v2** in What's Done. The post-v1 follow-up list at the end of this task is still open and still accurate.

**Tier:** All tiers (this is core product, not a perk)
**Why:** The README names ghosting as a core problem, but nothing in the app addresses it — interest is just a comment flag, contact ends in email, and the app never learns whether a trade actually happened. Closing the loop unlocks: (1) a per-user reliability record (the real answer to ghosting), (2) the marketing proof number ("N shifts covered on MyShiftX"), and (3) the "your shift got covered 🎉" retention moment.

**Lifecycle:** claimant taps **"I'll take this shift"** → owner **Accepts** (post auto-archives as "Covered") or **Declines** → after the handshake, owner marks the claim **Completed** (trade went through in the company system) or **Fell through**. Claimant can withdraw a pending claim.

**🤖 Claude handled (all shipped 2026-07-18; migration applied to production):**
- ✅ Migration `20260717150000_trade_loop_shift_claims.sql` — `shift_claims` table (`id, shift_id, claimant_id, owner_id, board_id, status, created_at, responded_at, finalized_at`) + partial unique indexes (one open claim per user per shift; one accepted claim per shift) + RLS (parties-only SELECT; all writes via RPCs; anon revoked)
- ✅ RPCs (SECURITY DEFINER, pinned search_path, authenticated-only): `claim_shift` (validates board membership, active post, not-own-shift), `respond_to_claim` (accept auto-declines rivals + archives post as `covered`, returns rival ids for notification), `withdraw_claim`, `finalize_claim`
- ✅ `get_trade_stats_for_users(uuid[])` — aggregate picked-up/covered/fell-through counts only, no claim details leaked
- ✅ `removed_reason` CHECK extended with `'covered'`; leader Archive shows a green "Covered 🤝" badge + filter chip
- ✅ TypeScript types (`ClaimStatus`, `shift_claims`, RPC signatures) in `lib/database.types.ts`
- ✅ `app/actions/claims.ts` — claimShift / respondToClaim / withdrawClaim / finalizeClaim, notifications fire-and-forget
- ✅ Notifications: owner push+email on new claim (`claimReceivedHtml`); claimant push+email on accept/decline (`claimResultHtml`); rivals get "shift covered" push; claimant push on finalize. Emails respect `notify_via_email`
- ✅ `ClaimSection.tsx` on ShiftCard: "I'll take this shift" for non-owners (sent/declined states, withdraw); Accept/Decline panel for owners with each claimant's reliability record inline
- ✅ Reliability badge (🤝 N completed trades) next to poster name on ShiftCard, batch-fetched in WallClient
- ✅ `TradeRecordSection.tsx` on Profile (`#trade-record`): stats tiles, "needs your attention" (confirm completed/fell-through as owner, withdraw as claimant), history
- ✅ Wall banner for owners with accepted claims past shift end → links to Profile Trade Record
- Verified: `tsc --noEmit` clean, ESLint clean, `next build` passes, RPCs confirmed live in prod, security advisor shows no new issues (pre-existing anon-executable functions flagged as a separate cleanup task)
- [ ] Follow-up (post-v1): public `get_platform_trade_stats()` for the landing-page proof number; claims on request posts; mod visibility into board claim disputes; realtime on `shift_claims` for live claim updates

**👤 You handle:**
- ✅ Test the full loop with two accounts: claim → accept → complete, plus decline / withdraw / fell-through paths
- ✅ (Optional) Enable Realtime replication for `shift_claims` in Supabase dashboard if we want live claim updates without refresh

---

### 22 — Schedule-First Onboarding & Weekly Digest (Cold-Start Fix) ✅ DONE — *tested*

**Tier:** All tiers
**Why:** A new user's wall is empty until their board has density — but the photo schedule import (Task 15) makes the app useful **solo on day one** as a schedule keeper. Put it in the first-session flow instead of buried in the calendar. A weekly digest resurfaces quiet boards instead of letting them die silently.

**🤖 Claude handled (all shipped 2026-07-18; migration applied to production):**
- ✅ Migration `20260718100000_onboarding_and_weekly_digest.sql` — `users.notify_weekly_digest` (default true) + `users.onboarding_dismissed_at`; types updated
- ✅ `/welcome` wizard (`app/(dashboard)/welcome/`): Step 1 photo schedule import (embeds the Task 15 `ScheduleImportModal`; falls back to manual-calendar link when `GEMINI_API_KEY` is unset, matching the env-gate pattern), Step 2 join/create board (embeds `MyBoardsSection` — full invite-code flow), Step 3 push notifications (`PushNotificationsToggle`). Steps show live done-states (counts refresh on focus/modal close); "Take me to the Wall" / "Skip for now" both set `onboarding_dismissed_at`
- ✅ Routing: the Wall server page redirects brand-new users (no boards + no shifts + never dismissed) to `/welcome`; completing either step or skipping ends the redirect — covers email, OAuth, and returning-login paths without touching auth flows
- ✅ Empty-wall states for no-board users now point at `/welcome` ("Get Set Up") instead of the profile page
- ✅ Weekly digest: new `/api/cron/weekly-digest` (CRON_SECRET-protected, same pattern as expirations) — pulls posts created in the last 7 days that are still live, aggregates per user across their approved boards, excludes their own posts, skips users with nothing new, caps at 6 items per email. `weeklyDigestHtml` template added
- ✅ One-click unsubscribe: `/api/digest/unsubscribe?uid&sig` — HMAC-signed (keyed with CRON_SECRET, `lib/digest.ts`), no login needed, flips only `notify_weekly_digest`
- ✅ Profile → Notifications: "Weekly Digest" toggle, saved with the existing Save button
- ✅ `vercel.json`: digest cron scheduled `0 22 * * 0` (Sunday 22:00 UTC ≈ 6 PM ET during daylight time)
- Verified: `tsc` clean, ESLint clean, `next build` passes with `/welcome` + both API routes registered

**Onboarding v2 (2026-07-18, after Ace's first-user test):**
- ✅ **Bug fix (was "Failed to load profile"):** the Task 6 membership lockdown replaced the table-wide SELECT on `users` with an explicit column list, so the two new Task 22 columns had no SELECT grant — any new-code page selecting them (Profile, Wall) failed with permission denied. Fixed + applied: `20260718140000_grant_select_onboarding_columns.sql`. **Rule for future migrations: every new `users` column that clients read needs an explicit `GRANT SELECT`.**
- ✅ **Registration collects First + Last Name** — passed as `given_name`/`family_name` metadata (same keys Google OAuth sends), so the existing `handle_new_user` trigger derives the site display name ("First L.") with zero schema changes; `full_name` fills the Supabase auth Display Name. Live preview under the fields shows exactly what boards will see. Names restricted to letters/spaces/hyphens so the derived name always passes `displayNameRegex`.
- ✅ **Welcome is 3 easy steps (v3):** (1) join/create board, (2) schedule import ("works even while your join request is pending"), (3) push notifications. No display-name step — registration guarantees the name now, so the display-name gatekeeping was removed everywhere (welcome, Profile's create-board button, and the `displayNameReady` prop deleted from `MyBoardsSection`). Completed steps swap their number for the site-wide yellow star (`#ffea80`, same as the interest star — Nordic theme override applies automatically), so a QR-invited registrant effectively sees 2 steps.
- ✅ **Invite code carries through registration:** the QR/share link already lands on `/register?redirect=/boards/slug?c=CODE`; the register page now extracts the code (also accepts a direct `?code=`), shows an "invite detected" banner, and stores it in signup metadata + localStorage. `/welcome` redeems it once on first load — auto-sends the join request via the existing `lookupBoardByCode`/`confirmJoinBoard` actions, shows "request sent to <board>", then clears the code from both stores.
- ✅ `next.config.mjs`: `NEXT_DIST_DIR` override so verification builds can run beside `next dev` without corrupting `.next` (the recurring random `PageNotFoundError` build flake)
- ✅ **Pending members can build their calendar (v3, found in Ace's onboarding test):** schedule import + manual shift adds failed for users whose join request was still awaiting approval (both flows listed approved boards only, and the shifts INSERT policy required approved membership). Fixed end to end — migration `20260718160000_pending_member_calendar_shifts.sql` (applied to prod): INSERT policy now accepts pending-member boards (+ personal `board_id NULL` shifts), and a new `enforce_wall_post_membership` trigger blocks trade/giveaway flags on boards the user isn't approved in (insert AND later flag-flips; cron/service-role safe). Import modal + PostShiftForm list pending boards with "(pending approval)" labels, lock the Post-to-Wall section with an explainer, force wall flags off client-side, and match alerts now fire only for actual wall posts. Wall empty state for unapproved users says posts appear after leader approval, with a Join-or-Create button → `/profile#my-boards`.

**👤 You handle:**
- ✅ Re-test the new-user flow end to end: register with first/last name → verify → land on /welcome with display name pre-filled → join or create a board (should work now that the grants bug is fixed)
- ✅ Test the QR path: scan a board QR while logged out → register → confirm the join request fires automatically on /welcome
- ✅ Confirm digest day/time — currently Sunday 22:00 UTC; edit `vercel.json` to change
- ✅ Test the digest manually once there's recent activity: `curl -H "Authorization: Bearer $CRON_SECRET" https://myshiftx.com/api/cron/weekly-digest`, then click the unsubscribe link in the email and confirm the profile toggle flips off

---

### 23 — iOS Push via Add-to-Home-Screen Flow ✅ DONE — *tested on a real iPhone*

**Tier:** Free (extends Task 16 web push)
**Why:** In a first-come marketplace, notification latency is the product. Since iOS 16.4, web push **works** on iPhone for PWAs added to the home screen — the "no iOS push" note in Task 16 was outdated. A guided install flow unlocks real-time alerts for the biggest platform now, years before the Task 14 native app.

**🤖 Claude handled (shipped 2026-07-18):**
- ✅ Detection helpers in `lib/push.ts`: `isIOS()` (incl. iPadOS-masquerading-as-Mac), `isStandalone()`, `needsIosInstallForPush()`, `isIosSafari()`
- ✅ `IosInstallPrompt` component — numbered walkthrough (Share → Add to Home Screen → open from Home Screen and allow notifications), with an extra "open in Safari first" step when browsing from Chrome/Firefox/Edge on iOS. Appears **only** in iOS browser tabs where the Push API is absent
- ✅ Placements: dismissible banner on the Wall (localStorage-persisted, same pattern as PushPromptBanner) + always-visible inline versions in Welcome step 3 and Profile → Notifications (both spots where the push toggle silently hides itself on iOS)
- ✅ Installed/standalone mode needs nothing new: once opened from the Home Screen the Push API exists, so the existing Task 16 prompts take over automatically
- ✅ Manifest verified already correct (`display: standalone`, 512px icon, apple-touch-icon via `app/apple-icon.png`) — no changes needed
- ✅ Help page + Task 16 note updated to reflect iOS 16.4+ support and the in-app walkthrough
- Verified: `tsc` clean, ESLint clean, `next build` passes

**👤 You handle:**
- ✅ Test on a real iPhone (iOS 16.4+): browse the Wall in Safari → walkthrough banner appears → install → open from Home Screen → enable push → have your second account claim one of your shifts and confirm the push arrives
- ✅ Also glance at the walkthrough from Chrome on iOS — it should add the "open in Safari" step

---

### 24 — Product Analytics & Error Tracking `NEEDS DISCUSSION`

**Why (plain English):** Right now the app has no way to answer questions like "how many people who register actually join a board?", "which upgrade nudge do people click?", or "did anyone hit a crash last night?". Analytics = anonymous event counters that answer the first two; error tracking = automatic crash reports that answer the third. Without them, every pricing/paywall/ad decision in Tasks 7–12 is a guess. Both have free tiers (PostHog, Sentry) and take ~a day to wire in.

**Status:** Ace wants more clarification before green-lighting — discuss before starting. Questions to resolve: which tool(s), what events to track, cookie-consent interaction with the existing CMP setup.

---

### 25 — Showcase Mode & AdSense Re-Review `LIVE — awaiting resubmission`

**Why:** After ~4 weeks in review, AdSense **rejected** myshiftx.com on `2026-07-27`. The headline reason: the site is **login-gated**. `middleware.ts` denies by default, so Googlebot and the human reviewer only ever saw `/login`. Nothing was wrong with the ad integration (Task 12) — there was simply no crawlable product to review.

**🤖 Claude handled (`0cfc998`, merged to main, live on production `2026-07-28`):**
- ✅ **Showcase mode**, gated on `NEXT_PUBLIC_SHOWCASE_MODE` (`lib/showcase/mode.ts`, documented in `.env.example`) — the same env-flip pattern as AdSense/push/Gemini, so it reverts without a code change
- ✅ With it on: `/wall`, `/calendar`, `/messages` are public and served from **hand-written fixtures** via an internal rewrite to `app/preview/*`, so the canonical URLs a crawler indexes stay `/wall` etc. The demo reads no database at all
- ✅ Registration and account-recovery routes 404; `/login` still works but is linked nowhere; every private route sends signed-out visitors to `/` rather than `/login`, so no crawlable path dead-ends at an auth wall
- ✅ **Nothing writes:** `assertWritesEnabled()` guards `getActionSession()` (the chokepoint for 51 of 53 server actions), plus survey, help, and both cron jobs; middleware 503s any non-GET to `/api/*`
- ✅ Every demo page carries a permanent "Interactive demo — sample data" banner. This is deliberate and non-negotiable: Google's Publisher Policies **Misrepresentation** clause forbids presenting fabricated activity as a genuine community
- ✅ **Permanent additions that survive the revert:** a blog (`app/blog` — six posts at launch, thirteen as of `2026-08-05`), a public `/faq`, and an expanded `/about`. *This is the part that actually clears Google's content bar* — the demo surface is thin content on its own. The demo pages are now intended to stay public **permanently** rather than being reverted: AdSense's [UGC forum-app rules](https://support.google.com/adsense/answer/9640027) want "equivalent web content for each page that sends ad requests", and a public `/preview/wall` is exactly that for the gated Wall
- ✅ Verified on production after deploy: `/wall` `/calendar` `/messages` `/blog` `/faq` all 200; `/register` `/forgot-password` `/survey` 404; `/profile` 307 → `/`; `/preview/wall` 307 → `/wall`; `POST /api/push/subscribe` 503; `robots.txt` disallows `/preview/`; sitemap has 23 URLs with no `/login` or `/register`
- ✅ README disclaimer updated for showcase mode (`6429fd1`)

**🤖 Claude handled (`2026-08-05`) — ad placement narrowed and the blog doubled:**
- ✅ **Ads removed from Calendar and Messages**, both the live dashboard routes and the public demos. Google's [ads on screens without publisher-content](https://support.google.com/publisherpolicies/answer/11112688) policy bars ads on screens that carry no publisher content or exist "for alerts, navigation or other behavioral purposes" — a month grid is a navigation surface and a private inbox has no publisher content at all. `/messages/[id]` conversation threads dropped too. The exclusions and the reasoning live in a comment on `AD_ENABLED_PATHS` in `components/features/AdRail.tsx`; the `AdRail` wrapper was removed outright from `app/preview/calendar` and `app/preview/messages` so no page claims ads it will never show
- ✅ **The Wall keeps its ad slot.** A UGC feed is a forum, which is an established permitted category — this was re-checked rather than assumed. It cannot serve *targeted* ads once the app is gated again until an AdSense **crawler login** is configured, and that setting only exists after the account is approved ([docs](https://support.google.com/adsense/answer/161351)) — so it is a post-approval step, not a blocker now
- ✅ **Seven new blog posts**, taking the blog from six to thirteen (~1,200 words each): writing a shift post that gets answered, when someone ghosts a trade, starting a board at your workplace, picking up extra hours without burning out, checking your shift pay, asking for time off, and what nobody tells you in your first month on a rota. Index, sitemap, and prev/next links all derive from `BLOG_POSTS`, so nothing else needed touching. Sitemap is now 26 URLs, 13 of them posts
- ✅ Every new post links only to routes that are public in **both** modes (`/about`, `/wall`, `/calendar`) — `/boards` was deliberately avoided because it is dashboard-only and would recreate the "links leading to missing pages" citation from `10e4483`
- ✅ Verified: `tsc --noEmit` clean, `next lint` clean

**👤 You handle — next steps, in order:**
- [ ] **Search Console → URL Inspection** on `/`, `/wall`, `/blog` — confirm Google fetches a real page, not a redirect
- [ ] **Request the AdSense re-review** once URL Inspection looks clean
- [ ] After approval: **unset `NEXT_PUBLIC_SHOWCASE_MODE` in Vercel and redeploy.** No code change. Both directions were verified locally on `2026-07-27`
- [ ] After approval: configure the **AdSense crawler login** (AdSense → Crawler access + Search Console verification) so the gated Wall serves targeted ads instead of remnant fill

**Notes for whoever picks this up:**
- If a **second** rejection comes, the next lever is **more written content, not more demo surface**
- Do **not** un-hide the placeholder testimonials in `app/page.tsx` (they sit behind `className="hidden"`) — fabricated reviews are a direct Misrepresentation hit
- Registration being 404 in showcase mode means **no one can sign up while this is on**. That's the deliberate trade: the site can't grow and get approved at the same time. Weigh that if approval drags on — and see the launch-deadlock note at the top of this file, because "wait for ads before launching" is currently costing more than it earns
- **Ad networks other than AdSense were evaluated on `2026-08-05` and none of them fit.** Ezoic now requires 250k monthly users, Raptive 25k pageviews plus long-form content on the *majority* of pages, Mediavine's main network $5k/yr in ad revenue. Only Newor Media (no minimum) is a realistic fallback if AdSense rejects again, and Mediavine Journey (1,000 sessions/mo) is the milestone worth aiming at if the blog keeps growing. **PropellerAds is a hard no** — its demand is popunder/push, which would wreck a product whose pitch is being more trustworthy than a Facebook group. AdMob is not an option either: PWAs aren't a supported Google Mobile Ads SDK platform, and the same publisher policies would bar the calendar/messages screens anyway

---

## Optional Improvements (Code Scan 2026-07-18)

Full report: [docs/code-scan-2026-07-18.md](docs/code-scan-2026-07-18.md). Serious findings were fixed same-day (email HTML injection, stale createBoard display-name gate, transparent-PNG black-canvas bug, hot-path index gaps — see report). These are the non-urgent leftovers, ordered roughly by value; tackle one at a time.

**Database (Supabase performance advisor):**
- ✅ `2026-07-19` Wrap `auth.uid()` as `(select auth.uid())` in the 27 RLS policies flagged `auth_rls_initplan` — done via `20260719120000_rls_initplan_auth_wrap.sql` (ALTER POLICY only, expressions otherwise verbatim from pg_policies; all 34 `auth.uid()`/`auth.role()` calls wrapped). Advisor re-run confirms 0 findings remain. Smoke-test the app normally — behavior should be identical, just faster on large scans
- ✅ `2026-07-19` Consolidate overlapping permissive RLS policies (48 findings) — done via `20260719140000_consolidate_permissive_policies.sql`: merged each action's policies into one with the original expressions OR'd verbatim (comments UPDATE 2→1, requests SELECT 3→1 + UPDATE 2→1, shifts SELECT 4→1 + UPDATE 2→1, user_boards SELECT 4→1 + DELETE 2→1, users UPDATE 3→1), and scoped everything TO authenticated (all expressions are anon-impossible). Verified: exactly 1 policy per table+action, advisor re-run shows 0 findings. 👤 Smoke-test the moderation flows (flag resolution, member role changes, board approvals) plus normal wall/profile use — semantics are preserved by construction, but these paths exercise the merged policies hardest
- ✅ `2026-07-19` Add covering indexes for the 9 remaining unindexed FKs — `20260719150000_remaining_fk_indexes.sql`, applied to prod; advisor's unindexed_foreign_keys findings now fully cleared
- ✅ `2026-07-19` Revoke anon EXECUTE on SECURITY DEFINER functions — `20260719151000_function_execute_lockdown.sql`. Root cause found: Task 6's revoke never held because PUBLIC retained EXECUTE (functions default to EXECUTE TO PUBLIC). Now grouped properly: trigger-only fns callable by no one, cron fns service-role-only, user RPCs authenticated-only. Verified: anon-executable 32 → 10, and the 10 are deliberate RLS-predicate exceptions (revoking those would make TO-public policies *error* for anon instead of returning empty — documented in the migration)
- [ ] 👤 Enable Leaked Password Protection (Supabase dashboard → Authentication → Policies) — open since Task 6

**Application:**
- ✅ `2026-07-19` Rate-limit `/api/schedule-import/report` — 3 reports per 10 min per user (in-memory per warm instance; blunts rapid-fire spam, documented serverless caveat). Post/comment/flag write paths remain covered by the Ongoing-table rate-limiting item for post-launch
- ✅ `2026-07-19` Closed the OAuth loophole: `lib/registration.ts` centralizes the `REGISTRATION_PAUSED` flag (was duplicated inline in the register page); `app/auth/callback/route.ts` now detects a brand-new account (`created_at` ≈ `last_sign_in_at`, the standard "first-ever session" signal) and, while paused, signs it back out and bounces to `/register?oauth_blocked=1` instead of granting a session — same as the email flow. Note: the DB account itself still gets created by the `handle_new_user` trigger before this check runs (Supabase creates it during the code exchange) — this closes *session access*, not row creation; the account is otherwise inert (Guest role → redirected to `/verify-email` with no real access, per `app/(dashboard)/layout.tsx`). Register page shows a specific "sign-in with Google/Facebook/LinkedIn is paused too" message when bounced this way
- ✅ `2026-07-19` Extracted duplicated board-list fetch → `lib/boards.ts` `fetchMyBoards()` (used by ScheduleImportModal + PostShiftForm)
- ✅ `2026-07-19` Extracted shared service-role client → `lib/supabase/admin.ts` `createAdminClient()`, and sender/support constants → `lib/email-constants.ts` (notifications, both crons, digest unsubscribe, report route, help action all updated; the plain `noreply@` senders unified to the branded one)
- ✅ `2026-07-19` Wall realtime: shifts/requests channels now filtered to the user's boards (`board_id=in.(…)`), and `loadClaimData` debounced 300ms. Known trade-off (commented in code): filtered DELETE events don't fire, so hard-deleted rows (board-deletion cascade) linger until refresh — soft removals are UPDATEs and stay live
- [ ] Weekly digest at scale: chunk the members/posts query and batch Resend sends — deferred by design until membership passes a few hundred
- ✅ `2026-07-19` Removed dead exports `notificationHtml` / `betaClosingHtml` (git history keeps them)
- [x] ~~`beta_survey_responses` INSERT `WITH CHECK (true)`~~ — reviewed: intentional (anonymous survey), accepted

---

## Vernacular (2026-07-18)

Board role **"Leader" now displays as "Admin"**; global role **"Admin" now displays as "Overlord"**. Display-layer only — DB values, RLS policies, route paths (`/leader/*`, `/admin`), and code comparisons still use `Leader`/`Admin`. The label maps live in `lib/roles.ts`; all user-facing prose (dialogs, empty states, pending-approval notes, archive labels, help copy, nav labels) was updated to match. README documents the stored-vs-displayed mapping.

---

## 🔒 Security & Stability Fixes — Audit of 2026-07-27

### ✅ ALL ITEMS COMPLETE — 2026-07-27 04:40

Every issue from the audit is fixed on **both** apps, plus one Critical (S16) found during the work that the audit had mis-rated. All database changes are applied and verified on both projects.

**✅ Update `2026-07-28` — the audit is now fully closed on both apps. Nothing is outstanding.**
- The final code batch (S9/S10/S12/S13/S14, `79f297a`) is **deployed** — it shipped ahead of showcase mode (`0cfc998`)
- The S8 column lock (`20260730003000`) is **applied and verified on MyShiftX** (see the S8 note below)
- **WDWShiftX's `STEP1`, `STEP2` and `STEP3_URGENT` were all run by Ace, all reporting PASS** — so that project's database has caught up with its code, including the S16 Critical

*One thing worth an eyeball on WDWShiftX (see the S8 note below): `STEP2`'s PASS proves the privilege change took, not that its board pages still render — those are different claims.*

**Two findings were caught only because the fix was tested rather than read.** Both looked correct on the page:
- The `invite_code` revoke did nothing — a column-level `REVOKE` can't subtract from a table-level grant.
- S16 wasn't "can queue a join request without a code" at all; it let any account make itself **Admin of any board**.

### 📊 Progress at a glance — last updated 2026-07-27 04:40

| Item | MyShiftX | WDWShiftX | Notes |
|---|---|---|---|
| **S1** fake emails/alerts 🔴 | ✅ `7047edf` | ✅ `0b73827` | Done. Two extra holes found and closed while in there |
| **S2** import quota bypass 🟠 | ✅ `932a7f3` | ✅ `8e5d008` | DB applied on both (WDW via `STEP1`) |
| **S3** guessable invite codes 🟠 | ✅ `9492612` + codes rotated | ✅ `a361be7` | WDW codes left alone per your call |
| **S4** trade stats exposure 🟠 | ✅ `30dbab6` | ✅ `3234c39` | Owner-only as instructed; DB applied on both |
| **S5** inert REVOKE 🟡 | ✅ `57ad936` | ✅ committed + applied | WDW DB caught up via `STEP1` |
| **S7** claim-count scoping 🟡 | ✅ `57ad936` | ✅ committed + applied | WDW DB caught up via `STEP1` |
| **S8** invite code leak 🟡→🟠 | ⚠️ **half done** | ⚠️ **half done** | See warning below — severity increased |
| **S11** memory/timeout 🟡 | ✅ `932a7f3` | ✅ `8e5d008` | Sized for your 2 GB functions |
| **S15** silent notify failures 🟢 | ✅ `7047edf` | ✅ `0b73827` | Shipped with S1 |
| SQL files for WDW's database | n/a | ✅ `6ae7247` | 👤 **Two files to run — see below** |
| **S6** Stripe event ordering 🟡 | ✅ `0d5487b` | ❌ n/a (no billing) | DB applied; also makes Stripe retries idempotent |
| **S9** realtime storm 🟡 | ✅ `79f297a` | ✅ `d5a5561` | Scoped subscription + coalesced refresh |
| **S10** sequential fan-out 🟡 | ✅ `79f297a` | ✅ `d5a5561` | Batches of 8, `allSettled` |
| **S12** middleware allowlist 🟡 | ✅ `79f297a` | ✅ `d5a5561` | Inverted — private by default |
| **S13** cron leaks + timing 🟢 | ✅ `79f297a` | ✅ `d5a5561` | Constant-time compare, no raw errors |
| **S14** silent no-op 🟢 | ✅ `79f297a` | ✅ `d5a5561` | Returns proper not-found |
| **S16** self-promote to board Admin 🔴 | ✅ `42775d1` | ✅ `STEP3_URGENT` run, PASS | Critical, not High — see below |
| **S8** column lock | ✅ applied + verified `2026-07-28` | ✅ `STEP2` run, PASS | MyShiftX verified by role impersonation |

**✅ WDWShiftX's database steps are done.** All three files (`APPLY_TO_DATABASE_STEP1.sql`, `STEP2`, `STEP3_URGENT`) were run by Ace and every check reported PASS, so that project's database is no longer behind its code. *(Claude can reach MyShiftX's Supabase but not WDW's, which is why these were hand-run.)*

**✅ S8 is COMPLETE on MyShiftX — `2026-07-28`.**

The warning that used to sit here said "do not run the last migration yet, the app code isn't deployed." That precondition was met by `4756960` ("read invite codes through the membership-gated function"), live since the `0cfc998` deploy.

- ✅ 🤖 **`20260730003000_lock_invite_code_column.sql` applied to production `2026-07-28`.** Pre-flight checks first: the live `boards` table has exactly the 8 granted columns + `invite_code` (no drift, which the migration's own header warns is the failure mode), `get_board_invite_codes()` confirmed live, both board pages confirmed reading through it, and neither `createBoard` nor `regenerateInviteCode` still filters on the column
- ✅ Verified after applying, with role-impersonated SQL: `authenticated` and `anon` can no longer **read** `invite_code` **or use it in a `WHERE`** (the second one is the part a plain column REVOKE would have missed); the exact column list the board pages select still reads fine; `service_role` is unaffected so crons and webhooks keep working; an **approved** member still gets the code back from the RPC, and a **pending** member gets nothing — which is the actual S8 hole, now closed
- ✅ Recorded version corrected to `20260730003000` to match the repo filename — `apply_migration` had stamped it `20260728165623`, which would have left the CLI thinking the file was unapplied and re-running it on the next `db push`
- ✅ 👤 Same migration on WDWShiftX — its `STEP2` file was run by Ace and reported PASS
- [ ] 👤 **Worth one look on WDWShiftX:** `STEP2`'s PASS asserts the *privilege state*, not that the app still works. Open a WDW board page as an approved member and confirm the invite code still displays. If it's blank, that project's app-half code (reading codes via `get_board_invite_codes()`) isn't deployed yet — the fix is to deploy it, not to roll back the migration

**🔴 S16 — ✅ FIXED on both apps.** MyShiftX `2026-07-27 04:12` (`42775d1`); WDWShiftX via `APPLY_TO_DATABASE_STEP3_URGENT.sql`, run by Ace and reporting PASS.

*Originally logged as "can queue a join request without a code" (High). That badly undersold it — it was Critical.*

The database rule for adding yourself to a board checked only that the row was **yours**. It never checked what **role** you gave yourself, or whether you marked yourself **already approved**. So any logged-in account could add itself as an approved **Leader of any board** and instantly: read every post on it, see the full member list, remove members, change roles, transfer ownership, delete the board, and read its invite code. It also defeated the S8 invite-code lock, since a self-promoted Leader counts as an approved member.

Confirmed by actually performing the attack as an ordinary test user in a rolled-back transaction — it worked.

The rule now permits only what the app really does: a pending plain-member join request, or Leader on a board you just created. Verified afterwards that all three attack shapes are refused and a normal join still works. **No sign anyone used it on MyShiftX** — every approved membership is a global Overlord auto-added for oversight, a board creator, or carries a recorded approver.

**✅ WDWShiftX: `APPLY_TO_DATABASE_STEP3_URGENT.sql` was run and passed.** It also prints any self-granted memberships — worth a glance at that output if you still have it, since it's the only record of whether the hole was ever used on that project.



**Applies to BOTH apps.** A full security and architecture review turned up 17 issues. Fifteen of them exist in *both* MyShiftX and WDWShiftX, because WDWShiftX was forked from this code. Fixing one does **not** fix the other — each needs its own change.

**Plain-English summary of where things stand:** the apps are in better shape than most. Every database table already blocks unauthorised access, payments are handled correctly, and the calendar-feed links are properly locked down. But there is **one serious hole that needs fixing this week**, three more worth doing soon, and a batch of smaller cleanups.

**How to read this:** 🤖 = I do it, no action from you. 👤 = only you can do it. Severity means: **Critical** = fix now; **High** = fix this month; **Medium** = fix when convenient; **Low** = tidy-up.

---

### 🔴 CRITICAL — Fix first

#### S1 — Anyone can send fake emails and alerts from the app

**What's wrong, in plain English:** When you post a shift, the app emails people whose requests match it. The code that sends those emails never checks *who asked it to*. It just trusts whatever it's told — including the sender's name and the shift title.

**Why it matters:** Someone with an ordinary free account could make the app send emails and phone alerts to your users, from your real email address, saying anything they want — for example a fake "MyShiftX Security: verify your account here" message with a link to a scam site. Because the email genuinely comes from your system, spam filters let it through and it looks completely legitimate. They could also do this to boards they aren't even a member of.

**This is worse on WDWShiftX.** Because Pro was removed there, nothing limits how many people a fake email reaches. And since every WDW user is a real coworker at one employer, a fake internal-looking message is far more convincing.

**🤖 Claude handles:** ✅ **DONE — 2026-07-27 02:14**
- ✅ Added a login check to all 7 notification functions in `app/actions/notifications.ts` — MyShiftX (commit `7047edf`)
- ✅ Same fix in WDWShiftX (commit `0b73827`) — done first, as agreed, since it was the more exposed of the two
- ✅ Sender name, shift title, board and date are now all read from the database row, and the caller must own that row. A forged payload no longer reaches anyone
- ✅ Two extra holes found and closed while in there: the "tell the other people who missed out" list was also caller-supplied (so it could push to anyone) and is now read from the database; and the trade outcome in the "did it go through?" alert was a caller-supplied yes/no that could contradict what actually happened — it now reads the real recorded result
- ✅ Silent notification failures fixed at the same time (that was S15 — see below)
- ⏳ *Automated safety net still to come — it lands with S5's check, which covers the same class of mistake*

**Verified:** type-check, lint and full build clean on both apps.

**👤 You handle:**
- ✅ **Check whether this has already been abused.** Log in to Resend → Emails, and look for match-alert emails you can't account for, especially bursts to many recipients at once, or odd sender names / shift titles. Same for any push-notification logs. *(If you see nothing unusual, you're almost certainly fine — this is confirmation, not a fire drill.)*
- ✅ Tell me what you find before I deploy, so I know whether we're patching a hole or cleaning up after one. *** This secure and has not been exploited yet. ***

---

### 🟠 HIGH — Fix this month

#### S2 — The photo-import limit can be bypassed, and it costs you money

**What's wrong:** Free accounts get 4 schedule-photo imports a month. The app checks your remaining count, then reads the photo, then subtracts one. If someone uploads 50 photos at the exact same moment, all 50 pass the check before any of them subtract — so they get 50 imports instead of 4.

**Why it matters:** Every one of those reads is a paid call to Google's AI service on your account. Someone could run up your Google bill deliberately, and the only sign would be the invoice.

**🤖 Claude handles:** ✅ **DONE — `932a7f3`** (MyShiftX) / `8e5d008` (WDWShiftX)
- ✅ Reserve the import slot *before* reading the photo instead of after, so simultaneous uploads can't all slip through — both apps. The new `reserve_schedule_import` RPC checks and spends in one locked statement
- ✅ Keep the current behaviour where a failed read doesn't cost you an import — a `finally` block calls `release_schedule_import` on every exit path that isn't a successful read, so no early return has to remember
- ✅ Also reject files that claim to be photos but aren't — `sniffImageType()` reads the actual magic bytes for JPEG/PNG/WebP instead of trusting the browser-supplied `file.type`, and the sniffed type is what's sent downstream

**👤 You handle:**
- ✅ Check your Google Cloud billing for the Gemini API over the last few months. Any unexplained spike would mean this has already been exploited *** This has not been exploited yet. ***
- ✅ Confirm the free-tier limit should stay at 4/month, or tell me a different number *** This is set to 4/month. ***

---

#### S3 — Board invite codes are guessable

**What's wrong:** Invite codes are built with a random-number generator that isn't designed for security. It's predictable if someone collects enough samples. The codes are also fairly short.

**Why it matters:** The invite code is the only thing standing between an outsider and a private workplace board.

**On WDWShiftX this is much less urgent** — board creation is switched off there, so nobody can generate samples to study. But your two existing board codes were still made the old way.

**🤖 Claude handles:** ✅ **DONE — `9492612`** (MyShiftX, codes rotated) / `a361be7` (WDWShiftX, codes left alone per your call)
- ✅ Switch to a proper cryptographic random generator and lengthen codes from 7 to 10 characters — both apps. `crypto.randomBytes` over a 32-char alphabet, masked to 5 bits per character so the distribution is uniform (32 divides 256 exactly — no modulo bias). Keyspace 2^35 → 2^50
- ✅ Existing codes keep working; nothing breaks on deploy — the join path accepts 7–10 characters rather than exactly 7, in the Zod schema and both client-side length checks

**👤 You handle:**
- ✅ **Decide: rotate the existing codes or not?** Rotating is safest but **invalidates every invite link already shared** — anyone mid-signup would need a new link. My recommendation: rotate MyShiftX's boards (low usage so far), and rotate WDW's two codes during a quiet period with a heads-up to the board Admins *** Rotate codes for myshiftx but leave the invites for wdwshiftx. Those invites are just easy to share, and the codes are not sensitive. ***
- ✅ If you rotate, message board Admins so they can re-share *** Rotate for myshiftx but no need to send messages as all users are fake users at the moment. ***

---

#### S4 — Members' reliability stats are visible to people who shouldn't see them

**What's wrong:** There's a behind-the-scenes function that returns someone's trade history — how many shifts they completed, and how many they backed out of. It doesn't check whether you're allowed to ask about that person. Any logged-in user can request it for anyone.

**Why it matters:** In a workplace, "backed out 6 times" is effectively a disciplinary record. Someone could keep pulling that up about former coworkers long after leaving a board.

**🤖 Claude handles:**
- ✅ Restrict it so you only get stats for people you currently share a board with — both apps *** =Let's change it so only the owner of the stats can see their stats. This seems mean to share this with other users. But keep the stats for the user and also for the overlord to see in the overlord panel. ***
- ✅ Add a cap so nobody can request thousands of records at once *** This is not a problem. See above ***

**👤 You handle:**
- ✅ Nothing, unless you *want* stats visible more widely — tell me if so *** This is not a problem. See above ***

---

### 🟡 MEDIUM — Fix when convenient

**All eight are ✅ complete on both apps.** WDWShiftX's code was committed for all of them and its database half (S5, S7, S8) caught up via the `STEP1`/`STEP2` files, all PASSing.

| # | Issue in plain English | Apps | 🤖 Claude | 👤 You |
|---|---|---|---|---|
| S5 ✅ | A database lock-down that was supposed to be applied never actually took effect (the command used doesn't do what it looks like it does). Not currently exploitable, but the same mistake would be dangerous elsewhere. **This one came from WDWShiftX's own code and I copied it across during the backport.** | Both | ✅ `57ad936` — applied the correct command; added an automated check so it can't silently fail again | — |
| S6 ✅ | Stripe sometimes delivers events out of order. If a "cancelled" arrives before a delayed "active", someone could stay on Pro for free — or a paying customer could be wrongly downgraded | MyShiftX only *(WDW has no billing)* | ✅ `0d5487b` — tracks which update is newest and ignores stale ones; also makes Stripe retries idempotent | Nothing |
| S7 ✅ | The "how many people want this shift" counter can be queried for boards you don't belong to, and can be asked for huge batches at once | Both | ✅ `57ad936` — restricted to your own boards; batch size capped | Nothing |
| S8 ✅ | Someone whose join request is still **pending approval** can read the board's invite code | Both | ✅ **Complete on both `2026-07-28`** — DB function (`57ad936`), app code reading through it (`4756960`), and the column lock (`20260730003000`) applied and verified on MyShiftX; WDW's `STEP2` run and PASSing | Confirm whether someone can request to join *without* a code — this decides how serious it is |
| S9 ✅ | Every open browser tab listens to *every* message sent anywhere in the app, then reloads the whole page each time one arrives. Wasteful, and gets worse as you grow | Both | ✅ `79f297a` — scoped the subscription to the user's own conversations; coalesced the refreshes | Nothing |
| S10 ✅ | When a shift matches many requests, notifications are sent one at a time. On a busy board this can time out partway, so later people silently never get told | Both | ✅ `79f297a` — batches of 8 via `Promise.allSettled`, so one unreachable recipient can't abort the rest | Nothing |
| S11 ✅ | Photo import holds about 30 MB of memory per upload, and its time limit is set shorter than the work it may attempt | Both | ✅ `932a7f3` — drops the large intermediates before the network wait; `MODEL_BUDGET_MS = 75s` shared across both endpoint attempts under a 90s `maxDuration`. Sized for your 2 GB functions | ✅ Confirmed: 2 GB default (1 vCPU) |
| S12 ✅ | Some pages are protected only because each one remembers to protect itself. There's no automatic backstop, and the list that's meant to be one is already out of date | Both | ✅ `79f297a` — inverted: private by default, public routes must be explicitly listed | Nothing |

---

### 🟢 LOW — Tidy-up

| # | Issue in plain English | Apps | 🤖 Claude |
|---|---|---|---|
| S13 ✅ | The nightly cleanup job returns raw database error text to whoever calls it, and compares its password in a way that leaks tiny timing hints | Both | ✅ **DONE `79f297a`** / `d5a5561` — constant-time compare, no raw errors returned |
| S14 ✅ | "Break up this bundle" reports success even when it did nothing | Both | ✅ **DONE `79f297a`** / `d5a5561` — returns a proper not-found |
| S15 ✅ | Notification failures are thrown away silently, so a broken alert looks like a working one | Both | ✅ **DONE 2026-07-27 02:14** — shipped with S1 (`7047edf` / `0b73827`). Both post forms and the interest action now log the failure instead of discarding it |

---

### 📋 Suggested order *(historical — this plan was executed in full; kept for the record)*

1. **S1 on WDWShiftX**, then **S1 on MyShiftX** — the only genuinely urgent item
2. **S2 + S11** together (same file)
3. **S3** — once you've decided about rotating codes
4. **S4, S7, S8** together (one database change each app)
5. **S5** — quick, and stops the mistake recurring
6. Everything else as normal work

### 📋 What I need from you before starting

- ✅ **Resend / push logs check** (S1) — the one thing that changes what we're doing rather than just when *** This is not a problem. All Clear ***
- ✅ **Google Cloud billing check** (S2)
- ✅ **Decision on rotating invite codes** (S3)
- ✅ **Vercel memory limit** (S11) *** a default function memory size of 2 GB (1 vCPU), and 8 GB of build memory. ***
- ✅ **Access to the WDWShiftX database** — I can read and change MyShiftX's database directly, but WDWShiftX's is on a different Supabase account I can't reach. Either add it to the same account/token, or you run the database parts yourself and I'll hand you the exact commands. *Until this is sorted, I can fix WDWShiftX's code but not its database (S4, S5, S7, S8).* *** Give me a sql file with the database changes you need to make. ***

**None of the above blocks me from starting on S1**, which is the item that matters most.

---

## 🔀 WDWShiftX → MyShiftX Port #2 — Wall, Calendar, Help, Admin, Tour (2026-07-28 → 2026-08-17)

**Source doc:** `WDWShiftX/PORTABLE_FEATURES_2.md` — the full survey of 19 candidate items, with portability notes. **You picked 17 of the 19** (everything except the two MNSSHP/HHN/MVMCP Disney-park badge items, which I'd also recommended skipping).

**This is a bigger lift than the September security-fix pass.** That was ~16 focused, independent fixes. This is 17 items across 6 areas, several of which depend on each other, plus one 2,700-line admin overhaul that touches the same files that broke last time because of the Stripe/ads/self-serve-boards fork divergence. Read the whole section before we start — the sequencing and the conflict warnings matter more here than last time.

**How to read this:** 🤖 = I do it. 👤 = only you can decide or do. Items are grouped into **phases** — later phases depend on earlier ones actually being done, not just picked.

---

### ⚠️ Before I touch anything: the fork-divergence risk is back

WDWShiftX removed Stripe billing, ads, and self-serve board creation months ago. MyShiftX still has all three. Every prior port that touched `AdminClient.tsx`, `BoardsClient.tsx`, or `boards.ts` needed manual conflict resolution to avoid deleting MyShiftX's billing/ads code by accident — I caught it every time, but it's real work, not a formality.

**Item 17 (admin panel overhaul) is the highest-risk item on this list** — it rewrites `AdminClient.tsx` (943 lines changed) and `BoardsClient.tsx` (677 lines changed), the exact two files where this keeps happening. I'll do the same careful diff-and-preserve process as before, but budget for it: this is not a quick cherry-pick.

---

### Phase 1 — Database groundwork 🤖

Two schema changes, both currently bundled with WDW's admin overhaul but separable, plus the display-name format change. Doing these first means every later phase has the columns/functions it needs.

- [ ] **#15 — `first_name` / `last_name` columns.** Adds the two columns to `users`, backfills existing rows by splitting `display_name` on its last whitespace token (guarded so re-running won't clobber manual corrections), updates `handle_new_user()` and `get_users_admin()` to populate/return them.
  - **Known trap, already hit once on WDW:** MyShiftX's `boards` and `users` tables use column-level SELECT grants, not table-wide (that's the S8 fix from last time). A new column has **no grant at all** until explicitly added — and selecting it fails the *whole query* with "permission denied for table X", not just that column, which is a confusing error to debug blind. WDW's own migration comment notes they missed this on the first pass. I'll grant it correctly from the start.
- [ ] **#13 — Full "First Last" display names.** ✅ **Confirmed 2026-08-17** — useful for business purposes.
- [ ] **#14 — Display-name copy update.** Trivial, rides with #13.

---

### ✅ Phase 2 — Wall filters (#1, #2, #3) — COMPLETE 2026-08-18

- [x] **#1 — Type filter**: Trade/Giveaway checkboxes on the Offers tab, both-on by default, always applied (unchecking both intentionally shows nothing, matching WDW).
- [x] **#2 — Days filter**: seven always-visible day pills (Sun–Sat), all-on by default, reordered to match the user's week-start preference. Same "everything off shows nothing" rule.
- [x] **#3 — Filter panel layout**: reworked per follow-up feedback (2026-08-18) to a fixed row order rather than the 2-column paired grid WDW used. Top to bottom (same order on mobile and desktop, since each filter type now gets its own full-width row): Board (own row, first, only when >1 board), My Posts + Trade/Giveaway (offers only, shared row), bundle chip + Clear Filters (when present), Days pills (own full-width row, directly above Date on every screen size), Date + Search (still paired, same as before). Labels kept (not dropped to placeholder-only like WDW) and Clear Filters stayed inline rather than moving to the always-visible header — neither was asked for.

No database change. Type-check, lint, and full build all clean. Could not exercise the Wall page live in-browser (no test-account credentials on hand for this session) — verified by code inspection instead.

---

### ✅ Phase 3 — Wall/card polish (#5, #6, #7) — COMPLETE 2026-08-18

- [x] **#5 — "I Can Help" rename**: copy-only. Renamed everywhere it appeared: `ClaimSection.tsx` (shift claim pill, title tooltips, doc comments), `CommentSection.tsx` (requests' equivalent pill + prop doc comments), `RequestCard.tsx` (⋮ menu item, icon changed Star → Handshake to match), `notifications.ts` (push body text for a claim), `email-template.tsx` (claim email body), `TradeRecordSection.tsx` (empty-state copy), `HelpClient.tsx` (4 spots: quickstart step, FAQ answer, "Claiming a Shift" intro, bundle-claiming bullet). Left untouched: internal code comments in `claims.ts` and `WallClient.tsx` that WDW itself never renamed (matched upstream, not a regression), and blog posts (out of scope per your original instruction to exclude blog content from this port).
- [x] **#6 — Requests match Offers' action-row layout**: reordered `CommentSection.tsx`'s action row to leadingAction → Interest pill → Comments → Message (was Comments → Interest pill before). Restyled the Interest pill from the gold/Star "mark interest" look to the same outline-until-acted-on/solid-once-sent visual language as `ClaimPill` — Handshake icon, primary color, tooltip text, label "I Can Help" for non-owners / "Interested" for the owner's accordion toggle. Kept the `(count)` inline format rather than introducing WDW's `CountPill` component — that's explicitly scoped to Phase 5 ("Shared CountPill component unifying count styling"), so building it early here would jump ahead of that phase for no functional reason.
- [x] **#7 — Calendar color-coding + dot split**: added `shiftTypeColor()` to `CalendarClient.tsx` (purple = trade+giveaway, blue = trade only, green = giveaway only, matching the Wall's card language) and applied it to the shift title in both Grid and List views. Added a `spread` prop to `ActivityDots` — the month grid now passes it so offer dots sit left and the request dot sits hard right in the day cell; List view's three call sites are unchanged (no `spread`), matching WDW.

Excluded (later-phase scope): Product Tour hooks/`data-tour` attributes, special-event badges, Party Legend modal, `notifyComment` (Phase 4), `CountPill` (Phase 5).

Type-check, lint, and full build all clean. Could not exercise this live in-browser (same missing-test-credentials limitation as Phases 1–2) — verified by code inspection against WDW's working implementation.

---

### ✅ Phase 4 — Notifications (#12) — COMPLETE 2026-08-18

- [x] **#12 — Push on comment posted.** Ported `notifyComment` into `app/actions/notifications.ts` (right after `notifyInterest`) unchanged from WDW: pushes the post owner + everyone else who's commented (minus the commenter), push-only (no email, protects the Resend quota), caller must already have a comment on the post before triggering it (anti-abuse — this is a public server action). Wired into `CommentSection.tsx`'s `handleSubmit`: an interest-marking comment still calls `notifyInterest` only; a plain comment now also fires `notifyComment`, fire-and-forget, same pattern as the existing interest notification.

Was written on WDW *after* the S1 audit fix, so it's already auth-checked and reads content server-side rather than trusting the caller — ported with no security follow-up needed, unlike some of the original notification code.

Type-check, lint, and full build all clean. Could not exercise this live in-browser — same missing-test-credentials limitation as earlier phases, though this project does have a `.claude/skills/verify` skill that documents how to create a disposable confirmed test account for exactly this; it's restricted to explicit user invocation (`/verify`) and can't be run by me automatically.

---

### 🟡 Phase 5 — Admin panel (#16, #17, #18) — Overlord panel COMPLETE 2026-08-18, `/boards` visual overhaul deferred

- [x] **#16 — Board-less user detection.** Folded into the Users tab rewrite below (`board_count` per user, the "Boardless" filter + count, and the warning-dot on the Users tab icon). No schema change — reuses the existing `user_boards` query, tallied per-user as well as per-board now.
- [x] **#17 — Admin panel overhaul + board soft-delete (Overlord panel only — see deferred item below).** Final-state port of:
  - `boards.status` (active/paused/deleted) — `deleteBoard` (`app/actions/boards.ts`) now soft-deletes (`status='deleted', is_active=false`) instead of hard-deleting; `setBoardActive` (`app/actions/admin.ts`) keeps `status`/`is_active` in tandem for Pause/Resume. Verified this doesn't break `BoardsClient.tsx`'s existing delete handling — it just filters the board out of local state either way, hard or soft delete, so no client-side follow-up was needed there.
  - Sticky letter-sectioned Overlord tabs (Boards + Users) with an A–Z jump bar past 25 results, collapsible-but-sticky Filters, Inactive-user filter. New shared `components/features/AlphaJump.tsx` (letter grouping/sorting, jump bar, sticky filter helpers) and `components/ui/CountPill.tsx`.
  - Users tab: icon-based site-role display (Crown/UserRound/Ghost), board count doubling as the boards-accordion toggle, F L / L, F name-format toggle using the real `first_name`/`last_name` columns from Phase 1, ⋮ menu on mobile.
  - Boards tab: header now carries the same Invite/Rename/Delete controls as the real `/boards/[slug]` header, status icon (Active/Paused/Deleted), Pause/Resume in a ⋮ menu.
  - `CountPill` also applied retroactively to the Phase 3 claim/comment pills (`ClaimSection.tsx`, `CommentSection.tsx`) for the count-styling consistency this component exists for.
  - **Fork-divergence handling:** kept the *entire* Charts tab (Stripe membership/revenue breakdown — `MembershipIcon`, `MEMBERSHIP_OPTIONS`, `getMembershipKey`, `billing_cycle`) untouched and unexported-shape-compatible with `AdminCharts.tsx`, which imports from `AdminClient.tsx` directly. WDW has no equivalent (no Stripe), so this tab and its exports don't exist in WDW's version at all — merged by hand rather than copied. `createBoard` (self-serve board creation) also left completely untouched — WDW disables it entirely, MyShiftX's stays as its normal user-facing flow.
- [x] **#18 — Admin: assign user to board.** New `UserBoardsSection.tsx` on the admin Edit User form (add to board, change role, remove, transfer ownership, message) — ported as-is, no MyShiftX-specific changes needed. Two new server actions in `app/actions/boards.ts`: `adminAddUserToBoard`, `adminTransferBoardOwnership`, both service-role + `requireAdminAction`-gated. Wired through `users/[id]/page.tsx` (memberships + available-boards queries) and `UserEditClient.tsx`.

**🟡 Deliberately deferred — its own follow-up session:** the matching visual overhaul for `/boards` and `/boards/[slug]` (`BoardsClient.tsx`) — sticky per-board headers, member rows as a grid, role icons with a legend key, per-board search/sort/alpha-jump. This is a ~700-line near-total rewrite of that file, comparable in size to the Overlord panel rewrite itself, and touches member-facing pages rather than the admin surface — a distinct deliverable that didn't need to block shipping the Overlord panel overhaul. The underlying soft-delete behavior change is already live and doesn't depend on this UI catching up (confirmed above). Board-status icons/Pause-Resume/Delete are only visible via Overlord for now; a Leader managing their own board still sees the pre-overhaul `/boards` UI.

Type-check, lint, and full build all clean. Could not exercise this live in-browser — same missing-test-credentials limitation as earlier phases. This phase carried the most risk of any so far (Stripe/ads/self-serve-board fork divergence); the divergence points were all confirmed and handled deliberately rather than accidentally overwritten — see the fork-divergence note above.

**👤 You may want to be around for #17's rollout** — it's the largest visual change in this list and worth eyeballing on a preview deploy before it reaches real users, same as I'd recommend for any big admin-surface rewrite.

---

### 🟡 Phase 6 — Help page (#9, #10) — #9 COMPLETE 2026-08-18, #10 blocked on Phase 7

- [x] **#9 — Legend section.** New "Legend" section in `HelpClient.tsx`, right before FAQ (matching WDW's placement): shift-type color chips using the actual `badge-trade`/`badge-giveaway` CSS classes (not approximated colors — several themes override those exact class names for contrast), an icon row for Bundled/I Can Help/Comments/Message, and a Board roles row (Crown/Award/UserRound matching `BOARD_ROLE_LABEL`). Party-badges row skipped entirely, as planned — MyShiftX never took #4/#8 (Disney park special-event badges).
- [ ] **#10 — Tour launch cards.** Still blocked on #11 (Phase 7, the guided Product Tour) — WDW's version of this section requires `TOUR_CHAPTER_ORDER`/`TOUR_CHAPTERS`/`TOUR_ICONS`/`<ProductTour>`, none of which exist yet. Confirmed by reading WDW's actual file rather than assuming from the task list — this section sits immediately above Legend in WDW's source and is entirely tour-dependent. Will land as part of Phase 7 instead of here.

Type-check, lint, and full build all clean. Could not exercise this live in-browser — same missing-test-credentials limitation as earlier phases.

---

### Phase 7 — Guided Product Tour (#11) 🤖 — second-biggest lift

- [ ] **#11 — Four-chapter guided tour** (Wall, posting a shift, Calendar, Messages), built on `driver.js` (new dependency), themed from CSS custom properties so it follows every MyShiftX theme automatically. In-memory-only demo data (3 fake shifts, matching calendar entries, 2 fake conversations) merged into real lists for the tour's duration only — never touches the database, vanishes however the tour ends.

**Sequenced last among the feature work on purpose**: the tour's steps describe and interact with specific controls — the Wall filters (#1–3), the "I Can Help" pill (#5), Calendar coloring (#7). Porting the tour before those exist means writing steps that reference UI that isn't there yet, then rewriting them anyway once the rest lands. ~950 lines across 5 new files plus edits to Wall/Calendar/Messages/Help/Navbar/layout.

---

### Phase 8 — Weekly digest removal (#19) 🤖, ⚠️ optional

- [ ] **#19 — Remove weekly digest entirely**: cron route, unsubscribe route, email template, profile toggle, `notify_weekly_digest` column.

✅ **Confirmed 2026-08-17** — not a send-cap concern, you just never liked the feature. Deliberate removal, not a copy-paste default.

---

### 📋 Suggested order

1. **Phase 1** (database) — nothing else can safely start until #15's grants exist, if you're taking #16–18
2. **Phase 2** (Wall filters) — self-contained, good place to start actual feature work
3. **Phase 3** (Wall/card polish) — quick wins, low risk
4. **Phase 4** (comment push) — self-contained
5. **Phase 5** (admin overhaul) — do this in its own focused session; highest conflict risk
6. **Phase 6** (Help) — after 2, 3, and 5 so the Legend matches reality
7. **Phase 7** (tour) — last, so it can reference the finished Wall/Calendar
8. **Phase 8** (digest removal) — whenever, independent of everything above

### 📋 Status

**Both open questions resolved 2026-08-17 — all 17 items are go, no blockers remaining.**

### ✅ Phase 1 — COMPLETE 2026-08-18

**⚠️ Found and fixed a real problem before this phase could even start:** the database already had `first_name`/`last_name` columns and a partially-updated signup trigger — leftover from earlier groundwork that never got finished or committed to git. Two consequences of that unfinished state, both fixed here:

1. **The `@disney.com` signup block had been silently dropped** from the live trigger somewhere in that unfinished work. Restored — `@disney.com` addresses are blocked again.
2. **The database had no read permission on the new columns at all** (the exact "new column needs its own grant" trap this app has hit before) — any query touching `first_name`, `last_name`, or `boards.status` would have failed outright the moment code tried to use them. Fixed.

Also caught before it became real damage: my first backfill attempt derived `first_name`/`last_name` by splitting `display_name`, but every existing user's `display_name` was still in the OLD "First L." format — so the split produced garbage last names (just the initial + a period, e.g. `last_name = "B."`). Caught by a dry-run `SELECT` before committing to it, corrected by pulling real names from `auth.users` metadata instead (same source WDW's own manual backfill script used) — **16 of 17 users now have their real full name**, verified row-by-row. The 17th genuinely has no recoverable name anywhere (no OAuth metadata at all) and was deliberately left untouched rather than overwritten with a guess.

**👤 One thing for you to know, not fix:** three accounts won't pass the new full-name format validation until their owner next edits their profile name — your two personal test accounts (`Matt "Ace" Baugh` / `Matt "Ace" Baugh`, quote characters aren't in the allowed set) and `lucas.hayes@myshiftx.com` (no recoverable name, still shows "Lucas H."). This is expected — the app doesn't retroactively reject existing data, it just won't accept a *save* that doesn't match the new format. I didn't touch anyone's account name without asking; fix at your convenience or leave as-is.

- [x] #15 — columns, grants, backfill (corrected), `get_users_admin()` widened
- [x] #13 — full "First Last" format live in the trigger, regex, OAuth callback
- [x] #14 — copy updated: profile placeholder/helper/error text, register preview, admin edit-user placeholder

Migrations: `20260818000000_finish_first_last_and_board_status.sql`, `20260818001000_backfill_names_from_auth_metadata.sql`. `lib/database.types.ts` updated to match (new `BoardStatus` type, `first_name`/`last_name` on the users table, widened `get_users_admin` return shape). Type-check, lint, and full build all clean.

**Not done as part of Phase 1** (correctly deferred to Phase 5, which owns `boards.status`): no application code reads or writes `boards.status` yet — the column and its grant exist and are ready for Phase 5 to build on.

---

## Ongoing / Maintenance

| Task | Who | Notes |
|------|-----|-------|
| Cross-browser testing (Safari, Chrome, Firefox, Edge) | 👤 You | Especially test on iOS Safari — it has the most quirks |
| Security audit (RLS policies, input sanitization) | 🤖 Claude | Run `/code-review ultra` on the branch when you're ready |
| Accessibility audit (WCAG 2.1 AA) | 🤖 Claude | Can audit and fix after core features are stable |
| Rate limiting on post/flag endpoints | 🤖 Claude | Add after real users are on the platform |
| User acceptance testing with a pilot group | 👤 You | Pick 5–10 coworkers to test before wider rollout |
| Dependency vulnerabilities (`npm audit`, 2026-07-22) | 🤖 Claude | 20 findings, none in shipped runtime code. Safe now via `npm audit fix` (non-breaking): `picomatch` (high, ReDoS in glob matching — jest/chokidar dev-time only), `yaml` (moderate, stack overflow on deep nesting). Needs a breaking bump + regression testing later: Next.js 14→16 (fixes a `postcss` XSS chain), Supabase CLI bump (fixes a critical `tar` path-traversal chain, dev-tooling only, not shipped). Same lockfile as WDWShiftX — fix once, apply to both. |

---

## Deferred / Dropped

| Item | Reason |
|------|--------|
| Proficiency system (Property → Location → Role hierarchy) | Replaced by the Boards system — boards serve this purpose more flexibly |
| Multi-language support (Spanish) | Good idea, defer until user base justifies it |
| PWA offline capability | Nice-to-have, not needed for core use |
| Analytics dashboard for Leaders | Defer until post-launch |
| Automated DB backups | Supabase handles this automatically on paid plans |
| Unit tests | Defer until the feature set stabilizes |
| Facebook OAuth | Lower priority for this audience; add if users request it |
