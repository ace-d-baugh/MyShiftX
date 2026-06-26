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

### 6 — Membership Schema (Database) `NEXT`

**Why first:** Everything else — Stripe, feature gating, ads — depends on knowing a user's membership tier.

**🤖 Claude handles:**
- [ ] Add `membership` column (`text`, default `'Basic'`, values: `'Basic'` | `'Pro'` | `'Trial'`) to the `users` table migration
- [ ] Add `trial_ends_at` column (`timestamptz`, nullable) — set when a Trial starts, checked on each login/request
- [ ] Add `trial_used` column (`boolean`, default `false`) — prevents a second trial on the same account even if they cancel and re-register (tracked by email)
- [ ] Update TypeScript types (regenerate from Supabase or update `types/supabase.ts` manually)
- [ ] Write a Supabase cron/Edge Function that runs nightly to flip `membership` from `'Trial'` to `'Basic'` when `trial_ends_at` has passed
- [ ] Update RLS policies: `membership` is readable by the owner only; writable only by service role (Stripe webhook)

**👤 You handle:**
- [ ] In Supabase dashboard → **Table Editor → users** → run the migration SQL that Claude provides (or use **SQL Editor**)
- [ ] Confirm columns appear correctly in the dashboard
- [ ] Enable the scheduled Edge Function (if using Supabase cron)

---

### 7 — Stripe Integration & Checkout `NEXT`

**Why now:** The database schema is live; now wire up real payments before building the sales page around it.

**👤 You handle (do these first):**
- [ ] Create a Stripe account at **stripe.com** (use your business email)
- [ ] In Stripe Dashboard → **Products** → **Add product**: `MyShiftX Pro`
  - Add price: **$5.99 / month** (recurring, monthly)
  - Add price: **$30.00 / 6 months** (recurring, every 6 months)
  - Add price: **$50.00 / year** (recurring, yearly)
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
  - **Feature comparison table**: Basic vs Pro side-by-side with checkmarks/Xs for each feature
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

### 12 — Ad System (Placeholders + Google AdSense) `FUTURE`

**Why last:** Ads are a Basic-tier experience. Get subscriptions shipping first; then monetize the free tier.

**🤖 Claude handles:**
- [ ] Create `<AdSlot>` component — renders a styled placeholder box (grey dashed border, "Advertisement" label) when AdSense is not yet configured; swaps to the AdSense `<ins>` tag once the client code is available
- [ ] **Large screen layout** (tablet landscape + desktop, ≥ 1024 px): add a right-side column to the Wall layout — fixed-width (`~300 px`), sticky — that holds one or more `<AdSlot>` components alongside the shift/request cards
- [ ] **Small screen layout** (< 1024 px): inject an `<AdSlot>` as a full-width card after every 5th post in the Wall list
- [ ] Suppress all `<AdSlot>` renders when `membership === 'Pro'` or `'Trial'` (no ads ever for Pro users)
- [ ] Wire the AdSense publisher ID and slot IDs from environment variables so they can be swapped in without a code change

**👤 You handle:**
- [ ] Sign up for **Google AdSense** at **adsense.google.com** (requires a live site with content — apply after launch)
- [ ] Once approved: copy your **Publisher ID** (`ca-pub-xxxxxxxxxxxxxxxx`) and create ad units in the AdSense dashboard
- [ ] Add to Vercel environment variables: `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` and slot IDs for each ad unit size
- [ ] Review the placeholder layout Claude builds — confirm sizing and placement feel right before going live with real ads

### 13 — Business Entity & Legal Protection `PARALLEL`

**When to do this:** Start this now — it runs parallel to the technical work. You want the LLC in place before you take any real money. None of these steps require Claude; all are 👤 You handle. Consult a business attorney or CPA for advice specific to your situation.

**👤 You handle — Formation:**
- [ ] **Pick a state to form in** — most solo founders forming in their home state is simplest and cheapest. Delaware/Wyoming are popular for outside investment but add a foreign-registration fee if you live elsewhere. Decide before filing.
- [ ] **Check name availability** — search your state's Secretary of State business name database for "MyShiftX LLC." Also check **USPTO TESS** (trademarks) and confirm the domain and social handles are yours.
- [ ] **Appoint a Registered Agent** — required by every state. Options: yourself (if you're comfortable listing your address publicly), a local attorney, or a service like **Northwest Registered Agent** (~$125/yr) or **Registered Agents Inc.**
- [ ] **File Articles of Organization** — submit through your state's Secretary of State website. Fee is typically $50–$200 depending on state. Processing can be same-day (online) or a few weeks (by mail). Keep the stamped copy.
- [ ] **Draft an Operating Agreement** — not always legally required, but strongly recommended. Defines ownership, how decisions are made, and what happens if you bring on a partner. Many states have free templates; LegalZoom or a local attorney can formalize it.
- [ ] **Get an EIN** — free from the IRS at **irs.gov/EIN** (takes 5 minutes online). You'll need this to open a business bank account and eventually pay taxes as a business.
- [ ] **Open a dedicated business bank account** — keep all revenue (Stripe payouts) and business expenses completely separate from personal accounts. Mixing funds can pierce the LLC's liability protection. Most major banks or online banks (Mercury, Relay) work well for this.

**👤 You handle — Intellectual Property:**
- [ ] **Federal trademark — name** — file an application with the **USPTO** (uspto.gov → TEAS) for "MyShiftX" in Class 38 (telecommunications/communications services) and/or Class 42 (software as a service). Filing fee ~$250–$350 per class. Processing takes 8–14 months but protection dates back to your filing date.
- [ ] **Federal trademark — logo** — file a separate application for the logo/mark if distinct from the name. Same process.
- [ ] **Copyright your original content** — the code and unique creative content (email templates, custom copy) are automatically copyrighted to you upon creation, but registering with the **US Copyright Office** (copyright.gov) for ~$65 strengthens enforcement options.
- [ ] **Register a DMCA agent** — required under the DMCA safe harbor. Register at **dmca.copyright.gov** (~$6/3 years). Add a DMCA notice to your Terms of Service and designate an email (e.g., `dmca@myshiftx.com`) for takedown requests.

**👤 You handle — Legal Documents on the Site:**
- [ ] **Terms of Service** — covers acceptable use, account termination, limitation of liability, dispute resolution. Claude can draft a starting point; have an attorney review before launch.
- [ ] **Privacy Policy** — required by law if you collect any personal data (you do). Must cover what you collect, how you use it, how users can delete it, and third-party sharing (Stripe, Resend, Twilio, Google AdSense). Must comply with CCPA (California) at minimum. Claude can draft; attorney review recommended.
- [ ] **Refund / Cancellation Policy** — required for Stripe. Spell out your policy: e.g., cancel anytime, no prorated refunds, trial terms.
- [ ] **Cookie Policy** — required under GDPR/CCPA if you serve EU users or California residents (Google AdSense will set cookies). Can be combined with the Privacy Policy.
- [ ] **Add legal page links to the footer** — Terms, Privacy, Refund/Cancellation, Cookie Policy, DMCA.

**🤖 Claude handles:**
- [ ] Draft initial **Terms of Service**, **Privacy Policy**, **Refund Policy**, and **Cookie Policy** pages for your review — these go in `/app/legal/` and link from the footer. *(Flag for attorney review before going live.)*
- [ ] Add a **cookie consent banner** (for GDPR compliance) that appears on first visit, accepts/rejects non-essential cookies, and stores the preference — required once Google AdSense is live

**👤 You handle — Ongoing Compliance:**
- [ ] **File annual reports** — most states require an annual report + fee to keep the LLC in good standing. Calendar a reminder for your state's due date.
- [ ] **Pay estimated quarterly taxes** — as a sole-member LLC your income passes through to your personal return. Set aside ~25–30% of net revenue and pay quarterly estimated taxes to the IRS (Form 1040-ES) to avoid penalties.
- [ ] **Consider S-Corp election** — once the business is profitably generating consistent income (rough threshold: ~$40k+ net/year), an S-Corp election can reduce self-employment tax. Talk to a CPA when you get there.
- [ ] **Business insurance** — consider a **General Liability** policy and a **Technology E&O (Errors & Omissions)** policy. Hiscox, Next Insurance, and CoverWallet offer online quotes for small SaaS businesses.

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
| Facebook / LinkedIn OAuth | Lower priority for this audience; add if users request it |
