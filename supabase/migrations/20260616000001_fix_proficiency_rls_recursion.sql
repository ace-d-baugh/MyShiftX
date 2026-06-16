-- ============================================================
-- Fix infinite recursion in user_proficiencies RLS policies
-- proficiencies_select_pending_approvers / _update_approvers / _delete_approvers
-- each ran a correlated subquery against user_proficiencies from within a
-- policy defined on user_proficiencies itself. Postgres must evaluate every
-- permissive SELECT policy on the table for any query against it, so the
-- subquery re-triggered the same policy and recursed (error 42P17), which
-- PostgREST surfaced as a 500 even for a user fetching only their own rows.
--
-- Fix: move the self-referential check into a SECURITY DEFINER function,
-- the same pattern already used by get_user_role() to read public.users
-- without re-triggering RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_approved_proficiency(p_role_id uuid, p_location_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_proficiencies
    WHERE user_id = auth.uid()
      AND role_id = p_role_id
      AND location_id = p_location_id
      AND is_approved = true
  )
$$;

DROP POLICY IF EXISTS "proficiencies_select_pending_approvers" ON public.user_proficiencies;
CREATE POLICY "proficiencies_select_pending_approvers"
  ON public.user_proficiencies FOR SELECT
  USING (
    is_approved = false
    AND (
      get_user_role() = 'admin'
      OR (
        get_user_role() IN ('mod', 'leader')
        AND public.has_approved_proficiency(role_id, location_id)
      )
    )
  );

DROP POLICY IF EXISTS "proficiencies_update_approvers" ON public.user_proficiencies;
CREATE POLICY "proficiencies_update_approvers"
  ON public.user_proficiencies FOR UPDATE
  USING (
    is_approved = false
    AND (
      get_user_role() = 'admin'
      OR (
        get_user_role() IN ('mod', 'leader')
        AND public.has_approved_proficiency(role_id, location_id)
      )
    )
  )
  WITH CHECK (
    get_user_role() = 'admin'
    OR (
      get_user_role() IN ('mod', 'leader')
      AND public.has_approved_proficiency(role_id, location_id)
    )
  );

DROP POLICY IF EXISTS "proficiencies_delete_approvers" ON public.user_proficiencies;
CREATE POLICY "proficiencies_delete_approvers"
  ON public.user_proficiencies FOR DELETE
  USING (
    is_approved = false
    AND (
      get_user_role() = 'admin'
      OR (
        get_user_role() IN ('mod', 'leader')
        AND public.has_approved_proficiency(role_id, location_id)
      )
    )
  );
