-- SECURITY-B (P0). Tested first on an isolated staging database with synthetic data.
-- Does not touch Tranzila/payment logic, quiz session reads, or any existing data.

-- ─────────────────────────────────────────────────────────────
-- 1. Documents: a customer may only reference files inside their own case folder.
--    (Prevents attaching another customer's storage path; see analyze-document.)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can upload own docs" ON public.case_documents;
CREATE POLICY "Users can upload own docs" ON public.case_documents FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_documents.case_id AND cases.user_id = auth.uid())
  AND case_documents.file_path LIKE auth.uid()::text || '/' || case_documents.case_id::text || '/%'
  AND position('..' in case_documents.file_path) = 0
);

-- Customers no longer write to storage directly: uploads go through the upload-document
-- Edge Function, which validates the file's bytes, size and type and generates the object name.
DROP POLICY IF EXISTS "Users can upload own case docs" ON storage.objects;

-- Bucket-level defence in depth (the Edge Function is the primary check).
UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp']
WHERE id = 'case-documents';

-- Staff bank files (tender/<case_id>/...): V1 allows PDF, JPG/JPEG and PNG only.
-- Word/Excel are converted to PDF by staff before upload (smallest attack surface).
-- Same access rule as before (can_manage_case); only the allowed file names are narrowed.
DROP POLICY IF EXISTS "tender files staff" ON storage.objects;
CREATE POLICY "tender files staff" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'case-documents' AND (storage.foldername(name))[1] = 'tender'
       AND public.can_manage_case(((storage.foldername(name))[2])::uuid))
WITH CHECK (bucket_id = 'case-documents' AND (storage.foldername(name))[1] = 'tender'
       AND public.can_manage_case(((storage.foldername(name))[2])::uuid)
       AND lower(name) ~ '\.(pdf|jpe?g|png)$');

-- ─────────────────────────────────────────────────────────────
-- 2. Reviewed documents are protected evidence.
--    Locked when staff verified/approved the document, or once the case is with the banks.
--    A rejected document (needs a new scan) can still be replaced by the customer.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.document_locked(_ai jsonb, _case_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(_ai->'manual_review'->>'decision', '') IN ('manual_verified', 'mismatch_approved')
      OR EXISTS (SELECT 1 FROM cases c WHERE c.id = _case_id
                 AND c.status IN ('SentToBank','BankOfferReceived','Negotiation','ClosedWon','ClosedLost'));
$$;
REVOKE EXECUTE ON FUNCTION public.document_locked(jsonb, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.document_locked(jsonb, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.storage_object_locked(_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM case_documents d WHERE d.file_path = _name AND public.document_locked(d.ai_extracted_data, d.case_id));
$$;
REVOKE EXECUTE ON FUNCTION public.storage_object_locked(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.storage_object_locked(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can delete own docs" ON public.case_documents;
CREATE POLICY "Users can delete own docs" ON public.case_documents FOR DELETE TO authenticated USING (
  public.is_admin()
  OR (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_documents.case_id AND cases.user_id = auth.uid())
      AND NOT public.document_locked(case_documents.ai_extracted_data, case_documents.case_id))
);

DROP POLICY IF EXISTS "Users can delete own case docs" ON storage.objects;
CREATE POLICY "Users can delete own case docs" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'case-documents' AND (
    public.is_admin()
    OR (auth.uid()::text = (storage.foldername(name))[1] AND NOT public.storage_object_locked(name))
  )
);

-- Audit every staff change to a document record (review decisions, validation results).
CREATE OR REPLACE FUNCTION public.audit_document_update() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.ai_extracted_data IS DISTINCT FROM OLD.ai_extracted_data OR NEW.file_path IS DISTINCT FROM OLD.file_path THEN
    INSERT INTO audit_log(user_id, case_id, action, object_type, object_id, metadata)
    VALUES (auth.uid(), NEW.case_id, 'document_review_update', 'document', NEW.id::text,
      jsonb_build_object('doc_type', NEW.doc_type,
                         'decision', NEW.ai_extracted_data->'manual_review'->>'decision',
                         'level', NEW.ai_extracted_data->>'level'));
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.audit_document_update() FROM public, anon, authenticated;
DROP TRIGGER IF EXISTS trg_audit_document_update ON public.case_documents;
CREATE TRIGGER trg_audit_document_update AFTER UPDATE ON public.case_documents
  FOR EACH ROW EXECUTE FUNCTION public.audit_document_update();

-- ─────────────────────────────────────────────────────────────
-- 3. Signed evidence: once the intake is submitted, the stored consent/signature cannot be
--    rewritten by the customer, and the case type cannot change after submission or payment.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_case_safe(
  _case_id uuid,
  _intake_data jsonb DEFAULT NULL,
  _current_step integer DEFAULT NULL,
  _goal text DEFAULT NULL,
  _selected_mix text DEFAULT NULL,
  _case_type case_type DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _c cases%ROWTYPE; _new jsonb;
BEGIN
  SELECT * INTO _c FROM cases WHERE id = _case_id AND user_id = auth.uid();
  IF _c.id IS NULL THEN RAISE EXCEPTION 'Access denied'; END IF;

  _new := COALESCE(_intake_data, _c.intake_data);
  -- Keep the signed consent exactly as it was once the case was submitted.
  IF _c.intake_complete AND (_c.intake_data->'consent'->>'signedAt') IS NOT NULL THEN
    _new := jsonb_set(COALESCE(_new, '{}'::jsonb), '{consent}', _c.intake_data->'consent');
  END IF;

  UPDATE cases SET
    intake_data = _new,
    current_step = COALESCE(_current_step, current_step),
    goal = COALESCE(_goal, goal),
    selected_mix = COALESCE(_selected_mix, selected_mix),
    case_type = CASE WHEN _c.intake_complete OR _c.payment_succeeded THEN case_type ELSE COALESCE(_case_type, case_type) END,
    updated_at = now()
  WHERE id = _case_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.update_case_safe(uuid, jsonb, integer, text, text, case_type) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.update_case_safe(uuid, jsonb, integer, text, text, case_type) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4. Case deletion: no direct hard delete (it left storage files behind).
--    Deletion goes through the admin-delete-case Edge Function, which first takes an inventory
--    and refuses when records exist that may need legal/business retention.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can delete cases" ON public.cases;

CREATE OR REPLACE FUNCTION public.case_deletion_inventory(_case_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _c cases%ROWTYPE; _r jsonb;
BEGIN
  IF NOT public.is_admin() AND COALESCE(auth.role(), '') <> 'service_role' THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _c FROM cases WHERE id = _case_id;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'case not found'; END IF;
  _r := jsonb_build_object(
    'case_id', _c.id, 'user_id', _c.user_id, 'status', _c.status,
    'documents', (SELECT count(*) FROM case_documents WHERE case_id = _case_id),
    'storage_prefixes', jsonb_build_array(_c.user_id::text || '/' || _c.id::text || '/', 'tender/' || _c.id::text || '/'),
    'retention_flags', jsonb_strip_nulls(jsonb_build_object(
      'payment_succeeded', CASE WHEN _c.payment_succeeded THEN true END,
      'signed_consent', CASE WHEN (_c.intake_data->'consent'->>'signedAt') IS NOT NULL THEN true END,
      'consent_records', NULLIF((SELECT count(*) FROM consents WHERE case_id = _case_id), 0),
      'tender', CASE WHEN EXISTS (SELECT 1 FROM tenders WHERE case_id = _case_id) THEN true END,
      'payment_events', NULLIF((SELECT count(*) FROM case_events WHERE case_id = _case_id AND event_name ILIKE '%payment%'), 0),
      'legal_hold', CASE WHEN EXISTS (SELECT 1 FROM privacy_requests WHERE user_id = _c.user_id AND legal_hold) THEN true END
    ))
  );
  RETURN _r;
END $$;
REVOKE EXECUTE ON FUNCTION public.case_deletion_inventory(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.case_deletion_inventory(uuid) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────
-- 5. Quick Check abuse protection: per-IP and global rate limits.
--    The IP is never stored in clear: only a salted SHA-256 bucket key, kept for 2 days.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket text NOT NULL,
  window_start timestamptz NOT NULL,
  hits int NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;
GRANT ALL ON public.rate_limits TO service_role;

INSERT INTO public.internal_job_tokens(name, token)
VALUES ('rate_salt', encode(gen_random_bytes(32), 'hex')) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.hit_rate_limit(_bucket text, _limit int, _window interval)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _start timestamptz := to_timestamp(floor(extract(epoch FROM now()) / extract(epoch FROM _window)) * extract(epoch FROM _window));
        _hits int;
BEGIN
  DELETE FROM rate_limits WHERE window_start < now() - interval '2 days';
  INSERT INTO rate_limits(bucket, window_start, hits) VALUES (_bucket, _start, 1)
  ON CONFLICT (bucket, window_start) DO UPDATE SET hits = rate_limits.hits + 1
  RETURNING hits INTO _hits;
  RETURN _hits <= _limit;
END $$;
REVOKE EXECUTE ON FUNCTION public.hit_rate_limit(text, int, interval) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.request_ip_bucket(_prefix text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE _h json := NULLIF(current_setting('request.headers', true), '')::json; _ip text; _salt text;
BEGIN
  _ip := COALESCE(_h->>'cf-connecting-ip', split_part(COALESCE(_h->>'x-forwarded-for', ''), ',', 1), _h->>'x-real-ip');
  _ip := NULLIF(btrim(_ip), '');
  IF _ip IS NULL THEN RETURN NULL; END IF;
  SELECT token INTO _salt FROM internal_job_tokens WHERE name = 'rate_salt';
  RETURN _prefix || encode(extensions.digest(_ip || COALESCE(_salt, ''), 'sha256'), 'hex');
END $$;
REVOKE EXECUTE ON FUNCTION public.request_ip_bucket(text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.save_quick_check_inquiry(_answers jsonb, _consent_version text, _ua text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE _token uuid; _name text := btrim(_answers->>'firstName'); _phone text := regexp_replace(COALESCE(_answers->>'phone',''), '[[:space:]()-]', '', 'g'); _field text; _ipb text;
BEGIN
 -- Abuse protection first (cheap, before any validation or insert).
 _ipb := public.request_ip_bucket('qc:ip:');
 IF _ipb IS NOT NULL AND NOT public.hit_rate_limit(_ipb, 5, interval '1 hour') THEN RAISE EXCEPTION 'rate_limited'; END IF;
 IF NOT public.hit_rate_limit('qc:global', 300, interval '1 hour') THEN RAISE EXCEPTION 'rate_limited'; END IF;

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

-- ─────────────────────────────────────────────────────────────
-- 6. Disable the promotional nudge job for launch.
--    The messages are promotional, marketing consent is not checked, and the urgency claims are
--    unsupported. The send-reminders job is unchanged. Guarded: no-op when pg_cron or the job is absent.
--    (The send-nudges function also refuses to send unless NUDGES_ENABLED=true is set.)
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    EXECUTE $q$SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'send-nudges-every-30min'$q$;
  END IF;
END $$;
