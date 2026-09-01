-- The theme CHECK constraint was never updated when kitty replaced dracula
-- and the three Overlord-only seasonal themes (christmas, halloween,
-- patriotic) were added to lib/theme.ts. Picking any of those four themes
-- applied client-side but every save to the DB failed constraint
-- user_preferences_theme_check (23514), so the pick never persisted and
-- reverted on the next preferences sync. Already applied directly to
-- production; this file just brings the migration history in sync.
ALTER TABLE public.user_preferences DROP CONSTRAINT user_preferences_theme_check;
ALTER TABLE public.user_preferences ADD CONSTRAINT user_preferences_theme_check
  CHECK (theme = ANY (ARRAY['light', 'dark', 'midnight', 'cyberpunk', 'nordic', 'kitty', 'christmas', 'halloween', 'patriotic']::text[]));
