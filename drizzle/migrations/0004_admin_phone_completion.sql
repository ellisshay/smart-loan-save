CREATE OR REPLACE FUNCTION public.update_case_safe(_case_id uuid, _intake_data jsonb DEFAULT NULL::jsonb, _current_step integer DEFAULT NULL::integer, _goal text DEFAULT NULL::text, _selected_mix text DEFAULT NULL::text, _case_type case_type DEFAULT NULL::case_type)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _owner boolean;
BEGIN
  _owner := EXISTS (SELECT 1 FROM cases WHERE id = _case_id AND user_id = auth.uid());
  IF NOT _owner AND NOT public.is_admin() THEN
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
  IF NOT _owner THEN
    INSERT INTO audit_log(user_id, role, case_id, action, object_type, object_id, metadata, success)
    VALUES (auth.uid(), 'admin', _case_id, 'admin_edit_intake', 'case', _case_id::text, '{}'::jsonb, true);
  END IF;
END; $function$;

CREATE OR REPLACE FUNCTION public.submit_case_safe(_case_id uuid, _goal text DEFAULT NULL::text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cases WHERE id = _case_id AND user_id = auth.uid()) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  UPDATE cases SET
    intake_complete = true,
    goal = COALESCE(_goal, goal),
    status = CASE WHEN status = 'Draft' THEN 'WaitingForPayment'::case_status ELSE status END,
    updated_at = now()
  WHERE id = _case_id;
END; $function$;