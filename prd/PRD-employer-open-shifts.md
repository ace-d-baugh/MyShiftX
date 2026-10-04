# PRD: Employer Boards & Open Shifts

**Status:** Draft · **Owner:** TBD · **Date:** 2026-10-04
**Decision:** Build inside MyShiftX (same site, same backend). Employer experience lives in its own route group; extract later only if needed.

---

## 1. Problem

MyShiftX today is **worker-to-worker**: employees repost shifts *they were scheduled for* (trade/giveaway) or request coverage. Employers have no way to publish **unfilled** shifts to a vetted pool. Example: a dental office needs hygienists to fill specific days in a specific area, and wants to restrict who can see and claim them.

## 2. Goals

1. An employer can create a private board and post open shifts that only approved members can see and claim.
2. Reuse existing vetting (invite code + approval queue), claim loop, notifications, calendar, messaging.
3. Employer fills a shift with minimal friction; worker sees it on the Wall and calendar like any other shift.
4. Peer boards behave exactly as today. Zero regression.

## 3. Non-Goals (v1)

- Payments/payroll, timesheets, W-2/1099 handling.
- Credential/license verification (v1: self-reported fields, employer vets manually).
- Public job marketplace / discovery of employer boards.
- Native app, SMS.
- Replacing the employer's scheduling software.

## 4. Users

| Persona | Needs |
|---|---|
| **Employer (board owner)** | Post open shifts, pick/approve who fills them, know who's reliable, no noise |
| **Employer manager** | Same as owner for posting/approving (existing `Mod`/`Leader` roles) |
| **Worker (member)** | See open shifts for roles they qualify for, claim fast, get confirmation, see it on calendar |

A user may be an employee on peer boards, a member of employer boards, and an employer, simultaneously. No separate account type in v1.

## 5. Current Architecture (findings)

Stack: Next.js 14 App Router, Supabase (Postgres/RLS/Realtime), Stripe, Resend, Web Push. Mutations via server actions in `app/actions/*`; authorization enforced in RLS and `SECURITY DEFINER` RPCs.

| Area | Where | Relevance |
|---|---|---|
| Boards | `boards`, `user_boards` (role `User/Mod/Leader`, `is_approved`), `app/actions/boards.ts`, `lib/roles.ts` | Reuse as-is; add `board_type` |
| Join flow | `lookupBoardByCode`, `confirmJoinBoard`, approvals queue `/leader/approvals` | **This is the employer's vetting mechanism, already built** |
| Shifts | `shifts` (`user_id` = owner worker, `created_by`, `is_trade`, `is_giveaway`, `bundle_id`, `expires_at`) | Assumes every shift belongs to a worker's own schedule |
| Claims | `shift_claims`, RPCs `claim_shift`, `respond_to_claim`, `finalize_claim`, `withdraw_claim`; `claim_shift` **rejects `user_id IS NULL`** | Lifecycle reusable; owner semantics need generalizing |
| Bundles | `shift_bundles`, `claim_bundle` | Reusable for "take the whole week" |
| Wall | `app/(dashboard)/wall/*`, `ShiftCard`, `PostShiftForm` (1078 lines) | New card variant + new form; do not overload `PostShiftForm` |
| Calendar | personal shifts via `shifts_select_own`; iCal feed | Accepted open shift must land on claimant's calendar |
| Notifications | `app/actions/notifications.ts` (1184 lines), push, email, in-app inbox | Add open-shift notify + per-role filtering |
| Messaging | board-scoped conversations | Reuse for employer↔worker |
| Gating | `users.membership` (Basic/Pro/Trial), Stripe, `lib/pricing.ts` | Employer tier hooks in here |

### Key gap

A trade/giveaway shift has an **owner who is also the person scheduled**. An open shift has **no worker owner**. The employer *posts* it; a worker *fills* it. Every place that assumes `shifts.user_id = the person who works it` must be reviewed: claim RPCs, calendar queries, reliability stats, notifications, expiry cron.

## 6. Proposed Design

### 6.1 Data model

```
boards
  + board_type        text  NOT NULL DEFAULT 'peer'  CHECK IN ('peer','employer')
  + org_name          text  NULL           -- display name, e.g. practice name
  + location_label    text  NULL           -- area/address summary
  + default_claim_mode text NOT NULL DEFAULT 'review' CHECK IN ('instant','review')

open_shifts                                -- separate table (recommended)
  id, board_id, posted_by (users.id),
  title, role_required text NULL,
  start_time, end_time, location_label,
  pay_type text NULL ('hourly','flat','negotiable'), pay_amount numeric NULL,
  details text, claim_mode ('instant','review'),
  slots int DEFAULT 1,
  status ('open','pending','filled','cancelled','expired'),
  series_id uuid NULL,                     -- recurring/batch posts
  priority_until timestamptz NULL,         -- preferred-pool window (phase 2)
  created_at, expires_at

open_shift_claims                          -- or generalize shift_claims
  id, open_shift_id, claimant_id,
  status ('pending','accepted','declined','withdrawn','completed','fell_through'),
  note, created_at, responded_at, finalized_at

user_boards
  + member_role_tag   text NULL            -- 'hygienist', 'assistant' ...
  + member_tier       text NULL            -- phase 2: 'preferred' | 'standard'
  + license_label     text NULL            -- phase 2, self-reported
```

**Why a separate `open_shifts` table (recommended) vs. reusing `shifts`:**

| | Reuse `shifts` (nullable owner) | Separate `open_shifts` |
|---|---|---|
| Migration risk | High: touches RLS, calendar, stats, bundles, cron | Low: additive |
| Code reuse | Max on card/claim UI | Medium; copy claim RPC patterns |
| Regression risk to peer boards | Real | Near zero |
| On acceptance | Row already exists | Create a personal `shifts` row for claimant so calendar/iCal/expiry work unchanged |

On accept: insert a `shifts` row (`user_id = claimant`, `board_id`, not trade/giveaway so it stays off the Wall, with `open_shift_id` link). This reuses calendar, iCal, and reminders without edits.

### 6.2 Permissions (RLS + RPC)

- `board_type='employer'`: only `Mod`/`Leader` may insert `open_shifts`. Members SELECT only; claim via RPC.
- Peer-style trade/giveaway posting on employer boards: **off by default**, board-level toggle (`allow_member_posts`).
- `claim_open_shift(id)`: member of board, approved, role tag matches `role_required` (if set), shift open and not expired, slot available, no overlapping accepted shift (warn only in v1).
- `instant` mode → auto-accept and fill; `review` mode → pending, employer picks.
- All writes via `SECURITY DEFINER` RPCs, `REVOKE` direct writes, same pattern as `20260717150000_trade_loop_shift_claims.sql`.
- Must follow existing hardening: `SET search_path`, `function_execute_lockdown`, column grants.

### 6.3 Claim modes (per shift)

1. **Instant claim:** first eligible member fills it. For urgent coverage.
2. **Review applicants:** members apply, employer accepts one (or N for multi-slot). Rival claims auto-declined (existing behavior).

Default comes from board setting; overridable per shift.

### 6.4 Lifecycle

`open → (pending) → filled → completed` · branches: `cancelled` (employer), `expired` (cron), `fell_through` (worker backs out → shift **re-opens** and employer is notified; mirrors `finalize_claim` reactivation).

### 6.5 UX

**Employer side (`/manage`, new route group)**
- Create employer board (name, org, location, default claim mode).
- Open Shifts dashboard: Open / Pending / Filled / Past; applicant review queue.
- Post form: single, batch (date range + days), recurring template.
- Members: approve (existing queue), set role tag.
- Share: invite code/QR (existing `InviteModal`).

**Worker side**
- Wall gets an **Open Shifts** tab/filter; employer boards badge-labeled; role-matching shifts prioritized.
- `OpenShiftCard`: org, role, date/time, location, pay, claim button (Instant) or "Apply" (Review).
- Claim result and status in notifications and on calendar.

**Onboarding**
- Registration/Welcome: "I'm a worker" vs "I'm hiring" → hiring path creates an employer board and shows invite flow. Same account, no separate type.
- Landing: `/for-employers` (extend existing `app/for/page.tsx`).

### 6.6 Notifications

- New open shift → push/email to eligible members (role match), respecting `notify_via_*`.
- Claim/apply → employer. Accept/decline → worker. Fell-through → employer. Filled → rival applicants.
- Phase 2: quiet hours, per-role/location filters, preferred-pool-first window.

### 6.7 Monetization (proposal, decide before build)

Free for workers. Employer value-based tier, e.g. free up to N open shifts/month or M members; paid above. Reuse Stripe checkout, add `org_membership` or board-level plan flag. Do not gate claiming for workers.

## 7. Phasing

**MVP (v1)**
- `board_type`, employer board creation, owner/mod-only posting
- `open_shifts` + claims, instant and review modes, role tag matching
- Worker Open Shifts tab + card, employer dashboard, notifications
- Accept → personal calendar shift; fell-through re-opens
- Employer onboarding path + landing page

**v1.1**
- Batch/recurring posts, multi-slot shifts, pay fields polish, cancel/edit with notifications

**v2**
- Preferred/standard tiers with timed priority access
- Credentials (license + expiry) with employer-side verification flag
- Employer-side reliability view, cancellation notice rules
- Multi-location orgs, employer billing tier

## 8. Success Metrics

- Employer boards created; % posting ≥1 open shift within 7 days
- Open-shift fill rate and median time-to-fill
- Fell-through rate
- Worker membership per employer board
- Zero regressions in peer-board claim flow (existing tests + e2e)

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Regression in peer shifts/claims | Separate `open_shifts` table; additive migration; board-type guards |
| Legal exposure (staffing/contractor ambiguity) | ToS + UI copy: scheduling tool, not staffing agency; employer responsible for classification and credential checks. **Counsel review before launch** |
| Marketplace cold start | Employer brings own pool via invite code; no public listing in v1 |
| Credential fraud | v1 self-reported, clearly labeled unverified; employer vets at approval |
| Notification spam | Role/location filters, per-board mute |
| Showcase/AdSense state | Feature behind env flag; unaffected by showcase mode |

## 10. Open Questions

1. Per-diem 1099 vs W-2 shifts: do we need a label field in v1?
2. Should employers see worker contact info / phone after acceptance? (Privacy defaults)
3. Instant-claim conflicts: block overlapping shifts or warn only?
4. Can a worker be on an employer board without a MyShiftX Pro plan? (Assumed yes.)
5. Pricing model: per employer, per seat, or per posted shift?
6. Does an employer board allow member-to-member trades (toggle default)?
7. Should open shifts appear in the iCal feed before acceptance? (Assumed no.)
8. Port to sister app (WDWShiftX) or MyShiftX only?

## 11. Implementation Notes

- New code in `app/(dashboard)/manage/*`, `app/actions/openShifts.ts`, `components/features/OpenShiftCard.tsx`, `OpenShiftForm.tsx`, `lib/validations/openShifts.ts`; migration `supabase/migrations/<ts>_employer_boards_open_shifts.sql`.
- Update `lib/database.types.ts` (`npm run db:types`), `lib/roles.ts` unaffected.
- Extend `app/api/cron/expirations/route.ts` for open-shift expiry.
- Tests: RPC permission matrix (non-member, member, mod, wrong role tag, expired, double-claim), peer-board regression, e2e claim → calendar.
