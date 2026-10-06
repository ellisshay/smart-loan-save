-- Launch readiness: payment may happen before documents, but the 72h SLA starts only
-- when the questionnaire is submitted, payment succeeded, and all required documents
-- are actually uploaded and usable. A deferred document never counts as complete.

CREATE OR REPLACE FUNCTION public.required_mortgage_docs_ready(_case_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _type public.case_type;
  _required text[];
  _missing int;
BEGIN
  SELECT case_type INTO _type FROM public.cases WHERE id = _case_id;
  IF _type IS NULL THEN RETURN false; END IF;

  _required := CASE
    WHEN _type = 'refi'::public.case_type
      THEN ARRAY['mortgage_report','id_card','payslips','bank_statements']::text[]
    ELSE ARRAY['id_card','payslips','bank_statements','purchase_contract']::text[]
  END;

  SELECT count(*) INTO _missing
  FROM unnest(_required) AS r(doc_type)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.case_documents d
    WHERE d.case_id = _case_id
      AND d.doc_type = r.doc_type
      AND COALESCE(d.ai_extracted_data->>'overall','') IN ('verified','review')
  );

  RETURN _missing = 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.required_mortgage_docs_ready(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.required_mortgage_docs_ready(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.check_sla_start()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_succeeded = true AND NEW.intake_complete = true THEN
    IF public.required_mortgage_docs_ready(NEW.id) THEN
      IF NEW.sla_started_at IS NULL THEN
        NEW.sla_started_at = now();
        NEW.sla_due_at = now() + interval '72 hours';
      END IF;
      IF NEW.status IN ('WaitingForPayment','PaymentSucceeded','WaitingForDocs') THEN
        NEW.status = 'InAnalysis';
      END IF;
    ELSE
      -- Payment is kept, but operational work has not started because required
      -- documents are still missing or unusable.
      IF NEW.sla_started_at IS NULL AND NEW.status IN ('WaitingForPayment','PaymentSucceeded','Draft') THEN
        NEW.status = 'WaitingForDocs';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Re-evaluate readiness whenever a document is inserted, analysed/replaced or deleted.
CREATE OR REPLACE FUNCTION public.recheck_case_after_document_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _case_id uuid := COALESCE(NEW.case_id, OLD.case_id);
BEGIN
  UPDATE public.cases SET updated_at = now() WHERE id = _case_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recheck_case_after_document_change ON public.case_documents;
CREATE TRIGGER trg_recheck_case_after_document_change
AFTER INSERT OR UPDATE OR DELETE ON public.case_documents
FOR EACH ROW EXECUTE FUNCTION public.recheck_case_after_document_change();

COMMENT ON FUNCTION public.required_mortgage_docs_ready(uuid)
IS 'Operational readiness only. Deferred documents do not count. verified/review documents count; rejected documents do not.';
