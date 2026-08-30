-- boards.slug now carries a random suffix (app-side, see lib/slug.ts) so it no
-- longer needs a unique board name to stay collision-free. Drop the UNIQUE
-- constraint on name so multiple boards (e.g. different franchise locations)
-- can share the same name.
ALTER TABLE public.boards DROP CONSTRAINT boards_name_key;
