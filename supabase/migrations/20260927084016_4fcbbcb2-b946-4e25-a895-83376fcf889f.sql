CREATE OR REPLACE FUNCTION public.submit_case_safe(_case_id uuid, _goal text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cases WHERE id = _case_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  UPDATE cases SET
    intake_complete = true,
    goal = COALESCE(_goal, goal),
    status = CASE WHEN status = 'Draft' THEN 'WaitingForPayment'::case_status ELSE status END,
    updated_at = now()
  WHERE id = _case_id;
END; $$;
REVOKE EXECUTE ON FUNCTION public.submit_case_safe(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.submit_case_safe(uuid, text) TO authenticated;