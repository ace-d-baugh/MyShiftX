-- The approvals page fetches pending user_boards rows joined to users and
-- boards. The multi-table RLS evaluation (user_boards → boards → is_board_member
-- → user_boards again) produces zero rows even though the count-only query
-- returns the correct number. A SECURITY DEFINER function sidesteps this by
-- doing its own authorization check inline and bypassing RLS entirely.

CREATE OR REPLACE FUNCTION public.get_pending_board_requests()
RETURNS TABLE (
  id                UUID,
  board_id          UUID,
  user_id           UUID,
  requested_at      TIMESTAMPTZ,
  user_display_name TEXT,
  board_name        TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ub.id,
    ub.board_id,
    ub.user_id,
    ub.requested_at,
    u.display_name  AS user_display_name,
    b.name          AS board_name
  FROM user_boards ub
  JOIN users  u ON u.id = ub.user_id
  JOIN boards b ON b.id = ub.board_id
  WHERE ub.is_approved = false
    AND (
      -- Admins see all pending requests
      LOWER(( SELECT role FROM users WHERE id = auth.uid() )) = 'admin'
      OR
      -- Mods/Leaders see pending requests for their own boards
      EXISTS (
        SELECT 1 FROM user_boards mod_row
        WHERE mod_row.user_id   = auth.uid()
          AND mod_row.board_id  = ub.board_id
          AND mod_row.is_approved = true
          AND mod_row.role IN ('Mod', 'Leader')
      )
    )
  ORDER BY ub.requested_at ASC;
$$;
