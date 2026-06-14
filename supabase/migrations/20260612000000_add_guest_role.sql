-- ============================================================
-- Add 'guest' role for unverified users.
-- Registration defaults to guest + is_active = true.
-- A DB trigger promotes guest → cast when email is verified.
-- ============================================================

-- 1. Add 'guest' to the role check constraint
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('guest', 'cast', 'copro', 'leader', 'admin'));

-- 2. Change column defaults
ALTER TABLE public.users
  ALTER COLUMN role SET DEFAULT 'guest',
  ALTER COLUMN is_active SET DEFAULT TRUE;

-- 3. Update handle_new_user to be explicit about guest + is_active
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Cast Member'),
    'guest',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 4. New trigger: promote guest → cast when Supabase confirms the email
CREATE OR REPLACE FUNCTION public.handle_email_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users
    SET role = 'cast', email_verified = true
    WHERE id = NEW.id AND role = 'guest';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_email_verified();

-- 5. One-time data fix for existing rows
--    - All users get is_active = true (is_active = false is admin-only action)
--    - Users with a confirmed email → cast + email_verified = true
--    - Users without a confirmed email → guest + email_verified = false
--    - copro / leader / admin roles are preserved
UPDATE public.users u
SET
  is_active    = true,
  email_verified = (a.email_confirmed_at IS NOT NULL),
  role = CASE
    WHEN u.role IN ('guest', 'cast') AND a.email_confirmed_at IS NOT NULL THEN 'cast'
    WHEN u.role IN ('guest', 'cast') AND a.email_confirmed_at IS     NULL THEN 'guest'
    ELSE u.role  -- keep copro / leader / admin unchanged
  END
FROM auth.users a
WHERE u.id = a.id;
