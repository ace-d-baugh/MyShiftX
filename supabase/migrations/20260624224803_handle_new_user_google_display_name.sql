-- Backfill migration: this was already applied directly to production. Recreates
-- handle_new_user() so new OAuth (Google) sign-ups get a derived display name
-- ("Given L.") from the given_name/family_name claims instead of a null one.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_display_name text;
  v_given_name   text;
  v_family_name  text;
BEGIN
  v_given_name  := trim(NEW.raw_user_meta_data->>'given_name');
  v_family_name := trim(NEW.raw_user_meta_data->>'family_name');

  IF v_given_name IS NOT NULL AND v_given_name <> ''
     AND v_family_name IS NOT NULL AND v_family_name <> '' THEN
    v_display_name := initcap(v_given_name) || ' ' || upper(left(v_family_name, 1)) || '.';
  END IF;

  INSERT INTO public.users (id, email, display_name, email_verified, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    v_display_name,
    COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, false),
    'Guest',
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;
