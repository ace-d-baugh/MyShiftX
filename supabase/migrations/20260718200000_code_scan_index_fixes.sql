-- 2026-07-18 code-scan fixes (performance advisor):
--
-- 1. shift_claims.board_id had a foreign key without a covering index —
--    board deletions would seq-scan claims.
-- 2. boards_slug_idx duplicated the unique constraint index boards_slug_key
--    (identical definition) — pure write overhead.
--
-- The remaining unindexed-FK findings (10, all INFO-level, mostly
-- delete-time user_id references on older tables) are listed as an optional
-- improvement in TASKS.md rather than fixed blind.

CREATE INDEX shift_claims_board_idx ON public.shift_claims (board_id);

DROP INDEX IF EXISTS public.boards_slug_idx;
