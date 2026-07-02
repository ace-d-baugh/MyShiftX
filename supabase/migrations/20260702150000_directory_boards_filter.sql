-- Task 19 follow-up: board filter in the "Start a chat" directory.
-- The directory now returns which shared boards each user belongs to, and
-- excludes hidden memberships on BOTH sides: admins are auto-added to every
-- board with is_hidden = true (auto_add_admins_to_board), and those rows
-- must not make an admin appear in the directory — only boards they joined
-- explicitly (is_hidden = false) count.

DROP FUNCTION public.get_messageable_users();

CREATE FUNCTION public.get_messageable_users()
RETURNS TABLE (user_id uuid, display_name text, board_ids uuid[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.display_name, array_agg(DISTINCT mine.board_id)
  FROM user_boards mine
  JOIN user_boards theirs ON theirs.board_id = mine.board_id
    AND theirs.is_approved = true AND theirs.is_hidden = false
  JOIN users u ON u.id = theirs.user_id AND u.is_active = true
  WHERE mine.user_id = auth.uid()
    AND mine.is_approved = true
    AND mine.is_hidden = false
    AND theirs.user_id <> auth.uid()
  GROUP BY u.id, u.display_name
  ORDER BY u.display_name
$$;
