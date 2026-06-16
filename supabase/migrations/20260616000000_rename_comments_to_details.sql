-- ============================================================
-- Rename "comments" to "details" on shifts and requests
-- ============================================================

ALTER TABLE shifts RENAME COLUMN comments TO details;
ALTER TABLE requests RENAME COLUMN comments TO details;
