-- SECURITY DEFINER functions for deactivating the caller's own posts.
-- The direct UPDATE via RLS fails because auth.uid() resolves as NULL
-- during the WITH CHECK evaluation in the SSR server-action context.
-- SECURITY DEFINER functions bypass RLS and do the ownership check in
-- the WHERE clause directly, consistent with every other write helper
-- in this project (get_pending_board_requests, transferBoardOwnership, etc.).

CREATE OR REPLACE FUNCTION public.deactivate_own_shift(p_shift_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE public.shifts
  SET    is_active = false
  WHERE  id = p_shift_id
    AND  user_id = auth.uid();

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_own_request(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE public.requests
  SET    is_active = false
  WHERE  id = p_request_id
    AND  user_id = auth.uid();

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;
