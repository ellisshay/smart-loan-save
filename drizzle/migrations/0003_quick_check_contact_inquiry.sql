CREATE OR REPLACE FUNCTION public.save_quick_check_inquiry(_answers jsonb, _consent_version text, _ua text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _token uuid; _name text := btrim(_answers->>'firstName'); _phone text := regexp_replace(COALESCE(_answers->>'phone',''), '[[:space:]()-]', '', 'g'); _field text;
BEGIN
 IF _answers IS NULL OR jsonb_typeof(_answers) <> 'object' OR pg_column_size(_answers)>16384 THEN RAISE EXCEPTION 'Invalid answers'; END IF;
 IF _name IS NULL OR char_length(_name)<2 OR char_length(_name)>40 OR _name ~ '[[:cntrl:]<>]' THEN RAISE EXCEPTION 'Invalid name'; END IF;
 IF _phone !~ '^(05[0-9]{8}|\+9725[0-9]{8})$' THEN RAISE EXCEPTION 'Invalid phone'; END IF;
 IF COALESCE(_answers->>'goal','') NOT IN ('first','upgrade','refi') OR COALESCE(_answers->>'borrowers','') NOT IN ('1','2','3') THEN RAISE EXCEPTION 'Incomplete answers'; END IF;
 FOREACH _field IN ARRAY ARRAY['value','equity','income','obligations','balance','currentPayment','yearsLeft'] LOOP
  IF jsonb_typeof(_answers->_field) IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  IF (_answers->>_field)::numeric < 0 OR (_answers->>_field)::numeric > 100000000 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
 END LOOP;
 IF char_length(COALESCE(_answers->>'city',''))>100 OR _consent_version IS NULL OR char_length(_consent_version) NOT BETWEEN 1 AND 32 THEN RAISE EXCEPTION 'Invalid input'; END IF;
 INSERT INTO public.quiz_sessions(user_id,quiz_data,current_step,purpose,completed)
 VALUES(auth.uid(),jsonb_build_object('quick_check',_answers || jsonb_build_object('firstName',_name,'phone',_phone),'inquiry_status','estimated'),0,_answers->>'goal',false)
 RETURNING session_token INTO _token;
 INSERT INTO public.consents(user_id,session_token,consent_type,consent_version,user_agent)
 VALUES(auth.uid(),_token,'quick_check',_consent_version,left(_ua,400));
 RETURN _token;
END $$;
REVOKE ALL ON FUNCTION public.save_quick_check_inquiry(jsonb,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_quick_check_inquiry(jsonb,text,text) TO anon, authenticated, service_role;
GRANT SELECT ON public.quiz_sessions TO authenticated;
GRANT ALL ON public.quiz_sessions TO service_role;