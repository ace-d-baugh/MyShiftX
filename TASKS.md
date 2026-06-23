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

### 4 — SMS Notifications *(Skipped — deferred)*

Revisit after OAuth and other higher-value features ship.

---

### 5 — OAuth Login (Google + Facebook + LinkedIn) `IN PROGRESS`

**🤖 Claude handled:**
- ✅ `OAuthButtons` component — branded Google, Facebook, LinkedIn buttons with SVG icons
- ✅ Buttons added to login and register pages with a divider
- ✅ `/auth/callback` route — exchanges code, sends new OAuth users to profile to set display name
- ✅ Profile page welcome banner for first-time OAuth arrivals

**👤 You handle — complete each provider below, then test:**

#### Google
- [ ] Go to **console.cloud.google.com** → select or create a project
- [ ] APIs & Services → **OAuth consent screen** → External → fill in App name, support email, developer email → Save & Continue through all steps
- [ ] APIs & Services → **Credentials** → Create Credentials → **OAuth client ID**
  - Application type: **Web application**
  - Authorized redirect URIs → Add: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
  - *(your ref is the subdomain part of your Supabase project URL — find it in Supabase → Settings → General)*
- [ ] Copy **Client ID** and **Client Secret**
- [ ] Supabase Dashboard → **Authentication → Providers → Google** → Enable → paste both → Save
- [ ] Test: click Google on the login page, sign in, verify you land on profile or wall

#### Facebook
- [ ] Go to **developers.facebook.com** → My Apps → **Create App**
  - Use case: **Authenticate and request data from users** → Next
  - App name: `MyShiftX` → Create app
- [ ] On the app dashboard: Add product → **Facebook Login** → **Web**
  - Site URL: `https://myshiftx.com` → Save
- [ ] Left sidebar: Facebook Login → **Settings**
  - Valid OAuth Redirect URIs → Add: `https://<your-supabase-ref>.supabase.co/auth/v1/callback` → Save
- [ ] Left sidebar: **App Settings → Basic** → copy **App ID** and **App Secret**
- [ ] Supabase Dashboard → **Authentication → Providers → Facebook** → Enable → paste both → Save
- [ ] To test in Development mode: **App Roles → Roles → Add Testers** → add your personal Facebook account
- [ ] When ready for public users: complete **App Review** and switch Mode from Development to **Live**
- [ ] Test: click Facebook on the login page

#### LinkedIn
- [ ] Go to **linkedin.com/developers** → **Create app**
  - App name: `MyShiftX`, LinkedIn Page: create/use a company page (required by LinkedIn), upload logo
- [ ] **Auth** tab → OAuth 2.0 settings → Authorized redirect URLs → **Add URL**:
  `https://<your-supabase-ref>.supabase.co/auth/v1/callback` → Update
- [ ] **Products** tab → **Sign In with LinkedIn using OpenID Connect** → **Request access** (usually instant)
- [ ] **Auth** tab → copy **Client ID** and **Client Secret**
- [ ] Supabase Dashboard → **Authentication → Providers → LinkedIn (OIDC)** → Enable → paste both → Save
  *(Use the **OIDC** provider specifically — not the older plain LinkedIn OAuth provider)*
- [ ] Test: click LinkedIn on the login page

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
