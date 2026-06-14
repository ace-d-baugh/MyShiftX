-- ============================================================
-- Fix functions, triggers, and RLS policies after renaming
-- users.role → users.user_type with capitalized values.
-- ============================================================

-- 1. Fix handle_new_user: insert user_type = 'Guest' (was role = 'guest')
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
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Cast Member'),
    'Guest',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Fix handle_email_verified: promote Guest → Cast on email confirmation
CREATE OR REPLACE FUNCTION public.handle_email_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users
    SET user_type = 'Cast', email_verified = true
    WHERE id = NEW.id AND user_type = 'Guest';
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Fix get_user_role: read user_type and return lowercase for RLS policy compatibility
--    All existing policies compare against lowercase strings ('cast', 'leader', etc.)
--    so we LOWER() the value to avoid recreating every policy.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LOWER(user_type) FROM public.users WHERE id = auth.uid()
$$;

-- 4. Fix RLS policies that directly reference the role column (not via get_user_role).
--    Only two policies do this: users_update_leader and users_update_copro.

DROP POLICY IF EXISTS "users_update_leader" ON public.users;
CREATE POLICY "users_update_leader"
  ON public.users FOR UPDATE
  USING (
    get_user_role() = 'leader'
    AND user_type IN ('Cast', 'CoPro', 'Leader')
  )
  WITH CHECK (
    get_user_role() = 'leader'
    AND user_type IN ('Cast', 'CoPro', 'Leader')
  );

DROP POLICY IF EXISTS "users_update_copro" ON public.users;
CREATE POLICY "users_update_copro"
  ON public.users FOR UPDATE
  USING (
    get_user_role() = 'copro'
    AND user_type = 'CoPro'
    AND id <> auth.uid()
  )
  WITH CHECK (
    get_user_role() = 'copro'
    AND user_type = 'CoPro'
  );
