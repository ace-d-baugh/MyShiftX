-- Users with a pending join request (is_approved = false) cannot see the
-- board row because is_board_member() only returns true for approved members.
-- The boards join in loadBoards() therefore returns null for those rows,
-- leaving the board name blank in the Pending Requests list.
--
-- Fix: also allow SELECT when the user has any user_boards entry for the
-- board, regardless of approval status.

DROP POLICY IF EXISTS "boards_select_member" ON public.boards;

CREATE POLICY "boards_select_member"
  ON public.boards FOR SELECT
  USING (
    created_by = auth.uid()
    OR is_board_member(id)
    OR get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.user_boards
      WHERE user_id  = auth.uid()
        AND board_id = id
    )
  );
