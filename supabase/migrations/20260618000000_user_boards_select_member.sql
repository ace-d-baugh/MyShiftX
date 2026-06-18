-- Allow any approved board member to see all other members of the same board.
-- Previously only moderators/admins could see the full member list.
-- This is required for the /boards page where all members can view the roster.

CREATE POLICY "user_boards_select_member"
  ON public.user_boards FOR SELECT
  USING (is_board_member(board_id));
