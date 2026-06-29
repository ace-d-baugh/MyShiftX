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
  - Add price: **$5.99 / month** (recurring, monthly) "Pro Monthly" Badge: None (or "Best for Flexibility")
  - Add price: **$31.99 / 6 months** (recurring, every 6 months) "Pro Semi-Annual" Badge: SAVE 10% "Billed every 6 months. Saves you $4."
  - Add price: **$53.99 / year** (recurring, yearly) "Pro Annual" Badge: BEST VALUE or 3 MONTHS FREE "Billed annually. Saves you $18 compared to monthly."
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

**Structure:** The LLC is **Digital Elegance LLC** (parent company). MyShiftX operates as a registered **DBA (fictitious name)**. All revenue, contracts, and bank accounts go under Digital Elegance LLC d/b/a MyShiftX. This is Florida-based — steps and links reflect Florida law.

Complete in order — each step unlocks the next.

---

#### 👤 Formation (do these first, in order) — one-time cost ~$175

- [ ] **1. Get your EIN** — free, instant at **irs.gov** → Apply for EIN Online. Do this before anything else; you need it for the bank account. Takes 5 minutes.
- [ ] **2. File LLC Articles of Organization** — **sunbiz.org** → File Online → LLC Articles. Fee: **$100** + $25 registered agent. Processing: 2–3 business days online. Keep the stamped copy.
  - Registered agent: you can serve as your own agent using your Florida business address — free. No need to pay a registered agent service.
- [ ] **3. File MyShiftX fictitious name (DBA)** — **sunbiz.org** → File Online → Fictitious Name. Fee: **$50**. Renew every 5 years. File simultaneously with or right after the Articles.
- [ ] **4. Open a dedicated business bank account** — **Mercury** (mercury.com) or **Relay** recommended — both are free, online-first, and built for small businesses. Do NOT use a personal account. Mixing funds can pierce the LLC's liability protection.
- [ ] **5. Draft an Operating Agreement** — not required in FL but strongly recommended. AI-drafted is sufficient at launch. Have an attorney review once revenue is consistent. Defines ownership, decision-making, and what happens if you bring in a partner.

---

#### 👤 IP & Legal — one-time cost ~$421

- [ ] **6. Post Privacy Policy, Terms of Service & DMCA notice** — required before launch. Claude drafts these (see below). Flag for attorney review once shift-trading employment nuances matter (FL + Disney are non-trivial). Cost: $0 if AI-drafted.
- [ ] **7. Register DMCA designated agent** — **dmca.copyright.gov** → Register. Fee: **$6 / 3 years**. Post the DMCA policy page on the site at the same time. Copyright Office emails a renewal reminder before expiration.
- [ ] **8. Register Twilio 10DLC brand + campaign** — required by carriers to send A2P SMS (the Pro-tier match notifications). In Twilio Console: **Messaging → Regulatory → 10DLC**. Cost: **~$16 one-time** (~$4.50 brand registration + ~$11.50 campaign vetting). Do this before launching SMS features.
- [ ] **9. File USPTO trademark — MyShiftX (Class 42)** — **USPTO Trademark Center** → TEAS Plus. **Class 42** = Software as a Service. Fee: **$350**. Use the ID Manual dropdown to select the exact description — this avoids the $200 surcharge for non-standard descriptions. Processing: 8–14 months, but protection dates back to your filing date. Can file after launch.
- [ ] **10. Register copyright — MyShiftX code & UI** — **copyright.gov** → Register → Online Registration. Fee: **~$65**. File as a "collection" — covers all original code, email templates, and UI copy in one filing. Can file after launch.

---

#### 🤖 Claude handles — Legal Documents

- [ ] Draft **Terms of Service**, **Privacy Policy**, **Refund & Cancellation Policy**, and **Cookie Policy** pages — rendered in the app at `/terms`, `/privacy`, etc. and linked from the footer. *(Flag for attorney review before charging real money.)*
- [ ] Add a **cookie consent banner** — required for GDPR/CCPA compliance once Google AdSense is live. Appears on first visit, stores accept/reject preference.

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
