-- Shifts can now be personal calendar entries (not trade or giveaway).
-- The wall should only show trade/giveaway shifts; personal shifts are only
-- visible to the owner via a new shifts_select_own policy.

-- 1. Owner can always see their own shifts (for the calendar view)
CREATE POLICY "shifts_select_own"
  ON public.shifts FOR SELECT
  USING (user_id = auth.uid());

-- 2. Board members only see public (trade or giveaway) shifts —
--    personal calendar entries stay private.
DROP POLICY IF EXISTS "shifts_select_member" ON public.shifts;

CREATE POLICY "shifts_select_member"
  ON public.shifts FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND is_board_member(board_id)
    AND (is_trade = true OR is_giveaway = true)
  );
