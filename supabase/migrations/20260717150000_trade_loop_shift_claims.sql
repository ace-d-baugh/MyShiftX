-- Trade Loop (Task 21): shift claims with owner confirmation and reliability stats.
--
-- Lifecycle: pending → accepted | declined | withdrawn
--            accepted → completed | fell_through
--
-- Accepting a claim archives the shift post with removed_reason = 'covered' and
-- auto-declines rival pending claims. Completed / fell_through counts feed each
-- user's reliability record (the answer to ghosting).
--
-- All writes go through SECURITY DEFINER RPCs below; RLS exposes SELECT to the
-- two parties only.

CREATE TABLE public.shift_claims (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id     uuid NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  claimant_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  owner_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  board_id     uuid REFERENCES public.boards(id) ON DELETE SET NULL,
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','accepted','declined','withdrawn','completed','fell_through')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  finalized_at timestamptz
);

-- One open (pending/accepted) claim per user per shift; a declined or withdrawn
-- claimant may claim again.
CREATE UNIQUE INDEX shift_claims_one_open_per_user
  ON public.shift_claims (shift_id, claimant_id)
  WHERE status IN ('pending','accepted');

-- Only one accepted handshake per shift.
CREATE UNIQUE INDEX shift_claims_one_accepted_per_shift
  ON public.shift_claims (shift_id)
  WHERE status = 'accepted';

CREATE INDEX shift_claims_owner_idx    ON public.shift_claims (owner_id, status);
CREATE INDEX shift_claims_claimant_idx ON public.shift_claims (claimant_id, status);
CREATE INDEX shift_claims_shift_idx    ON public.shift_claims (shift_id);

ALTER TABLE public.shift_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY shift_claims_select_parties ON public.shift_claims
  FOR SELECT TO authenticated
  USING (claimant_id = auth.uid() OR owner_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies: writes happen only via the RPCs below.
REVOKE INSERT, UPDATE, DELETE ON public.shift_claims FROM anon, authenticated;

-- Shifts archived by an accepted claim get their own removal reason.
ALTER TABLE public.shifts DROP CONSTRAINT shifts_removed_reason_check;
ALTER TABLE public.shifts ADD CONSTRAINT shifts_removed_reason_check
  CHECK (removed_reason IN ('expired','leader_removed','user_removed','covered'));

-- ── RPCs ──────────────────────────────────────────────────────────────────────

-- Claimant: "I'll take this shift"
CREATE OR REPLACE FUNCTION public.claim_shift(p_shift_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_shift RECORD;
  v_claim_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, user_id, board_id, is_active, expires_at
  INTO v_shift
  FROM public.shifts
  WHERE id = p_shift_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shift not found';
  END IF;
  IF v_shift.board_id IS NULL OR v_shift.user_id IS NULL THEN
    RAISE EXCEPTION 'This shift is not open to claims';
  END IF;
  IF v_shift.user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot claim your own shift';
  END IF;
  IF NOT v_shift.is_active OR v_shift.expires_at <= now() THEN
    RAISE EXCEPTION 'This shift is no longer active';
  END IF;
  IF NOT public.is_board_member(v_shift.board_id) THEN
    RAISE EXCEPTION 'You must be a member of this board to claim this shift';
  END IF;

  INSERT INTO public.shift_claims (shift_id, claimant_id, owner_id, board_id)
  VALUES (p_shift_id, auth.uid(), v_shift.user_id, v_shift.board_id)
  RETURNING id INTO v_claim_id;

  RETURN v_claim_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'You already have an open claim on this shift';
END;
$$;

-- Owner: accept or decline a pending claim.
-- Accepting archives the post as 'covered' and auto-declines rival pending
-- claims; returns the rival claimant ids so the caller can notify them.
CREATE OR REPLACE FUNCTION public.respond_to_claim(p_claim_id uuid, p_accept boolean)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_claim RECORD;
  v_rivals uuid[] := '{}';
BEGIN
  SELECT id, shift_id, owner_id, status
  INTO v_claim
  FROM public.shift_claims
  WHERE id = p_claim_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim not found';
  END IF;
  IF v_claim.owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the shift owner can respond to this claim';
  END IF;
  IF v_claim.status <> 'pending' THEN
    RAISE EXCEPTION 'This claim has already been resolved';
  END IF;

  IF p_accept THEN
    UPDATE public.shift_claims
    SET status = 'accepted', responded_at = now()
    WHERE id = p_claim_id;

    WITH declined AS (
      UPDATE public.shift_claims
      SET status = 'declined', responded_at = now()
      WHERE shift_id = v_claim.shift_id
        AND id <> p_claim_id
        AND status = 'pending'
      RETURNING claimant_id
    )
    SELECT COALESCE(array_agg(claimant_id), '{}') INTO v_rivals FROM declined;

    UPDATE public.shifts
    SET is_active = false,
        removed_reason = 'covered',
        removed_by_user_id = auth.uid()
    WHERE id = v_claim.shift_id;
  ELSE
    UPDATE public.shift_claims
    SET status = 'declined', responded_at = now()
    WHERE id = p_claim_id;
  END IF;

  RETURN v_rivals;
END;
$$;

-- Claimant: withdraw a pending claim.
CREATE OR REPLACE FUNCTION public.withdraw_claim(p_claim_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rows integer;
BEGIN
  UPDATE public.shift_claims
  SET status = 'withdrawn', responded_at = now()
  WHERE id = p_claim_id
    AND claimant_id = auth.uid()
    AND status = 'pending';

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

-- Owner: after the handshake, record whether the trade actually went through
-- in the company system.
CREATE OR REPLACE FUNCTION public.finalize_claim(p_claim_id uuid, p_completed boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rows integer;
BEGIN
  UPDATE public.shift_claims
  SET status = CASE WHEN p_completed THEN 'completed' ELSE 'fell_through' END,
      finalized_at = now()
  WHERE id = p_claim_id
    AND owner_id = auth.uid()
    AND status = 'accepted';

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

-- Reliability stats for a set of users (wall badges, claim panels, profile).
-- Aggregate counts only — no claim details are exposed.
CREATE OR REPLACE FUNCTION public.get_trade_stats_for_users(p_user_ids uuid[])
RETURNS TABLE (user_id uuid, picked_up integer, covered integer, fell_through integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT u.uid AS user_id,
    (SELECT COUNT(*) FROM public.shift_claims c
      WHERE c.claimant_id = u.uid AND c.status = 'completed')::int AS picked_up,
    (SELECT COUNT(*) FROM public.shift_claims c
      WHERE c.owner_id = u.uid AND c.status = 'completed')::int AS covered,
    (SELECT COUNT(*) FROM public.shift_claims c
      WHERE c.claimant_id = u.uid AND c.status = 'fell_through')::int AS fell_through
  FROM unnest(p_user_ids) AS u(uid);
$$;

-- Authenticated-only execution on all trade-loop RPCs.
REVOKE ALL ON FUNCTION public.claim_shift(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_to_claim(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.withdraw_claim(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finalize_claim(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_trade_stats_for_users(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_shift(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.respond_to_claim(uuid, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.withdraw_claim(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.finalize_claim(uuid, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_trade_stats_for_users(uuid[]) TO authenticated, service_role;
