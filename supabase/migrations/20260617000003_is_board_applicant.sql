-- The EXISTS subquery inside the boards_select_member policy can silently
-- return no rows because it runs without SECURITY DEFINER, leaving user_boards
-- RLS subject to evaluation order issues. Replace it with a SECURITY DEFINER
-- helper (same pattern as is_board_member) so it bypasses RLS explicitly.

CREATE OR REPLACE FUNCTION public.is_board_applicant(p_board_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_boards
    WHERE user_id  = auth.uid()
      AND board_id = p_board_id
      AND is_approved = false
  )
$$;

DROP POLICY IF EXISTS "boards_select_member" ON public.boards;

CREATE POLICY "boards_select_member"
  ON public.boards FOR SELECT
  USING (
    created_by = auth.uid()
    OR is_board_member(id)
    OR is_board_applicant(id)
    OR get_user_role() = 'admin'
  );
