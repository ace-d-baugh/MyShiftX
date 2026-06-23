-- Add request_title column to requests table.
-- Existing rows default to 'Shift Wanted' to match the form's default value.

ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS request_title TEXT NOT NULL DEFAULT 'Shift Wanted';
