-- Code-scan optional improvement: the 9 remaining INFO-level unindexed
-- foreign keys. Mostly delete-time and moderation-page lookups — cheap to
-- carry, and clears the advisor's unindexed_foreign_keys findings entirely.

CREATE INDEX boards_created_by_idx           ON public.boards (created_by);
CREATE INDEX comments_user_id_idx            ON public.comments (user_id);
CREATE INDEX flags_board_id_idx              ON public.flags (board_id);
CREATE INDEX flags_flagged_by_user_id_idx    ON public.flags (flagged_by_user_id);
CREATE INDEX flags_resolved_by_user_id_idx   ON public.flags (resolved_by_user_id);
CREATE INDEX messages_sender_id_idx          ON public.messages (sender_id);
CREATE INDEX requests_removed_by_user_id_idx ON public.requests (removed_by_user_id);
CREATE INDEX shifts_removed_by_user_id_idx   ON public.shifts (removed_by_user_id);
CREATE INDEX user_boards_approved_by_idx     ON public.user_boards (approved_by_user_id);
