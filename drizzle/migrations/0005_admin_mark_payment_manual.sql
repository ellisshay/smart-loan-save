CREATE OR REPLACE FUNCTION public.admin_mark_payment(_case_id uuid, _method text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _method NOT IN ('cash', 'bank_transfer', 'test') THEN
    RAISE EXCEPTION 'invalid method';
  END IF;
  UPDATE public.cases
  SET payment_succeeded = true,
      status = 'PaymentSucceeded',
      updated_at = now()
  WHERE id = _case_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'case not found';
  END IF;
  PERFORM public.log_audit('admin_payment_marked', 'case', _case_id::text, _case_id,
    jsonb_build_object('method', _method), true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_mark_payment(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_mark_payment(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_payment(uuid, text) TO service_role;