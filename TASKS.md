# MyShiftX — Task Board

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

### 4 — SMS Notifications *(Revived — now a Pro-tier feature)*

SMS is now part of the Pro subscription. See **Task 11** for the full implementation plan.

---

### 5 — OAuth Login (Google + Facebook + LinkedIn) `IN PROGRESS`

**🤖 Claude handled:**
- ✅ `OAuthButtons` component — branded Google, Facebook, LinkedIn buttons with SVG icons
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

#### Facebook
- ✅ Go to **developers.facebook.com** → My Apps → **Create App**
  - Use case: **Authenticate and request data from users** → Next
  - App name: `MyShiftX` → Create app
- ✅ On the app dashboard: Add product → **Facebook Login** → **Web**
  - Site URL: `https://myshiftx.com` → Save
- [ ] Left sidebar: Facebook Login → **Settings**
  - Valid OAuth Redirect URIs → Add: `https://<your-supabase-ref>.supabase.co/auth/v1/callback` → Save
- [ ] Left sidebar: **App Settings → Basic** → copy **App ID** and **App Secret**
- [ ] Supabase Dashboard → **Authentication → Providers → Facebook** → Enable → paste both → Save
- [ ] To test in Development mode: **App Roles → Roles → Add Testers** → add your personal Facebook account
- [ ] When ready for public users: complete **App Review** and switch Mode from Development to **Live**
- [ ] Test: click Facebook on the login page

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

### Feature Tier Reference 🗂️

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
| In-app messaging with anyone in the same board | 🆕 |
| In-app push notifications (web push / PWA) | 🆕 |
| 4 photo schedule imports per month (OCR → auto-creates shifts) | 🆕 |
| Ads displayed (right sidebar on desktop, static at bottom of screen on mobile) | 🔲 Task 12 |

#### ⭐ Pro — $4.99/mo · $26.99/6 mo · $47.99/year

| Feature | Status |
|---|---|
| Everything in Free | — |
| **Ad-free experience** | 🔲 Task 10 |
| **SMS notifications** for shift matches (up to 30/mo) | 🔲 Task 11 |
| **Unlimited photo schedule imports** | 🆕 |
| **Calendar export & sync** (Google Calendar, Apple iCal) | ✅ |
| **Trade preferences** — set preferred shift types, time of day, etc. for smarter matching | 🆕 |
| **Bulk shift import** — CSV upload or multi-week photo scan | 🆕 |

#### 🆕 New features not yet in the roadmap

The following Pro and Free features have not been scoped yet and will need dedicated tasks before launch or shortly after:

- **Photo schedule import (OCR)** — user photographs their paper or on-screen schedule; OCR reads it and populates shifts automatically. This is the highest-value Free feature and the biggest differentiator from manual entry. Needs an OCR service (Google Vision API or similar) + a shift-parsing pipeline. High complexity — scope separately.
- **In-app messaging** — replaces the current email mailto: contact button with a real in-app thread between two users. Needs a `messages` table, read receipts, and a message UI. High complexity — scope separately.
- **In-app push notifications** — browser-native web push (PWA-style) using the Push API and a service worker. Free tier. Works on desktop Chrome/Edge/Firefox and Android Chrome. Not available on iOS Safari (they have limited support). Supplements or replaces email for non-SMS users. Medium complexity.
- ~~**Calendar export/sync**~~ — ✅ Done (Task 17): live-sync iCal feed URL + one-click `.ics` download, works with Google Calendar, Apple Calendar, and Outlook. Pro only.
- **Trade preferences** — users set preferred shift types, days of week, and time windows; the matching engine factors these in when firing notifications. Extends the existing `notifyShiftPosted`/`notifyRequestPosted` logic. Medium complexity.
- ~~**Direct messaging outside boards**~~ — Removed. Messaging is board-member only for all tiers.
- **Bulk shift import (CSV / multi-week photo)** — upload a CSV of shifts or scan multiple weeks of a schedule at once. Pro only. Extends the photo OCR feature above.

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

### 7 — Stripe Integration & Checkout `NEXT`

**Why now:** The database schema is live; now wire up real payments before building the sales page around it.

**👤 You handle (do these first):**
- [ ] Create a Stripe account at **stripe.com** (use your business email)
- [ ] In Stripe Dashboard → **Products** → **Add product**: `MyShiftX Pro`
  - Add price: **$4.99 / month** (recurring, monthly) "Pro Monthly" Badge: None (or "Best for Flexibility")
  - Add price: **$26.99 / 6 months** (recurring, every 6 months) "Pro Semi-Annual" Badge: SAVE 10% "Billed every 6 months. Saves you $3."
  - Add price: **$47.99 / year** (recurring, yearly) "Pro Annual" Badge: SAVE 20% BEST VALUE or 2 MONTHS FREE "Billed annually. Saves you $12 compared to monthly."
  - Note the **Price IDs** for each (format: `price_xxxxx`) — Claude needs these
- [ ] In Stripe Dashboard → **Products** → **Add product**: `MyShiftX Pro Trial`
  - Add price: **$0.00** (one-time or 14-day free trial on the monthly price — your call on duration)
- [ ] Stripe Dashboard → **Developers → API Keys** → copy **Publishable Key** and **Secret Key**
- [ ] Add to Vercel environment variables:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET` *(generate after Claude sets up the webhook endpoint)*
- [ ] Stripe Dashboard → **Developers → Webhooks** → **Add endpoint**:
  - URL: `https://myshiftx.com/api/webhooks/stripe`
  - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
  - Copy the **Signing Secret** → add as `STRIPE_WEBHOOK_SECRET` in Vercel

**🤖 Claude handles:**
- [ ] Install `stripe` npm package
- [ ] Create `/api/checkout/route.ts` — creates a Stripe Checkout Session for a given Price ID, attaches the user's ID in metadata
- [ ] Create `/api/webhooks/stripe/route.ts` — verifies Stripe signature, handles events:
  - `checkout.session.completed` → set `membership = 'Pro'`, clear `trial_ends_at`
  - `customer.subscription.updated` → sync status changes (e.g., paused, unpaid)
  - `customer.subscription.deleted` → set `membership = 'Basic'`
  - `invoice.payment_failed` → optionally send a warning email via Resend
- [ ] Create `/api/customer-portal/route.ts` — redirects authenticated users to Stripe's hosted Customer Portal (manage billing, cancel, download invoices)
- [ ] Store `stripe_customer_id` on the user record so future webhook events can be matched back to the correct user
- [ ] Add `stripe_customer_id` and `stripe_subscription_id` columns to users table

**👤 You handle (after Claude ships the code):**
- [ ] Use **Stripe CLI** (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) to test webhooks locally
- [ ] Run a test purchase with Stripe's test card `4242 4242 4242 4242` and confirm `membership` flips to `'Pro'` in the DB
- [ ] Test cancellation flow via Customer Portal — confirm `membership` flips back to `'Basic'`
- [ ] Test failed payment via test card `4000 0000 0000 9995` — confirm warning email arrives

---

### 8 — Subscription Sales / Upgrade Page `NEXT`

**Why now:** Users need a destination to convert. Build this alongside Stripe so the checkout button has somewhere to go.

**🤖 Claude handles:**
- [ ] Create `/upgrade` page — full sales funnel with:
  - **Hero section**: headline targeting the pain ("Stop refreshing. Start swapping."), subheadline, and primary CTA button
  - **Pain points section**: 3–4 cards calling out frustrations of the free experience (missing shifts, constant manual checking, information overload)
  - **Feature comparison table**: Basic vs Pro side-by-side — use the Feature Tier Reference table above for the exact feature list and copy
  - **Pricing toggle**: Monthly / 6-Month / Yearly — active state shows selected price with savings badge on 6-mo and yearly
  - **Trial callout**: "Try Pro free for 14 days — no credit card required" (if offering a trial)
  - **FAQ accordion**: common cancellation, billing, and upgrade questions
  - **Footer CTA**: repeat the primary CTA
- [ ] Wire each "Choose Pro" / "Start Free Trial" button to `/api/checkout` with the correct Price ID
- [ ] Add "Upgrade to Pro" link in the nav/account menu for Basic users
- [ ] Add an upgrade nudge banner on the Wall for Basic users (dismissible, shown once per session)
- [ ] Post-purchase: redirect to a `/upgrade/success` confirmation page

**👤 You handle:**
- [ ] Review the copy Claude writes — adjust any phrasing to match your voice
- [ ] Approve the design before Claude calls it done
- [ ] Decide trial length: 7 days, 14 days, or 30 days
- [ ] Decide whether trial requires a credit card upfront (Stripe supports both options)

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

### 10 — Feature Gating (Pro vs Basic) `NEXT`

**Why now:** The membership column exists and Stripe is wired up — now enforce the tiers in the app.

**🤖 Claude handles:**
- [ ] Create a `useMembership()` hook (or server-side helper) that reads `membership` from the user session — returns `'Basic'` | `'Pro'` | `'Trial'`
- [ ] **Shift match notifications**: wrap `notifyShiftPosted()` and `notifyRequestPosted()` in a membership check — only fire email/SMS for users whose `membership` is `'Pro'` or `'Trial'`
- [ ] **Wall auto-refresh (Realtime)**: gate the Supabase Realtime subscription behind Pro/Trial — Basic users see a "New posts available — Refresh to see them" banner instead of live updates
- [ ] **Ad suppression**: Pro/Trial users get a `no-ads` flag passed down to the Wall; Basic users see ad slots (see Task 12)
- [ ] **Trial expiration gate**: on each page load, check if `membership === 'Trial'` and `trial_ends_at < now()` server-side — if so, demote to `'Basic'` and show a "Your trial has ended" modal with an upgrade CTA
- [ ] **Trial eligibility check**: before starting a trial, verify `trial_used = false` for the user's email — show "You've already used your free trial" message if ineligible
- [ ] Show membership badge (Basic / Pro / Trial + days remaining) on the Profile / Account page

**👤 You handle:**
- [ ] Test each gated feature as a Basic user (create a second test account)
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

### 12 — Ad System (Placeholders + Google AdSense) `IN PROGRESS`

**Why last:** Ads are a Basic-tier experience. Get subscriptions shipping first; then monetize the free tier.

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

**👤 You handle:**
- ✅ Publisher ID confirmed: `ca-pub-4865817496577079` (added to `.env.local`; **still needs adding to Vercel env vars** for production)
- ✅ Sign up for **Google AdSense** at **adsense.google.com** if not already approved (requires a live site with content)
- [ ] **Create the actual consent message** in AdSense → Privacy & messaging → choose the 3-choice GDPR message type, target EEA + UK + Switzerland, publish it (this is a hosted wizard in your Google account — nothing to hand to Claude for this part, the code integration is already live and will pick up whatever message you publish)
- [ ] Once approved: create an ad unit per placement in the AdSense dashboard and give Claude each `data-ad-slot` ID to wire into the corresponding `<AdSlot>` usage
- [ ] Review the placeholder layout — confirm sizing/placement (300×600 desktop rail, mobile bar above the bottom nav) feels right before real ad units go live
- [ ] Google flagged crawl trouble — check whether **Vercel Deployment Protection** is enabled on the production domain (would block Googlebot entirely); also note that Wall/Calendar/Profile/etc. are behind login so Google can never crawl the actual ad-bearing pages, only the public marketing/legal pages

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
| Domains (myshiftx + digitalelegance) | $3/mo | ~$15–$20/yr each, amortized |
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

### 15 — Photo Schedule Import (Local LLM on VPS) `POST-LAUNCH`

**Tier:** Free = 4 imports/month · Pro = unlimited
**Why it matters:** The single biggest UX unlock for Cast Members. Instead of manually entering each shift, they photograph their paper or screen schedule and MyShiftX reads it automatically.

**Architecture overview:**
```
Browser → /api/schedule-import (Next.js) → Ollama on VPS → parsed JSON → confirmation UI → Supabase
```

The VPS runs Ollama with a multimodal model locally. Next.js calls the VPS over HTTP with the image. The VPS never stores images — processes and discards.

---

**👤 You handle — VPS setup (one-time):**
- ✅ **Check VPS RAM** — multimodal LLM models require at minimum 4 GB RAM to run a quantized model; 8 GB is comfortable. Check your RackNerd plan specs and upgrade if needed (~$20–$25/mo for 4 GB tier). Have 4.5 GB
- [ ] **Install Ollama** on the VPS:
  ```bash
  curl -fsSL https://ollama.com/install.sh | sh
  ```
- [ ] **Pull a multimodal model** — recommended options (pick one):
  - `ollama pull llava` — 7B, good accuracy, ~4 GB RAM
  - `ollama pull llama3.2-vision` — Meta's official vision model, excellent accuracy, ~8 GB RAM
  - `ollama pull moondream` — very small (1.8B), ~2 GB RAM, less accurate but works on low-RAM VPS
- [ ] **Expose Ollama securely** — by default Ollama listens on `localhost:11434`. For Next.js on Vercel to reach it, either:
  - Option A (recommended): Add a **Nginx reverse proxy** on the VPS at a path like `/ollama/` with HTTP Basic Auth or a secret header check, then expose via HTTPS using your existing SSL cert on the VPS
  - Option B: Open port 11434 in the VPS firewall and protect with a secret key checked in the Next.js API route
- [ ] **Add `VPS_OLLAMA_URL` and `VPS_OLLAMA_SECRET` to Vercel environment variables** (e.g., `https://vps.digitalelegance.com/ollama` + a long random secret)

**🤖 Claude handles:**
- [ ] Add `schedule_import_count` (integer, default 0) and `import_count_reset_date` (timestamptz) columns to `users` table — reset to 0 on the 1st of each month (same pattern as SMS counter)
- [ ] Create `/api/schedule-import/route.ts`:
  - Verify auth and check quota (Basic: ≤4, Pro: unlimited)
  - Accept image upload (multipart form data)
  - Send base64 image + structured prompt to Ollama endpoint on VPS
  - Parse Ollama's JSON response into an array of `{ date, start_time, end_time, title }`
  - Increment `schedule_import_count`
  - Return parsed shifts to client for review
- [ ] **Prompt engineering** — the prompt sent to Ollama is critical for accuracy:
  ```
  "You are reading a work schedule. Extract every shift shown.
   Return ONLY a JSON array with no other text:
   [{ "date": "YYYY-MM-DD", "start_time": "HH:MM", "end_time": "HH:MM", "title": "Shift title or role" }]
   If a date shows no year, assume the nearest upcoming occurrence.
   If a time is missing, omit that shift. Return [] if no shifts found."
  ```
- [ ] Create `ScheduleImportModal` client component:
  - Camera/file upload button (accepts image/*)
  - Loading state while VPS processes ("Reading your schedule…")
  - Review table: each parsed shift shown with editable fields (date, start, end, title, board selector)
  - "Add to Calendar" confirms and bulk-inserts approved shifts
  - Shows remaining imports this month for Basic users
- [ ] Add import button to the Calendar page and the "+" Post menu
- [ ] Add monthly import counter reset to the existing nightly cron (`/api/cron/expirations`)

---

### 16 — In-App Push Notifications (Web Push) `CODE COMPLETE — needs Vercel env vars`

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
- [ ] Your feed token is already generated — open Profile → Calendar Sync for the URL. Test the subscription flow in Google Calendar (Other calendars → From URL) and Apple Calendar
- [ ] Heads-up for testing: Google refreshes subscribed feeds on its own schedule (often 6–24 h), so don't judge sync speed by it — Apple Calendar lets you pick the refresh interval

---

### 18 — Trade Preferences (Smart Matching) `WITH PRO LAUNCH`

**Tier:** Pro only
**Why:** Extends the shift matching system so Pro users only get notified for shifts that actually fit their preferences — reducing notification fatigue.

**🤖 Claude handles:**
- [ ] Add `trade_preferences` JSONB column to `users` (nullable):
  ```json
  {
    "preferred_types": ["trade", "giveaway"],
    "preferred_times": ["morning", "afternoon"],
    "preferred_days": [1, 2, 3, 4, 5]
  }
  ```
- [ ] Add Trade Preferences section to Profile → Notifications for Pro users:
  - Preferred shift types (Trade / Giveaway / Either)
  - Preferred time of day (Morning / Afternoon / Evening / Late Night / Any)
  - Preferred days of week (multi-select Mon–Sun)
- [ ] Update `notifyShiftPosted()` and `notifyRequestPosted()` — before sending match notifications, check if the recipient has trade preferences set and whether the shift/request satisfies them. If preferences are set and the match doesn't fit, skip the notification.

---

### 19 — In-App Messaging (Within Boards — All Tiers) `WITH PRO LAUNCH`

**Tier:** Free and Pro — available to all users, within shared boards only. Direct messaging outside of boards is not permitted.
**Why:** Replaces the current email mailto: contact button with a real in-app conversation thread. Keeps communication on the platform and creates network stickiness.

**Database:**
```sql
CREATE TABLE conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE conversation_participants (
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  last_read_at    timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid REFERENCES users(id),
  body            text NOT NULL CHECK (char_length(body) <= 1000),
  created_at      timestamptz DEFAULT now()
);
```

**🤖 Claude handles:**
- [ ] Create the tables above with RLS: participants can only read conversations they belong to; only the sender can insert their own messages
- [ ] Create real-time message subscription using Supabase Realtime on the `messages` table
- [ ] Build `/messages` page — conversation list with unread count badges, sorted by most recent
- [ ] Build `/messages/[conversationId]` page — scrollable thread with send box (max 1000 chars)
- [ ] Add unread message badge to Navbar (next to existing notification indicators)
- [ ] Replace the "Contact" email button on ShiftCards with a "Message" button that opens or creates a conversation thread
- [ ] Before creating a conversation, verify both users share at least one approved board (query `user_boards` for overlap). If not, block with "You can only message members of your boards."
- [ ] Add push notification trigger when a new message arrives

---

### 20 — Bulk Shift Import (CSV + Multi-Week Photo) `YEAR 1 POST-LAUNCH`

**Tier:** Pro only — extends Task 15 (Photo Import)
**Why:** Power users with multi-week schedules don't want to import one photo at a time. CSV gives IT-minded users a clean path; multi-photo handles paper schedules.

**🤖 Claude handles:**

**CSV import:**
- [ ] Create a CSV template for download: `date, start_time, end_time, title, type`
- [ ] Build CSV upload UI — parse client-side with PapaParse, show preview table, validate each row (past dates, valid times, required fields), then bulk-insert approved rows
- [ ] Handle errors gracefully: flag individual bad rows and let user fix or skip before importing

**Multi-week photo import:**
- [ ] Allow uploading up to 4 photos in a single import session (one per schedule week)
- [ ] Batch the images to Ollama sequentially — collect all returned shifts, deduplicate by date, then show a unified review table
- [ ] Add a "This is a multi-week schedule" toggle to the import modal (Task 15) that enables multi-photo mode for Pro users

---

## Ongoing / Maintenance

| Task | Who | Notes |
|------|-----|-------|
| Cross-browser testing (Safari, Chrome, Firefox, Edge) | 👤 You | Especially test on iOS Safari — it has the most quirks |
| Security audit (RLS policies, input sanitization) | 🤖 Claude | Run `/code-review ultra` on the branch when you're ready |
| Accessibility audit (WCAG 2.1 AA) | 🤖 Claude | Can audit and fix after core features are stable |
| Rate limiting on post/flag endpoints | 🤖 Claude | Add after real users are on the platform |
| User acceptance testing with a pilot group | 👤 You | Pick 5–10 coworkers to test before wider rollout |

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
