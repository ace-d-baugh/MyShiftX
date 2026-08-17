-- Corrects a bad backfill from the previous migration in this same session.
-- 20260818000000 backfilled first_name/last_name by splitting display_name on
-- its last whitespace token -- but every existing user's display_name was
-- still "First L." (the old initial-only format; nothing had switched it to
-- full names yet), so that split produced last_name values like "B." or "C.":
-- the initial plus its trailing period, not a real last name. The actual full
-- name was never in display_name to begin with -- it was discarded by the OLD
-- trigger at signup and only ever survives in auth.users.raw_user_meta_data
-- (the OAuth/signup payload), same place WDWShiftX's own manual backfill
-- script pulled it from for this exact scenario.
--
-- This re-derives first_name/last_name from auth metadata using the same
-- given_name/family_name-first, full_name/name-fallback logic as
-- handle_new_user(), and only overwrites a row when a real name is actually
-- derivable -- a user with no usable metadata (no given/family/full_name/name
-- at all) keeps whatever the previous migration left rather than being
-- blanked out. display_name is brought in line with the same full-name
-- format at the same time, since that's the whole point of this port (#13).
--
-- Reviewed via a SELECT dry run before this ran: 16 of 17 users had a real
-- name recoverable; the 17th (an account with no OAuth metadata at all) is
-- left as-is and can be corrected by hand in Profile if desired.

WITH derived AS (
  SELECT
    u.id,
    CASE
      WHEN NULLIF(trim(au.raw_user_meta_data->>'given_name'), '') IS NOT NULL
       AND NULLIF(trim(au.raw_user_meta_data->>'family_name'), '') IS NOT NULL
        THEN initcap(trim(au.raw_user_meta_data->>'given_name'))
      WHEN trim(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', '')) ~ ' '
        THEN initcap(regexp_replace(
               trim(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name')),
               '\s+\S+$', ''))
      ELSE NULL
    END AS new_first_name,
    CASE
      WHEN NULLIF(trim(au.raw_user_meta_data->>'given_name'), '') IS NOT NULL
       AND NULLIF(trim(au.raw_user_meta_data->>'family_name'), '') IS NOT NULL
        THEN initcap(trim(au.raw_user_meta_data->>'family_name'))
      WHEN trim(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', '')) ~ ' '
        THEN initcap((regexp_split_to_array(
               trim(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name')), '\s+'
             ))[array_length(regexp_split_to_array(
               trim(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name')), '\s+'
             ), 1)])
      ELSE NULL
    END AS new_last_name
  FROM public.users u
  JOIN auth.users au ON au.id = u.id
)
UPDATE public.users u
SET
  first_name   = d.new_first_name,
  last_name    = d.new_last_name,
  display_name = d.new_first_name || ' ' || d.new_last_name
FROM derived d
WHERE u.id = d.id
  AND d.new_first_name IS NOT NULL
  AND d.new_last_name IS NOT NULL;
