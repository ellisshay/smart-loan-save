
-- 1. Create a SECURITY DEFINER function for safe case updates (user-facing fields only)
CREATE OR REPLACE FUNCTION public.update_case_safe(
  _case_id uuid,
  _intake_data jsonb DEFAULT NULL,
  _current_step integer DEFAULT NULL,
  _goal text DEFAULT NULL,
  _selected_mix text DEFAULT NULL,
  _case_type case_type DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow the case owner to update
  IF NOT EXISTS (SELECT 1 FROM cases WHERE id = _case_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE cases SET
    intake_data = COALESCE(_intake_data, intake_data),
    current_step = COALESCE(_current_step, current_step),
    goal = COALESCE(_goal, goal),
    selected_mix = COALESCE(_selected_mix, selected_mix),
    case_type = COALESCE(_case_type, case_type),
    updated_at = now()
  WHERE id = _case_id;
END;
$$;

-- 2. Drop the old permissive UPDATE policy on cases for regular users
DROP POLICY IF EXISTS "Users can update own cases" ON public.cases;

-- 3. Create a restrictive UPDATE policy - only admins can update directly
CREATE POLICY "Only admins can update cases directly"
ON public.cases
FOR UPDATE
TO authenticated
USING (is_admin());

-- 4. Remove the user INSERT policy on case_events (events should only come from edge functions/service role)
DROP POLICY IF EXISTS "System can insert events" ON public.case_events;

-- 5. Add a SELECT policy so case owners can view their own events
CREATE POLICY "Users can view own case events"
ON public.case_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = case_events.case_id
    AND (cases.user_id = auth.uid() OR is_admin())
  )
);
