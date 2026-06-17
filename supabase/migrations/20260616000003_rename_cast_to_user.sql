-- ============================================================
-- Rename user_type 'Cast' -> 'User' (MyShiftX rebrand: dropping
-- Disney-specific "Cast Member" terminology for generic "User")
-- ============================================================

-- 1. Update user_types lookup table
UPDATE user_types SET name = 'User' WHERE name = 'Cast';

-- 2. Drop CHECK constraint on users.user_type before updating existing rows,
--    since the old constraint only allows 'Cast' and would reject 'User'.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;

-- 3. Update existing users
UPDATE users SET user_type = 'User' WHERE user_type = 'Cast';

-- 4. Re-add CHECK constraint on users.user_type with 'User'
ALTER TABLE users ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('Guest', 'User', 'Mod', 'Leader', 'Admin'));

-- 5. users_update_leader referenced 'Cast' directly — recreate with 'User'
DROP POLICY IF EXISTS "users_update_leader" ON public.users;
CREATE POLICY "users_update_leader"
  ON public.users FOR UPDATE
  USING (
    get_user_role() = 'leader'
    AND user_type IN ('User', 'Mod', 'Leader')
  )
  WITH CHECK (
    get_user_role() = 'leader'
    AND user_type IN ('User', 'Mod', 'Leader')
  );

-- 6. handle_new_user: display_name fallback 'Cast Member' -> 'User'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, user_type, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
    'Guest',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 7. handle_email_verified: promote Guest -> User (was Guest -> Cast) on email confirmation
CREATE OR REPLACE FUNCTION public.handle_email_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users
    SET user_type = 'User', email_verified = true
    WHERE id = NEW.id AND user_type = 'Guest';
  END IF;
  RETURN NEW;
END;
$$;
