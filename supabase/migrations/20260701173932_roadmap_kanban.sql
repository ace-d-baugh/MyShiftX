CREATE TABLE public.roadmap_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  column_key text NOT NULL CHECK (column_key IN ('done', 'in_progress', 'next', 'backlog', 'deferred')),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.roadmap_cards ENABLE ROW LEVEL SECURITY;

-- Admin-only in every direction — this is an internal planning tool, not a
-- board-scoped feature, so it doesn't fit the existing per-board RLS helpers.
CREATE POLICY "roadmap_cards_admin_all" ON public.roadmap_cards
  FOR ALL
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

CREATE TRIGGER update_roadmap_cards_updated_at
  BEFORE UPDATE ON public.roadmap_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data derived from TASKS.md
INSERT INTO public.roadmap_cards (title, description, column_key, position) VALUES
-- Done
('Auth & Access', 'Email/password registration + verification, login/session mgmt, forgot/reset password, role-based access (global + per-board), account deactivation.', 'done', 0),
('Boards', 'Board creation (Leaders), invite-code join w/ mod approval, full board management (rename, invite code, roles, ownership transfer, delete), mobile UI, My Boards section.', 'done', 1),
('The Wall (Shift & Request Posts)', 'Post/edit/remove shift offers & requests, board/date/type filters, ShiftCard/RequestCard, interest marking, comments (edit/delete/flag).', 'done', 2),
('Moderation & Leadership', 'Join approvals queue, flagging + resolution workflow, archive view, admin user management.', 'done', 3),
('Infrastructure', 'Vercel cron auto-expiration (secured), Resend email delivery, transactional templates, Supabase RLS on all tables, client+server validation.', 'done', 4),
('UI / UX', 'Responsive layout w/ mobile nav, dark mode, My Calendar page, 404 page, design token system.', 'done', 5),
('Live Updates (Supabase Realtime)', 'Realtime subscriptions for shifts & requests on the Wall — instant updates across tabs/devices, no polling.', 'done', 6),
('Interest Notification Email', 'Post owner gets emailed the moment someone marks interest — respects notify_via_email opt-out.', 'done', 7),
('Shift Match Notifications', 'Auto-matches new shifts/requests by board + date (ET) + time window, emails both parties, dedupes by user.', 'done', 8),
('Membership Schema (Database)', 'membership/trial_ends_at/trial_used columns, nightly Trial→Basic downgrade, RLS locked to owner + service role only.', 'done', 9),
-- In Progress
('OAuth Login (Google + Facebook + LinkedIn)', 'Google & LinkedIn fully wired and tested. Facebook: redirect URI + app review still pending.', 'in_progress', 0),
-- Next
('Stripe Integration & Checkout', 'Checkout session + webhook handling to flip membership on payment/cancellation/failure. Needs Stripe account + product/price setup first.', 'next', 0),
('Subscription Sales / Upgrade Page', '/upgrade funnel — hero, pain points, feature comparison, pricing toggle, trial callout, FAQ.', 'next', 1),
('Discount Codes & Promotional Pricing', 'Cast Member / Friends & Family / seasonal promo codes via Stripe Coupons + Promotion Codes.', 'next', 2),
('Feature Gating (Pro vs Basic)', 'useMembership() hook, gate match notifications + Realtime + ads behind Pro/Trial, trial expiration + eligibility checks.', 'next', 3),
('SMS Notifications (Pro Tier)', 'Twilio-backed SMS for shift matches, 30/mo cap, opt-in toggle + usage counter.', 'next', 4),
-- Backlog
('Ad System (Placeholders + AdSense)', 'AdSlot component, desktop sidebar + mobile inline ads, suppressed for Pro/Trial.', 'backlog', 0),
('Business Entity & Legal Protection', 'Digital Elegance LLC d/b/a MyShiftX — EIN/Articles/DBA filed. Remaining: business bank account, ToS/Privacy/DMCA pages, 10DLC registration, trademark, copyright, annual compliance.', 'backlog', 1),
('Dedicated Mobile App (Expo/React Native)', 'Trigger: feature-stable web app + 50+ paid Pro subs + Year 2 multi-park expansion. Mirrors the web app; native push replaces SMS.', 'backlog', 2),
('Photo Schedule Import (Local LLM on VPS)', 'Photograph a schedule → Ollama on VPS parses it → auto-creates shifts. Free: 4/mo, Pro: unlimited.', 'backlog', 3),
('In-App Push Notifications (Web Push)', 'Browser Push API + VAPID keys, service worker, free for all tiers.', 'backlog', 4),
('Calendar Export & Sync (iCal/Google)', 'Per-user secret iCal feed URL for Pro users, subscribe from Google/Apple/Outlook calendars.', 'backlog', 5),
('Trade Preferences (Smart Matching)', 'Pro users set preferred shift types/times/days — match notifications only fire when preferences are satisfied.', 'backlog', 6),
('In-App Messaging (Chat)', 'Full chat system within boards — chat tab, sidebar chat list, message input, emoji reactions, start-new-chat via Contact button or member search. Board-member-only.', 'backlog', 7),
('Bulk Shift Import (CSV + Multi-Photo)', 'CSV template upload + multi-week photo scan for Pro users, extends the photo import pipeline.', 'backlog', 8),
-- Deferred
('Proficiency system (Property→Location→Role)', 'Replaced by the Boards system — boards serve this purpose more flexibly.', 'deferred', 0),
('Multi-language support (Spanish)', 'Good idea, defer until user base justifies it.', 'deferred', 1),
('PWA offline capability', 'Nice-to-have, not needed for core use.', 'deferred', 2),
('Analytics dashboard for Leaders', 'Defer until post-launch.', 'deferred', 3),
('Automated DB backups', 'Supabase handles this automatically on paid plans.', 'deferred', 4),
('Unit tests', 'Defer until the feature set stabilizes.', 'deferred', 5),
('Facebook OAuth', 'Lower priority for this audience — buttons/backend already built, just needs Facebook App Review + config. Add if users request it.', 'deferred', 6);
