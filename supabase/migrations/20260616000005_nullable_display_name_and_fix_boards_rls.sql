-- ============================================================
-- 1. Make display_name nullable
--    Users set their display name in the profile page; the
--    auth trigger should not invent a placeholder value.
-- ============================================================

ALTER TABLE public.users ALTER COLUMN display_name DROP NOT NULL;

-- Reset the placeholder 'User' default that the trigger used to insert
UPDATE public.users SET display_name = NULL WHERE display_name = 'User';

-- ── Update handle_new_user: stop writing display_name ────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, is_active)
  VALUES (NEW.id, NEW.email, 'Guest', true)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. Ensure get_user_role() returns lowercase
--    An older version of this function returned mixed-case
--    ('User') which does not match the policy's ('user','admin')
--    check, causing an RLS violation on board creation.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LOWER(role) FROM public.users WHERE id = auth.uid()
$$;

-- ============================================================
-- 3. Re-create all boards RLS policies from scratch
--    Handles the case where the boards_system migration
--    partially applied or was never applied.
-- ============================================================

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boards_select_member"  ON public.boards;
DROP POLICY IF EXISTS "boards_insert_user"    ON public.boards;
DROP POLICY IF EXISTS "boards_update_leader"  ON public.boards;
DROP POLICY IF EXISTS "boards_delete_leader"  ON public.boards;

CREATE POLICY "boards_select_member"
  ON public.boards FOR SELECT
  USING (is_board_member(id) OR get_user_role() = 'admin');

CREATE POLICY "boards_insert_user"
  ON public.boards FOR INSERT
  WITH CHECK (get_user_role() IN ('user', 'admin'));

CREATE POLICY "boards_update_leader"
  ON public.boards FOR UPDATE
  USING    (is_board_leader(id) OR get_user_role() = 'admin')
  WITH CHECK (is_board_leader(id) OR get_user_role() = 'admin');

CREATE POLICY "boards_delete_leader"
  ON public.boards FOR DELETE
  USING (is_board_leader(id) OR get_user_role() = 'admin');

-- ── Re-create user_boards policies too (same root cause) ────

ALTER TABLE public.user_boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_boards_select_own"        ON public.user_boards;
DROP POLICY IF EXISTS "user_boards_select_moderator"  ON public.user_boards;
DROP POLICY IF EXISTS "user_boards_select_admin"      ON public.user_boards;
DROP POLICY IF EXISTS "user_boards_insert_own"        ON public.user_boards;
DROP POLICY IF EXISTS "user_boards_update_moderator"  ON public.user_boards;
DROP POLICY IF EXISTS "user_boards_delete_self"       ON public.user_boards;
DROP POLICY IF EXISTS "user_boards_delete_moderator"  ON public.user_boards;

CREATE POLICY "user_boards_select_own"
  ON public.user_boards FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_boards_select_moderator"
  ON public.user_boards FOR SELECT
  USING (is_board_moderator(board_id));

CREATE POLICY "user_boards_select_admin"
  ON public.user_boards FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "user_boards_insert_own"
  ON public.user_boards FOR INSERT
  WITH CHECK (user_id = auth.uid() AND get_user_role() IN ('user', 'admin'));

CREATE POLICY "user_boards_update_moderator"
  ON public.user_boards FOR UPDATE
  USING    (is_board_moderator(board_id) OR get_user_role() = 'admin')
  WITH CHECK (is_board_moderator(board_id) OR get_user_role() = 'admin');

CREATE POLICY "user_boards_delete_self"
  ON public.user_boards FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "user_boards_delete_moderator"
  ON public.user_boards FOR DELETE
  USING (is_board_moderator(board_id) OR get_user_role() = 'admin');
