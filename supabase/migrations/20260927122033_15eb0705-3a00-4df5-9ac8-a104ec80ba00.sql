ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS assigned_advisor_id uuid;

CREATE OR REPLACE FUNCTION public.can_manage_case(_case_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_admin() OR EXISTS (SELECT 1 FROM cases WHERE id=_case_id AND assigned_advisor_id=auth.uid());
$$;

CREATE TABLE public.banks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, active boolean NOT NULL DEFAULT true, sort int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banks TO authenticated; GRANT ALL ON public.banks TO service_role;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banks read" ON public.banks FOR SELECT TO authenticated USING (true);
CREATE POLICY "banks admin" ON public.banks FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO public.banks(name,sort) VALUES ('בנק הפועלים',1),('בנק לאומי',2),('בנק דיסקונט',3),('מזרחי טפחות',4),('הבינלאומי',5),('בנק ירושלים',6),('בנק מרכנתיל',7),('בנק יהב',8);

CREATE TABLE public.tenders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL UNIQUE REFERENCES public.cases(id) ON DELETE CASCADE, opened_at timestamptz NOT NULL DEFAULT now(), stage text NOT NULL DEFAULT 'review', advisor_summary text, selected_offer_id uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.tenders TO authenticated; GRANT ALL ON public.tenders TO service_role;
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenders staff" ON public.tenders FOR ALL TO authenticated USING (public.can_manage_case(case_id)) WITH CHECK (public.can_manage_case(case_id));
CREATE TRIGGER trg_tenders_updated BEFORE UPDATE ON public.tenders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.tender_banks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE, slot int NOT NULL CHECK (slot BETWEEN 1 AND 3), bank_id uuid REFERENCES public.banks(id), banker_contact text, submitted_at date, status text NOT NULL DEFAULT 'not_submitted', approved_amount numeric, approved_ltv numeric, approval_valid_until date, internal_notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tender_id, slot));
GRANT SELECT, INSERT, UPDATE ON public.tender_banks TO authenticated; GRANT ALL ON public.tender_banks TO service_role;
ALTER TABLE public.tender_banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tb staff" ON public.tender_banks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM tenders t WHERE t.id=tender_id AND public.can_manage_case(t.case_id))) WITH CHECK (EXISTS (SELECT 1 FROM tenders t WHERE t.id=tender_id AND public.can_manage_case(t.case_id)));
CREATE TRIGGER trg_tb_updated BEFORE UPDATE ON public.tender_banks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.tender_offers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tender_bank_id uuid NOT NULL REFERENCES public.tender_banks(id) ON DELETE CASCADE, version int NOT NULL, kind text NOT NULL DEFAULT 'initial', tracks jsonb NOT NULL DEFAULT '[]', total_amount numeric, first_payment numeric, extra_costs text, offer_date date, valid_until date, client_visible boolean NOT NULL DEFAULT false, advisor_explanation text, created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tender_bank_id, version));
GRANT SELECT, INSERT, UPDATE ON public.tender_offers TO authenticated; GRANT ALL ON public.tender_offers TO service_role;
ALTER TABLE public.tender_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "to staff read" ON public.tender_offers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tender_banks b JOIN tenders t ON t.id=b.tender_id WHERE b.id=tender_bank_id AND public.can_manage_case(t.case_id)));
CREATE POLICY "to staff insert" ON public.tender_offers FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tender_banks b JOIN tenders t ON t.id=b.tender_id WHERE b.id=tender_bank_id AND public.can_manage_case(t.case_id)));
CREATE POLICY "to staff update" ON public.tender_offers FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tender_banks b JOIN tenders t ON t.id=b.tender_id WHERE b.id=tender_bank_id AND public.can_manage_case(t.case_id)));
-- Offer content is immutable; only display flag and explanation may change
CREATE OR REPLACE FUNCTION public.protect_offer_content() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.tracks IS DISTINCT FROM OLD.tracks OR NEW.total_amount IS DISTINCT FROM OLD.total_amount OR NEW.first_payment IS DISTINCT FROM OLD.first_payment
     OR NEW.kind IS DISTINCT FROM OLD.kind OR NEW.version IS DISTINCT FROM OLD.version OR NEW.valid_until IS DISTINCT FROM OLD.valid_until
     OR NEW.offer_date IS DISTINCT FROM OLD.offer_date OR NEW.extra_costs IS DISTINCT FROM OLD.extra_costs OR NEW.tender_bank_id IS DISTINCT FROM OLD.tender_bank_id THEN
    RAISE EXCEPTION 'Offer content cannot be changed. Save a new version instead.';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_protect_offer BEFORE UPDATE ON public.tender_offers FOR EACH ROW EXECUTE FUNCTION public.protect_offer_content();

CREATE TABLE public.tender_checklist (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE, step_key text NOT NULL, sort int NOT NULL, done boolean NOT NULL DEFAULT false, done_at timestamptz, done_by uuid, UNIQUE(tender_id, step_key));
GRANT SELECT, INSERT, UPDATE ON public.tender_checklist TO authenticated; GRANT ALL ON public.tender_checklist TO service_role;
ALTER TABLE public.tender_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tc staff" ON public.tender_checklist FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM tenders t WHERE t.id=tender_id AND public.can_manage_case(t.case_id))) WITH CHECK (EXISTS (SELECT 1 FROM tenders t WHERE t.id=tender_id AND public.can_manage_case(t.case_id)));

CREATE TABLE public.tender_client_actions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE, offer_id uuid REFERENCES public.tender_offers(id), user_id uuid NOT NULL, action text NOT NULL CHECK (action IN ('question','proceed')), message text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.tender_client_actions TO authenticated; GRANT ALL ON public.tender_client_actions TO service_role;
ALTER TABLE public.tender_client_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tca read" ON public.tender_client_actions FOR SELECT TO authenticated USING (user_id=auth.uid() OR EXISTS (SELECT 1 FROM tenders t WHERE t.id=tender_id AND public.can_manage_case(t.case_id)));

-- Audit with old/new values
CREATE OR REPLACE FUNCTION public.audit_tender_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _case uuid; _row jsonb := to_jsonb(COALESCE(NEW, OLD));
BEGIN
  IF TG_TABLE_NAME='tenders' THEN _case := (_row->>'case_id')::uuid;
  ELSIF TG_TABLE_NAME IN ('tender_banks','tender_checklist','tender_client_actions') THEN SELECT case_id INTO _case FROM tenders WHERE id=(_row->>'tender_id')::uuid;
  ELSIF TG_TABLE_NAME='tender_offers' THEN SELECT t.case_id INTO _case FROM tender_banks b JOIN tenders t ON t.id=b.tender_id WHERE b.id=(_row->>'tender_bank_id')::uuid;
  END IF;
  INSERT INTO audit_log(user_id, case_id, action, object_type, object_id, metadata)
  VALUES (auth.uid(), _case, lower(TG_OP)||'_'||TG_TABLE_NAME, TG_TABLE_NAME, _row->>'id',
    jsonb_build_object('old', CASE WHEN TG_OP<>'INSERT' THEN to_jsonb(OLD) END, 'new', CASE WHEN TG_OP<>'DELETE' THEN to_jsonb(NEW) END));
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_audit_tenders AFTER INSERT OR UPDATE OR DELETE ON public.tenders FOR EACH ROW EXECUTE FUNCTION public.audit_tender_change();
CREATE TRIGGER trg_audit_tb AFTER INSERT OR UPDATE OR DELETE ON public.tender_banks FOR EACH ROW EXECUTE FUNCTION public.audit_tender_change();
CREATE TRIGGER trg_audit_to AFTER INSERT OR UPDATE ON public.tender_offers FOR EACH ROW EXECUTE FUNCTION public.audit_tender_change();
CREATE TRIGGER trg_audit_tc AFTER UPDATE ON public.tender_checklist FOR EACH ROW EXECUTE FUNCTION public.audit_tender_change();
CREATE TRIGGER trg_audit_tca AFTER INSERT ON public.tender_client_actions FOR EACH ROW EXECUTE FUNCTION public.audit_tender_change();

-- Open tender with 3 slots + checklist
CREATE OR REPLACE FUNCTION public.open_tender(_case_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _id uuid; _steps text[] := ARRAY['offer_approval','missing_docs','appraisal','insurance','collateral','bank_coordination','signing_coordination','signing','post_signing','disbursement','completed']; i int;
BEGIN
  IF NOT public.can_manage_case(_case_id) THEN RAISE EXCEPTION 'Access denied'; END IF;
  SELECT id INTO _id FROM tenders WHERE case_id=_case_id;
  IF _id IS NOT NULL THEN RETURN _id; END IF;
  INSERT INTO tenders(case_id) VALUES (_case_id) RETURNING id INTO _id;
  INSERT INTO tender_banks(tender_id, slot) VALUES (_id,1),(_id,2),(_id,3);
  FOR i IN 1..array_length(_steps,1) LOOP INSERT INTO tender_checklist(tender_id, step_key, sort) VALUES (_id,_steps[i],i); END LOOP;
  RETURN _id;
END $$;

-- Client-safe view
CREATE OR REPLACE FUNCTION public.get_client_tender(_case_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE _t tenders%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cases WHERE id=_case_id AND user_id=auth.uid()) AND NOT public.can_manage_case(_case_id) THEN RAISE EXCEPTION 'Access denied'; END IF;
  SELECT * INTO _t FROM tenders WHERE case_id=_case_id;
  IF _t.id IS NULL THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('id',_t.id,'stage',_t.stage,'opened_at',_t.opened_at,'advisor_summary',_t.advisor_summary,'selected_offer_id',_t.selected_offer_id,
    'banks', COALESCE((SELECT jsonb_agg(jsonb_build_object('slot',b.slot,'bank_name',bk.name,'status',b.status,
       'offers', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',o.id,'version',o.version,'kind',o.kind,'tracks',o.tracks,'total_amount',o.total_amount,'first_payment',o.first_payment,'extra_costs',o.extra_costs,'offer_date',o.offer_date,'valid_until',o.valid_until,'advisor_explanation',o.advisor_explanation) ORDER BY o.version DESC) FROM tender_offers o WHERE o.tender_bank_id=b.id AND o.client_visible),'[]'::jsonb)
     ) ORDER BY b.slot) FROM tender_banks b LEFT JOIN banks bk ON bk.id=b.bank_id),'[]'::jsonb),
    'checklist', COALESCE((SELECT jsonb_agg(jsonb_build_object('step_key',step_key,'done',done) ORDER BY sort) FROM tender_checklist WHERE tender_id=_t.id),'[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.client_tender_action(_offer_id uuid, _action text, _message text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _tid uuid;
BEGIN
  SELECT t.id INTO _tid FROM tender_offers o JOIN tender_banks b ON b.id=o.tender_bank_id JOIN tenders t ON t.id=b.tender_id JOIN cases c ON c.id=t.case_id
   WHERE o.id=_offer_id AND o.client_visible AND c.user_id=auth.uid();
  IF _tid IS NULL THEN RAISE EXCEPTION 'Access denied'; END IF;
  IF _action NOT IN ('question','proceed') THEN RAISE EXCEPTION 'Invalid action'; END IF;
  INSERT INTO tender_client_actions(tender_id, offer_id, user_id, action, message) VALUES (_tid,_offer_id,auth.uid(),_action,left(_message,2000));
  IF _action='proceed' THEN UPDATE tenders SET selected_offer_id=_offer_id, stage='client_selected' WHERE id=_tid; END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.open_tender(uuid), public.get_client_tender(uuid), public.client_tender_action(uuid,text,text), public.can_manage_case(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.open_tender(uuid), public.get_client_tender(uuid), public.client_tender_action(uuid,text,text), public.can_manage_case(uuid) TO authenticated;

-- Advisors see assigned cases
CREATE POLICY "advisor assigned cases" ON public.cases FOR SELECT TO authenticated USING (assigned_advisor_id = auth.uid());

-- Private bank files: tender/<case_id>/...
CREATE POLICY "tender files staff" ON storage.objects FOR ALL TO authenticated
USING (bucket_id='case-documents' AND (storage.foldername(name))[1]='tender' AND public.can_manage_case(((storage.foldername(name))[2])::uuid))
WITH CHECK (bucket_id='case-documents' AND (storage.foldername(name))[1]='tender' AND public.can_manage_case(((storage.foldername(name))[2])::uuid));