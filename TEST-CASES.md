# MyShiftX — Test Cases

**How to use:** Work through each test top to bottom. Mark `[PASS]`, `[FAIL]`, or `[SKIP]` in the result column and add any observations in the Comments field. Re-run any `[FAIL]` after a fix before shipping.

---

## Table of Contents
1. [Authentication & Registration](#1-authentication--registration)
2. [Guest User](#2-guest-user)
3. [User](#3-user)
4. [Mod](#4-mod)
5. [Leader](#5-leader)
6. [Admin](#6-admin)
7. [Proficiency Approval Workflow](#7-proficiency-approval-workflow)
8. [Database Verification](#8-database-verification)

---

## 1. Authentication & Registration

### AUTH-001 — Registration form validation

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Go to `/register` while logged out | Registration form loads with all fields visible |
| 2 | Submit the form completely empty | All required fields show error messages; form does not submit |
| 3 | Enter password `abc1234` (7 chars) | Error: minimum 8 characters |
| 4 | Enter password `abc12345` (8 chars) | Accepted |
| 5 | Submit without checking Terms checkbox | Submit button is disabled or shows error |

**Result:** `[ ]`
**Comments:**

---

### AUTH-002 — Successful registration

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Fill in all fields correctly with a **new** email address | No errors shown |
| 2 | Click "Create Account" | Loading spinner appears |
| 3 | After submit | Redirected to `/verify-email` page |
| 4 | Open Supabase → Authentication → Users | New user appears with `email_confirmed_at = null` |
| 5 | Open Supabase → Table Editor → `public.users` | Row exists for the new user with `user_type = 'Guest'` |

**Result:** `[ ]`
**Comments:**

---

### AUTH-003 — Email verification & auto-promotion

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Open the verification email sent to the new address | Email received with a confirmation link |
| 2 | Click the confirmation link | Redirected to the app (verify-email or board) |
| 3 | Open Supabase → `public.users` for that user | `user_type` has changed from `'Guest'` to `'User'` |
| 4 | Open Supabase → `auth.users` for that user | `email_confirmed_at` is now populated |

**Result:** `[ ]`
**Comments:**

---

### AUTH-004 — Login & logout

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Go to `/login` with valid user credentials | Logs in and redirects to `/board` |
| 2 | While logged in, navigate to `/login` | Redirected to `/board` (cannot re-visit login) |
| 3 | While logged in, navigate to `/register` | Redirected to `/board` |
| 4 | Click "Log Out" | Full page reload occurs; lands on `/login` |
| 5 | From `/login`, click "Register here" | Successfully navigates to `/register` |
| 6 | Go to `/board` while logged out | Redirected to `/login` |

**Result:** `[ ]`
**Comments:**

---

### AUTH-005 — Multi-account registration on same browser

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Log in as Account A | Logged in, on `/board` |
| 2 | Click "Log Out" | Lands on `/login` |
| 3 | Click "Register here" | Navigates to `/register` (not redirected away) |
| 4 | Complete registration for Account B | Redirected to `/verify-email` |

**Result:** `[ ]`
**Comments:**

---

## 2. Guest User

> **Setup:** Register a new account but do **not** verify the email.

### GUEST-001 — Access restrictions

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | After registering (email unverified), try to go to `/board` | Redirected to `/verify-email` page |
| 2 | Try to go to `/profile` | Redirected to `/verify-email` |
| 3 | Try to go to `/admin` | Redirected to `/login` or `/verify-email` |
| 4 | Try to go to `/leader/approvals` | Redirected away |

**Result:** `[ ]`
**Comments:**

---

## 3. User

> **Setup:** A verified account with `user_type = 'User'`. Should have at least 2 **approved** proficiencies set up (different roles and locations).

### USER-001 — Profile & proficiency selector

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Go to `/profile` | Profile page loads with display name and "User" badge |
| 2 | View proficiency section | Existing proficiencies listed as "Role • Property › Location" |
| 3 | In "Add Proficiency", select a Role | Property dropdown becomes enabled |
| 4 | Select a Property | Location checkboxes appear inside a bordered box |
| 5 | On a medium-width screen (≥768px) | Location checkboxes display in 2 columns |
| 6 | On a narrow screen (<768px) | Location checkboxes display in 1 column |
| 7 | Select multiple locations and click "Add X Proficiencies" | Button label shows the count (e.g., "Add 3 Proficiencies") |
| 8 | After adding | New rows appear in the proficiency list; one row per location, each showing a "Pending" badge |
| 9 | Pre-existing, already-approved proficiencies | Show no badge (no "Pending" pill) |
| 10 | Helper text above the list | Mentions that new proficiencies need Mod/Leader approval before they unlock the board |
| 11 | Click the trash icon on a proficiency (pending or approved) | Row is removed immediately |

**Result:** `[ ]`
**Comments:**

---

### USER-002 — Board visibility (proficiency-scoped)

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Go to `/board` | Shift Offers tab is shown by default |
| 2 | Filter panel shows | Checkboxes for Role, Property dropdown, Location checkboxes |
| 3 | Uncheck all Role checkboxes | Board shows empty state |
| 4 | Check all roles back on | Posts reappear |
| 5 | Select a Property in the scope dropdown | Location checkboxes filter to that property only |
| 6 | A post exists for a role/location **not** in your proficiencies | That post does **not** appear in your board |
| 7 | A post exists for a role/location **in** your proficiencies | That post **does** appear |
| 8 | Click "Shift Requests" tab | Requests load with same proficiency-scoped filters |
| 9 | A post exists for a role/location where you only hold a **pending** (unapproved) proficiency | That post does **not** appear, and that role/location is absent from the filter checkboxes entirely |

**Result:** `[ ]`
**Comments:**

---

### USER-003 — Empty states

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | User with **no proficiencies** goes to `/board` | Shows "Try adjusting your proficiencies" with a link to `/profile` |
| 2 | User **with proficiencies** but no matching posts | Shows "Be the first to post!" with a "Post a Shift" button |
| 3 | User whose **only** proficiency is still **pending** approval | Board treats them the same as "no proficiencies" — shows the "Add Proficiencies" empty state, not "Be the first to post!" |

**Result:** `[ ]`
**Comments:**

---

### USER-004 — Post a shift

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Click "Post Shift" on the board | Post Shift form loads |
| 2 | Role dropdown | Only shows roles from your **approved** proficiencies; a role you only hold as a pending proficiency is absent |
| 3 | Select a Role | Property dropdown populates with only properties linked to that role in your proficiencies |
| 4 | Select a Property | Location dropdown populates with only locations for that role+property combo |
| 5 | Select a different Role | Property and Location fields reset |
| 6 | Fill all required fields and submit | Shift appears on the board |
| 7 | Shift you posted | Shows a "Remove" or deactivate option on your own card |

**Result:** `[ ]`
**Comments:**

---

### USER-005 — Post a request

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Click "Post Request" on the board | Post Request form loads |
| 2 | Role → Property → Location cascade | Same cascading behavior as Post Shift (proficiency-scoped, **approved-only**) |
| 3 | Submit a valid request | Request appears on the Shift Requests tab |

**Result:** `[ ]`
**Comments:**

---

### USER-006 — Access restrictions

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Navigate to `/admin` | Redirected to `/board` |
| 2 | Navigate to `/leader/approvals` | Redirected away |
| 3 | Navigate to `/leader/flags` | Redirected away |
| 4 | Navigate to `/leader/archive` | Redirected away |

**Result:** `[ ]`
**Comments:**

---

## 4. Mod

> **Setup:** An account with `user_type = 'Mod'`, with at least one **approved** proficiency (needed to test User Approval scoping in Section 7).

### MOD-001 — Board behavior

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Go to `/board` | Board loads; filter panel shows checkboxes (same as User, proficiency-scoped) |
| 2 | Posts visible | Only posts matching Mod's own proficiencies appear |

**Result:** `[ ]`
**Comments:**

---

### MOD-002 — Approvals access (scoped)

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Navigate to `/admin` | Redirected to `/board` |
| 2 | Navigate to `/leader/approvals` | Page loads (Mod is **not** redirected away) |
| 3 | Page content | Only the "User Approvals" section is visible; Locations and Roles sections are absent entirely |
| 4 | Navigate to `/leader/flags` | Redirected away |
| 5 | Navigate to `/leader/archive` | Redirected away |

**Result:** `[ ]`
**Comments:**

---

### MOD-003 — Navbar

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Navbar while logged in as Mod | Shows Board, Profile, Approvals links |
| 2 | Navbar | Does **not** show Flags, Archive, or Admin links |

**Result:** `[ ]`
**Comments:**

---

## 5. Leader

> **Setup:** An account with `user_type = 'Leader'`, with proficiencies set.

### LEADER-001 — Board behavior

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Go to `/board` | Board shows proficiency-scoped filters (checkboxes, NOT admin dropdowns) |
| 2 | Posts visible | Only posts matching Leader's own proficiencies |

**Result:** `[ ]`
**Comments:**

---

### LEADER-002 — Leader pages

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Navigate to `/leader/approvals` | Approvals page loads, showing **all three** sections: User Approvals, Locations, Roles |
| 2 | Navigate to `/leader/flags` | Flags page loads |
| 3 | Navigate to `/leader/archive` | Archive page loads |
| 4 | Navbar | Shows Approvals, Flags, Archive links; does **not** show Admin link |

**Result:** `[ ]`
**Comments:**

---

### LEADER-003 — Access restrictions

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Navigate to `/admin` | Redirected to `/board` |

**Result:** `[ ]`
**Comments:**

---

## 6. Admin

> **Setup:** An account with `user_type = 'Admin'`.

### ADMIN-001 — Board (unrestricted view)

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Go to `/board` | Filter panel shows **3 dropdowns** (Role, Property, Location) — not checkboxes |
| 2 | Posts visible | Posts from ALL roles and locations appear (not limited to proficiencies) |
| 3 | Select a Role from the dropdown | Board filters to only that role |
| 4 | Select a Property | Board filters to that property; Location dropdown updates to that property's locations |
| 5 | Select a Location | Board filters to that specific location |
| 6 | Clear all filters | All posts reappear |

**Result:** `[ ]`
**Comments:**

---

### ADMIN-002 — Admin panel tabs

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Navigate to `/admin` | Admin panel loads |
| 2 | Tab order | **Roles** is the first tab, then Properties, Locations, Users |
| 3 | Click each tab | Sliding underline indicator animates smoothly to the active tab |
| 4 | Tabs on a small screen | All 4 tabs fit in one row without horizontal scrolling |

**Result:** `[ ]`
**Comments:**

---

### ADMIN-003 — Roles tab

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Open Roles tab | List of all roles with Approved/Pending badges |
| 2 | Type a new role name and press Enter or click Add | New role appears in the list as Approved |
| 3 | Click the ✕ icon on an Approved role | Role changes to Pending |
| 4 | Click the ✓ icon on a Pending role | Role changes to Approved |
| 5 | Click the pencil icon on a role | Name field becomes an editable input |
| 6 | Edit the name and press Enter or click Save | Role name updates in the list |
| 7 | Press Escape while editing | Edit cancelled; original name restored |

**Result:** `[ ]`
**Comments:**

---

### ADMIN-004 — Properties tab

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Open Properties tab | List of all properties with creation dates |
| 2 | Add a new property | Appears in alphabetical order |
| 3 | Click pencil → edit name → save | Name updates in the list |
| 4 | Press Escape while editing | Edit cancelled |

**Result:** `[ ]`
**Comments:**

---

### ADMIN-005 — Locations tab

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Open Locations tab | List of all locations showing parent property name |
| 2 | Select a property, enter a location name, click Add | New location appears listed under that property |
| 3 | Click pencil → edit name → save | Name updates |
| 4 | Toggle Approved/Pending | Status badge changes |

**Result:** `[ ]`
**Comments:**

---

### ADMIN-006 — Users tab

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Open Users tab | List of all users; each shows display name + user_type badge |
| 2 | Users with proficiencies | Show a dot-separated list of their role names below the display name |
| 3 | Users with no proficiencies | Show "No Roles Yet" in italic |
| 4 | Inactive users | Display name has strikethrough; "Inactive" badge shown |
| 5 | Filter by Role dropdown | List narrows to users who have that role in their proficiencies |
| 6 | Filter by Property | List narrows to users with proficiencies at that property |
| 7 | Filter by Location (requires Property selected) | List narrows further |
| 8 | Filter by User Type | Shows only users of that type |
| 9 | Type in the search bar | List filters per keystroke by display name (case-insensitive) |
| 10 | Clear all filters | All users reappear |
| 11 | Your own row (Admin) | Shows "You" label; no Edit or Deactivate buttons |
| 12 | Another user's row | Shows "Edit" button and "Deactivate" button |
| 13 | Click "Deactivate" on an active user | Button changes to "Reactivate"; user shows Inactive badge |
| 14 | Click "Reactivate" on inactive user | User becomes active again |

**Result:** `[ ]`
**Comments:**

---

### ADMIN-007 — User edit page

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Click "Edit" on a Users tab user | Navigates to `/admin/users/[id]` |
| 2 | Page shows | Display name, email (read-only), User Type dropdown, Active toggle, proficiencies list |
| 3 | Email field | Cannot be edited (display only) |
| 4 | Change display name and save | Returns to `/admin`; name reflects the change in Users tab |
| 5 | Change User Type and save | Returns to `/admin`; user's badge in Users tab shows new type |
| 6 | Toggle Active off and save | Returns to `/admin`; user shows as Inactive |
| 7 | Click the back arrow without saving | Returns to `/admin` with no changes made |
| 8 | Visiting `/admin/users/[nonexistent-id]` | Returns a 404 page |

**Result:** `[ ]`
**Comments:**

---

### ADMIN-008 — Admin access to navbar

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Navbar while logged in as Admin | Shows Board, Profile, Approvals, Flags, Archive, Admin links |
| 2 | Navigate to `/admin` directly | Admin panel loads (not redirected) |

**Result:** `[ ]`
**Comments:**

---

## 7. Proficiency Approval Workflow

> **Setup:** Need at least one User account, one Mod account with an approved proficiency, one Leader account, and one Admin account. The Mod and Leader should hold an approved proficiency for the **same** role+location as the User's pending request for the scoping tests.

### PROF-001 — New proficiency starts pending

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | As a User, add a new proficiency via `/profile` | Row appears immediately with a "Pending" badge |
| 2 | Check Supabase `user_proficiencies` row for it | `is_approved = false`, `suggested_by_user_id` = the user's id, `approved_by_user_id` and `approved_at` are `null` |
| 3 | Go to `/board` | The role/location from the pending proficiency grants **no** board access (post visibility, filters unaffected by it) |
| 4 | Try to post a shift/request for that role | Role is absent from the Post Shift / Post Request role dropdown |

**Result:** `[ ]`
**Comments:**

---

### PROF-002 — Approval unlocks board access

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | A Mod/Leader/Admin approves the user's pending proficiency (see PROF-005) | — |
| 2 | User refreshes `/profile` | The "Pending" badge is gone from that row |
| 3 | User refreshes `/board` | That role/location now appears in the filter checkboxes and matching posts become visible |
| 4 | User opens Post Shift / Post Request | That role now appears in the Role dropdown |

**Result:** `[ ]`
**Comments:**

---

### PROF-003 — Approvals page visibility by role

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | User navigates to `/leader/approvals` | Redirected away; no access |
| 2 | Mod navigates to `/leader/approvals` | Page loads; only "User Approvals" section is shown |
| 3 | Leader navigates to `/leader/approvals` | Page loads; "User Approvals", "Locations", and "Roles" sections all shown |
| 4 | Admin navigates to `/leader/approvals` | Page loads; all three sections shown |

**Result:** `[ ]`
**Comments:**

---

### PROF-004 — Approval scoping (Mod/Leader vs Admin)

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | User submits a pending proficiency for Role A / Location A | Row created with `is_approved = false` |
| 2 | A Mod whose own approved proficiency is Role A / Location A opens "User Approvals" | The pending request **is** visible in the list |
| 3 | A different Mod whose approved proficiencies do **not** include Role A / Location A opens "User Approvals" | The pending request is **not** visible in their list |
| 4 | Admin opens "User Approvals" | The pending request is visible regardless of the Admin's own proficiencies |

**Result:** `[ ]`
**Comments:**

---

### PROF-005 — Approve action

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | In "User Approvals", click "Approve" on a pending row | Row disappears from the list immediately |
| 2 | Check the `user_proficiencies` row in Supabase | `is_approved = true`, `approved_by_user_id` = the approver's id, `approved_at` is populated |
| 3 | Queue count in the header | Decrements by 1 |

**Result:** `[ ]`
**Comments:**

---

### PROF-006 — Reject action

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | In "User Approvals", click "Remove" on a pending row | Row disappears from the list immediately |
| 2 | Check Supabase `user_proficiencies` for that row | Row is **hard deleted** (no longer exists) |
| 3 | User's `/profile` | The proficiency is gone entirely; they must re-add it to request again |

**Result:** `[ ]`
**Comments:**

---

### PROF-007 — Approval queue counts & empty states

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | No pending user proficiencies exist (for the viewer's scope) | "User Approvals" section shows "No pending user requests." |
| 2 | Header summary line with 0 total pending items across all sections | Reads "All caught up! No pending approvals." |
| 3 | Header summary line with pending items | Reads "N item(s) awaiting approval" with the correct singular/plural form |

**Result:** `[ ]`
**Comments:**

---

## 8. Database Verification

> Run these checks directly in Supabase → Table Editor or SQL Editor.

### DB-001 — user_types table

| # | Check | Expected |
|---|-------|----------|
| 1 | `SELECT * FROM user_types ORDER BY name;` | 5 rows: Admin, Guest, Leader, Mod, User |
| 2 | All values are capitalized (not lowercase) | ✓ |

**Result:** `[ ]`
**Comments:**

---

### DB-002 — users table structure

| # | Check | Expected |
|---|-------|----------|
| 1 | `SELECT DISTINCT user_type FROM users;` | Only values from the set: Guest, User, Mod, Leader, Admin |
| 2 | `SELECT * FROM users WHERE user_type = 'guest';` | 0 rows (old lowercase values should be gone) |
| 3 | New user created via registration | Row exists with `user_type = 'Guest'` and `is_active = true` |
| 4 | After email verification | Same user's `user_type` changes to `'User'` |
| 5 | `SELECT * FROM users WHERE user_type IS NULL;` | 0 rows |

**Result:** `[ ]`
**Comments:**

---

### DB-003 — Trigger: handle_new_user

| # | Check | Expected |
|---|-------|----------|
| 1 | Register a brand new account | Within seconds, a row appears in `public.users` |
| 2 | Check `user_type` of that row | `'Guest'` |
| 3 | Check `display_name` | Defaults to `'User'` |
| 4 | Check `is_active` | `true` |

**Result:** `[ ]`
**Comments:**

---

### DB-004 — Trigger: handle_email_verified

| # | Check | Expected |
|---|-------|----------|
| 1 | Before clicking the verification link | `user_type = 'Guest'` |
| 2 | After clicking the verification link | `user_type = 'User'` |
| 3 | If user was already `'User'` or higher and email is re-confirmed | `user_type` does **not** change (trigger only fires on Guest) |

**Result:** `[ ]`
**Comments:**

---

### DB-005 — get_user_role() function

| # | Check | Expected |
|---|-------|----------|
| 1 | Log in as a User, then in SQL Editor: `SELECT get_user_role();` | Returns `'user'` (lowercase) |
| 2 | For an Admin user: `SELECT get_user_role();` | Returns `'admin'` (lowercase) |
| 3 | For a Leader user | Returns `'leader'` |

**Result:** `[ ]`
**Comments:**

---

### DB-006 — user_proficiencies RLS

| # | Check | Expected |
|---|-------|----------|
| 1 | Log in as User A. Query `SELECT * FROM user_proficiencies;` | Only returns User A's own rows |
| 2 | Log in as Admin. Query `SELECT * FROM user_proficiencies;` | Returns ALL users' proficiency rows |
| 3 | Add a proficiency as User A | Row inserted with correct `user_id`, `role_id`, `property_id`, `location_id` |
| 4 | Remove a proficiency | Row is deleted; board updates accordingly |

**Result:** `[ ]`
**Comments:**

---

### DB-007 — Shifts & requests RLS

| # | Check | Expected |
|---|-------|----------|
| 1 | User A posts a shift | Row inserted in `shifts` table with `created_by = User A's id` |
| 2 | User B (different proficiencies) queries shifts | Does **not** see User A's shift if it's outside User B's proficiencies |
| 3 | Admin queries shifts | Sees all active shifts regardless of role/location |
| 4 | User A deactivates their own shift | `is_active` set to `false`; shift disappears from board |
| 5 | User A tries to deactivate User B's shift | No change (RLS prevents it) |

**Result:** `[ ]`
**Comments:**

---

### DB-008 — Indexes and constraints

| # | Check | Expected |
|---|-------|----------|
| 1 | `SELECT indexname FROM pg_indexes WHERE tablename = 'users';` | `idx_users_user_type_active` exists; `idx_users_role_active` does **not** exist |
| 2 | Try to insert a user with `user_type = 'moderator'` | Fails with CHECK constraint violation |
| 3 | Try to insert a user with `user_type = 'user'` (lowercase) | Fails with CHECK constraint violation |

**Result:** `[ ]`
**Comments:**

---

### DB-009 — user_proficiencies approval columns

| # | Check | Expected |
|---|-------|----------|
| 1 | `SELECT column_name FROM information_schema.columns WHERE table_name = 'user_proficiencies';` | Includes `is_approved`, `suggested_by_user_id`, `approved_by_user_id`, `approved_at` |
| 2 | `SELECT * FROM user_proficiencies WHERE created_at < '2026-06-15' AND is_approved IS NOT true;` (pre-migration rows) | 0 rows — all pre-existing rows were backfilled to `is_approved = true` |
| 3 | Insert a new row directly (or via the UI) without specifying `is_approved` | Defaults to `false` |
| 4 | A new row added via the UI's "Add Proficiency" | `suggested_by_user_id` is set to the requesting user's id |

**Result:** `[ ]`
**Comments:**

---

### DB-010 — Proficiency approval RLS scoping

| # | Check | Expected |
|---|-------|----------|
| 1 | Log in as a Mod with an approved Role A / Location A proficiency. `SELECT * FROM user_proficiencies WHERE is_approved = false;` | Only returns pending rows that match Role A / Location A |
| 2 | Log in as a Mod with **no** matching approved proficiency. Same query | Returns 0 rows |
| 3 | Log in as Admin. Same query | Returns ALL pending rows, regardless of the Admin's own proficiencies |
| 4 | As a non-matching Mod, attempt `UPDATE user_proficiencies SET is_approved = true WHERE id = '<a non-matching pending row>';` | 0 rows affected (RLS blocks it) |
| 5 | As a matching Mod, attempt the same `UPDATE` on a matching pending row | 1 row affected; succeeds |
| 6 | Log in as a plain User (not Mod/Leader/Admin) with a matching role/location proficiency. `SELECT * FROM user_proficiencies WHERE is_approved = false AND user_id != auth.uid();` | 0 rows — regular users cannot see other users' pending rows under any circumstance |

**Result:** `[ ]`
**Comments:**

---

*Last updated: 2026-06-15*
