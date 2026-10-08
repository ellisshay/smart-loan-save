CREATE SEQUENCE IF NOT EXISTS public.case_number_seq;
SELECT setval('public.case_number_seq', GREATEST(1001, (SELECT COALESCE(MAX(NULLIF(regexp_replace(case_number,'\D','','g'),'')::int),1000) FROM public.cases)));
CREATE OR REPLACE FUNCTION public.generate_case_number()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  NEW.case_number = 'CASE-' || nextval('public.case_number_seq');
  RETURN NEW;
END;
$function$;