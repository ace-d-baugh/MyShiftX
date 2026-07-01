-- Users could never read back their own previously-submitted survey row
-- (only service_role had SELECT), so the client-side "already submitted"
-- duplicate check always returned false even for repeat visitors — they'd
-- see the form again and hit a raw unique-constraint error on resubmission
-- instead of a friendly "you already submitted" message.
CREATE POLICY "Users can read their own survey response" ON public.beta_survey_responses
  FOR SELECT USING (auth.uid() = user_id);
