-- ============================================================
-- Fix: board creator can SELECT their board immediately
--
-- When createBoard() does .insert().select('id'), PostgreSQL
-- applies the SELECT RLS policy to the RETURNING clause.
-- The creator isn't in user_boards yet, so is_board_member()
-- returns FALSE and PostgreSQL raises "new row violates
-- row-level security policy for table boards".
--
-- Fix: add created_by = auth.uid() to the SELECT policy so
-- the creator can read the board before being added as a member.
-- ============================================================

DROP POLICY IF EXISTS "boards_select_member" ON public.boards;

CREATE POLICY "boards_select_member"
  ON public.boards FOR SELECT
  USING (
    created_by = auth.uid()
    OR is_board_member(id)
    OR get_user_role() = 'admin'
  );
