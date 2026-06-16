-- ============================================================
-- Rename user_type 'CoPro' -> 'Mod' (Moderator / Manager On Duty)
-- ============================================================

-- 1. Update user_types lookup table
UPDATE user_types SET name = 'Mod' WHERE name = 'CoPro';

-- 2. Drop CHECK constraint on users.user_type before updating existing rows,
--    since the old constraint only allows 'CoPro' and would reject 'Mod'.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;

-- 3. Update existing users
UPDATE users SET user_type = 'Mod' WHERE user_type = 'CoPro';

-- 4. Re-add CHECK constraint on users.user_type with 'Mod'
ALTER TABLE users ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('Guest', 'Cast', 'Mod', 'Leader', 'Admin'));

-- 4. users_update_leader referenced 'CoPro' directly — recreate with 'Mod'
DROP POLICY IF EXISTS "users_update_leader" ON public.users;
CREATE POLICY "users_update_leader"
  ON public.users FOR UPDATE
  USING (
    get_user_role() = 'leader'
    AND user_type IN ('Cast', 'Mod', 'Leader')
  )
  WITH CHECK (
    get_user_role() = 'leader'
    AND user_type IN ('Cast', 'Mod', 'Leader')
  );

-- 5. Rename users_update_copro -> users_update_mod
DROP POLICY IF EXISTS "users_update_copro" ON public.users;
CREATE POLICY "users_update_mod"
  ON public.users FOR UPDATE
  USING (
    get_user_role() = 'mod'
    AND user_type = 'Mod'
    AND id <> auth.uid()
  )
  WITH CHECK (
    get_user_role() = 'mod'
    AND user_type = 'Mod'
  );

-- 6. Moderation policies on shifts/requests compared get_user_role() to 'copro'
--    get_user_role() now returns LOWER(user_type), so 'Mod' -> 'mod'.
DROP POLICY IF EXISTS "shifts_update_moderator" ON public.shifts;
CREATE POLICY "shifts_update_moderator"
  ON public.shifts FOR UPDATE
  USING (get_user_role() IN ('mod', 'leader', 'admin'));

DROP POLICY IF EXISTS "requests_update_moderator" ON public.requests;
CREATE POLICY "requests_update_moderator"
  ON public.requests FOR UPDATE
  USING (get_user_role() IN ('mod', 'leader', 'admin'));
