-- Code-scan addendum: shifts.user_id and requests.user_id are filtered on in
-- nearly every calendar/profile/count query but had no index (flagged as
-- unindexed FKs by the performance advisor). Tiny tables today, but these two
-- are unambiguous hot paths — index them now.

CREATE INDEX shifts_user_id_idx   ON public.shifts (user_id);
CREATE INDEX requests_user_id_idx ON public.requests (user_id);
