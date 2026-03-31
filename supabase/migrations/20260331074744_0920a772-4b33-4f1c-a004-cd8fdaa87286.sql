
-- Allow advisors to view profiles of clients whose leads they purchased
CREATE POLICY "Advisors can view purchased lead client profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    JOIN public.lead_purchases lp ON lp.lead_id = l.id
    WHERE l.client_id = profiles.user_id
    AND lp.advisor_id = auth.uid()
  )
);
