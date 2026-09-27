CREATE OR REPLACE FUNCTION public.check_sla_start()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.payment_succeeded = true AND NEW.intake_complete = true AND NEW.sla_started_at IS NULL THEN
    NEW.sla_started_at = now();
    NEW.sla_due_at = now() + interval '72 hours';
    NEW.status = 'WaitingForDocs';
  END IF;
  RETURN NEW;
END;
$function$;