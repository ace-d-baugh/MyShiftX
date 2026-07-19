-- Task 22 v3: let pending board members build their calendar before approval.
--
-- Onboarding imports a schedule while the user's join request is still
-- waiting on a leader, so INSERT must accept a board the user is *pending* in
-- (and personal, board-less shifts). The wall stays approved-members-only:
-- a trigger blocks trade/giveaway flags on boards where the current user
-- isn't an approved member, both at insert and when flipping the flags later.
-- (Wall SELECT policies already require approved membership, so pending
-- users' calendar shifts were never visible to others.)

DROP POLICY shifts_insert_member ON public.shifts;
CREATE POLICY shifts_insert_member ON public.shifts
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      board_id IS NULL
      OR is_board_member(board_id)
      OR is_board_applicant(board_id)
    )
  );

CREATE OR REPLACE FUNCTION public.enforce_wall_post_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- No session user = service role / cron / definer context — not a wall post
  -- attempt by an end user, so let it through (e.g. expire_shifts updates).
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF (NEW.is_trade OR NEW.is_giveaway)
     AND NEW.board_id IS NOT NULL
     -- On UPDATE, only enforce when the wall flags or board actually change,
     -- so unrelated edits (deactivation, title fixes by mods) never trip it.
     AND (TG_OP = 'INSERT'
          OR OLD.is_trade    IS DISTINCT FROM NEW.is_trade
          OR OLD.is_giveaway IS DISTINCT FROM NEW.is_giveaway
          OR OLD.board_id    IS DISTINCT FROM NEW.board_id)
     AND NOT public.is_board_member(NEW.board_id) THEN
    RAISE EXCEPTION 'You must be an approved member of this board to post shifts to the wall';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER shifts_wall_post_membership
  BEFORE INSERT OR UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_wall_post_membership();

-- Trigger-only function — not callable via PostgREST RPC (project convention).
REVOKE ALL ON FUNCTION public.enforce_wall_post_membership() FROM PUBLIC, anon, authenticated;
