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

### 2 — Interest Notification Email `HIGH`

**Why second:** When someone marks interest on your shift, you currently have no idea unless you manually check. This closes the most critical communication loop in the app.

**🤖 Claude handles:**
- [ ] Add a server action (or extend `posts.ts`) that fires when a comment with `is_interested = true` is created
- [ ] Look up the shift/request owner's email and their `notify_via_email` preference
- [ ] Call `/api/send` with a pre-built "Someone is interested in your shift" email using the existing email template helper
- [ ] Write the email template variant for interest notifications (person's name, post title, link to the wall)

**👤 You handle:**
- [ ] Confirm `RESEND_API_KEY` is set in your Vercel environment variables (Dashboard → Settings → Environment Variables)
- [ ] Confirm your sending domain (`noreply@myshiftx.com`) is verified in Resend (Resend Dashboard → Domains)
- [ ] Test by marking interest on one of your own posts from a second account and checking the inbox

---

### 3 — Shift Match Notifications `HIGH`

**Why third:** Users post requests saying "I need a shift on Thursday evening." When a matching shift offer is posted, they should be told immediately. This is a core promise of the app.

**Dependencies:** Task 2 must be done first (email infra confirmed working).

**🤖 Claude handles:**
- [ ] Write a matching function: when a new shift is posted, query all active requests on the same board that overlap in date and preferred time slot
- [ ] For each matched request owner: check `notify_via_email` and send a "A shift matching your request was just posted" email
- [ ] Write the email template for match notifications (shift details, direct link to the wall)
- [ ] Add the match-check call to the `createShift` server action so it runs on every new post

**👤 You handle:**
- [ ] Decide on match strictness: should it match on date only, or also try to match preferred time slots vs. shift start time? (Tell me and I'll implement accordingly)
- [ ] Test the end-to-end flow: post a request, then post a matching shift from a second account, verify email arrives

---

### 4 — SMS Notifications `MEDIUM`

**Why fourth:** Some users prefer texts. Phone number and `notify_via_sms` fields are already in the database — the infrastructure just needs wiring.

**Dependencies:** Tasks 2 and 3 (so SMS can reuse the same trigger points as email).

**🤖 Claude handles:**
- [ ] Add a `sendSms(to, message)` helper that calls your SMS provider's API
- [ ] Extend the interest notification trigger (Task 2) to also send SMS if `notify_via_sms = true`
- [ ] Extend the match notification trigger (Task 3) to also send SMS
- [ ] Keep messages short and include a direct link

**👤 You handle:**
- [ ] Choose an SMS provider — **Twilio** is the standard choice; **Resend does not do SMS**
  - Create a Twilio account at twilio.com
  - Get a phone number (~$1/month) and note your Account SID and Auth Token
- [ ] Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` to Vercel environment variables
- [ ] Install the Twilio SDK: `npm install twilio`
- [ ] Test by adding your phone number to a dev account and triggering an interest notification

---

### 5 — OAuth Login (Google + Apple) `MEDIUM`

**Why fifth:** New users drop off at registration forms. Google and Apple sign-in reduce that friction significantly. Facebook and LinkedIn are lower priority for a hospitality/shift-trading audience.

**🤖 Claude handles:**
- [ ] Add "Continue with Google" and "Continue with Apple" buttons to the login page
- [ ] Add the same buttons to the register page
- [ ] Handle the OAuth callback — on first login, redirect to a "complete your profile" step to set display name (required for posting)
- [ ] Ensure the existing display name validation and board-join flow still works for OAuth users

**👤 You handle:**
**Google:**
- [ ] Go to Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID
- [ ] Set authorized redirect URI to: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
- [ ] Copy Client ID and Client Secret into Supabase Dashboard → Auth → Providers → Google

**Apple:**
- [ ] Requires an Apple Developer account ($99/year) — decide if this is worth it now or defer
- [ ] If yes: create a Services ID, configure Sign In with Apple, get the Key ID and private key
- [ ] Add credentials to Supabase Dashboard → Auth → Providers → Apple

---

### 6 — Shift Sharing `LOW-MEDIUM`

**Why here:** Useful for word-of-mouth growth but not core to the app working well.

**🤖 Claude handles:**
- [ ] Add a share icon button to ShiftCard (in the action row alongside the existing icons)
- [ ] On click: open a small popover with options:
  - "Copy link" — copies `https://myshiftx.com/wall?post=<id>` to clipboard with a tick confirmation
  - "Share via…" — uses the Web Share API on mobile (falls back to copy on desktop)
- [ ] On the wall, add support for the `?post=<id>` query param to scroll and briefly highlight the referenced card on load

**👤 You handle:**
- [ ] Decide if shared links should require login to view or be publicly visible — this affects whether you need a public-access RLS policy on shifts
- [ ] Test on mobile to confirm the native share sheet appears

---

### 7 — Monetization Planning `FUTURE`

**Why last:** The app needs to be running and used before you can meaningfully collect money. Decide the model first, then implement.

**👤 You handle (decide first):**
- [ ] Choose a model — options to consider:
  - **Voluntary tip jar** — "Help keep MyShiftX free" donation button (simplest, no paywalling)
  - **Board subscription** — Leaders pay a small monthly fee per board after a free trial
  - **Premium features** — e.g., post pinning, extended expiration, analytics, for a small monthly fee
- [ ] Create a Stripe account at stripe.com
- [ ] Note your Publishable Key and Secret Key

**🤖 Claude handles (once you've decided):**
- [ ] Integrate Stripe Checkout or Stripe Elements into the app
- [ ] For subscriptions: add a `subscription_status` field to boards or users and gate premium features behind it
- [ ] For donations: add a simple "Support MyShiftX" button to the profile page or footer
- [ ] Set up a Stripe webhook at `/api/webhooks/stripe` to handle payment confirmations

---

## Ongoing / Maintenance

| Task | Who | Notes |
|------|-----|-------|
| Cross-browser testing (Safari, Chrome, Firefox, Edge) | 👤 You | Especially test on iOS Safari — it has the most quirks |
| Security audit (RLS policies, input sanitization) | 🤖 Claude | Run `/code-review ultra` on the branch when you're ready |
| Accessibility audit (WCAG 2.1 AA) | 🤖 Claude | Can audit and fix after core features are stable |
| Rate limiting on post/flag endpoints | 🤖 Claude | Add after real users are on the platform |
| User acceptance testing with a pilot group | 👤 You | Pick 5–10 coworkers to test before wider rollout |
| Export MyShiftX logo as PNG for email header | 👤 You | Export at 400×84px (2×), place in `public/logos/myshiftx-logo.png`, update email template URL |

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
