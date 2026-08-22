-- Profile pictures: first Supabase Storage bucket in this project. Public-read
-- (avatars aren't sensitive, and a public bucket means <img> tags load the
-- URL directly with no signed-URL dance), write-restricted to each user's own
-- <user_id>/ path prefix. The client always re-encodes to JPEG before upload
-- and always writes to the same path (avatars/<user_id>/avatar.jpg), so a
-- re-upload is a clean overwrite -- no orphaned files to clean up later.
--
-- Strictly additive: ON CONFLICT DO NOTHING on the bucket, ADD COLUMN IF NOT
-- EXISTS on the column, and the DROP POLICY IF EXISTS lines below only ever
-- name policies this migration itself creates (storage.objects had zero
-- policies before this ran -- verified). Nothing pre-existing is touched.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- storage.foldername(name) splits the object path on '/' -- [1] is the first
-- segment, i.e. the <user_id> prefix. Anyone can read (public bucket, covers
-- both anon and authenticated, which is what makes another member's photo
-- load in a Wall card and in the lightbox); only the owning user can create,
-- update, or delete their own.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- users.avatar_url stores the full public Storage URL, with a ?v=<timestamp>
-- query string appended on every upload -- the object path never changes
-- (clean overwrite above), so without a cache-busting query string a
-- re-uploaded photo would keep showing the old cached image to anyone who'd
-- already loaded it.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;

-- This app uses explicit column-level SELECT grants on public.users instead of
-- table-wide (see 20260701152710 and the S8 lockdown) -- a new column has no
-- grant until it's added here, and selecting it fails the WHOLE query with
-- "permission denied for table users", not just that column. Mirrors the
-- grantee list every other readable column on this table uses.
GRANT SELECT (avatar_url) ON public.users TO anon, authenticated;
