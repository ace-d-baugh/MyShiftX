-- ============================================================
-- Proficiency approval workflow
-- A new user's proficiency is pending until a Mod/Leader who already
-- holds the same (role, location) — or any Admin — approves it. Until
-- approved, it grants no board visibility and no posting access.
-- ============================================================

-- 1. Add approval columns, mirroring the existing roles/locations pattern
ALTER TABLE user_proficiencies
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS suggested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 2. Grandfather existing proficiencies so current users don't lose board access
UPDATE user_proficiencies SET is_approved = true, approved_at = NOW() WHERE is_approved = false;

-- 3. Tighten the old blanket leader/admin SELECT policy to approved rows only —
--    pending rows are now governed by the scoped policy below.
DROP POLICY IF EXISTS "proficiencies_select_leaders" ON public.user_proficiencies;
CREATE POLICY "proficiencies_select_leaders"
  ON public.user_proficiencies FOR SELECT
  USING (
    is_approved = true
    AND get_user_role() IN ('leader', 'admin')
  );

-- 4. Mods/Leaders who already hold the matching (role, location) — or any Admin —
--    can see pending proficiency requests awaiting approval.
CREATE POLICY "proficiencies_select_pending_approvers"
  ON public.user_proficiencies FOR SELECT
  USING (
    is_approved = false
    AND (
      get_user_role() = 'admin'
      OR (
        get_user_role() IN ('mod', 'leader')
        AND EXISTS (
          SELECT 1 FROM public.user_proficiencies up
          WHERE up.user_id = auth.uid()
            AND up.role_id = user_proficiencies.role_id
            AND up.location_id = user_proficiencies.location_id
            AND up.is_approved = true
        )
      )
    )
  );

-- 5. The same matching rule governs who can approve (UPDATE) a pending request.
CREATE POLICY "proficiencies_update_approvers"
  ON public.user_proficiencies FOR UPDATE
  USING (
    is_approved = false
    AND (
      get_user_role() = 'admin'
      OR (
        get_user_role() IN ('mod', 'leader')
        AND EXISTS (
          SELECT 1 FROM public.user_proficiencies up
          WHERE up.user_id = auth.uid()
            AND up.role_id = user_proficiencies.role_id
            AND up.location_id = user_proficiencies.location_id
            AND up.is_approved = true
        )
      )
    )
  )
  WITH CHECK (
    get_user_role() = 'admin'
    OR (
      get_user_role() IN ('mod', 'leader')
      AND EXISTS (
        SELECT 1 FROM public.user_proficiencies up
        WHERE up.user_id = auth.uid()
          AND up.role_id = user_proficiencies.role_id
          AND up.location_id = user_proficiencies.location_id
          AND up.is_approved = true
      )
    )
  );

-- 6. The same matching rule governs who can reject (DELETE) a pending request,
--    in addition to the existing proficiencies_delete_own policy.
CREATE POLICY "proficiencies_delete_approvers"
  ON public.user_proficiencies FOR DELETE
  USING (
    is_approved = false
    AND (
      get_user_role() = 'admin'
      OR (
        get_user_role() IN ('mod', 'leader')
        AND EXISTS (
          SELECT 1 FROM public.user_proficiencies up
          WHERE up.user_id = auth.uid()
            AND up.role_id = user_proficiencies.role_id
            AND up.location_id = user_proficiencies.location_id
            AND up.is_approved = true
        )
      )
    )
  );
