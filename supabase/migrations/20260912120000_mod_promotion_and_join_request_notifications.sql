-- Adds notification types for board-role promotions and pending join
-- requests. The CHECK constraint is unnamed-turned-named
-- (notifications_type_check), so it must be dropped and recreated rather
-- than altered in place.
ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'shift_match'::text, 'interest'::text, 'comment'::text,
    'claim_created'::text, 'claim_resolved'::text, 'claim_finalized'::text,
    'board_approved'::text, 'board_announcement'::text,
    'mod_promoted'::text, 'leader_promoted'::text, 'join_request'::text
  ]));
