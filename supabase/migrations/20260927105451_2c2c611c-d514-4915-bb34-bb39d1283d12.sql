ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mortgage_advisor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'privacy_auditor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';

CREATE OR REPLACE FUNCTION public.is_privacy_viewer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text IN ('privacy_auditor','supervisor'));
$$;

-- Consents
CREATE TABLE public.consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consent_type text NOT NULL,
  consent_version text NOT NULL,
  consented_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  user_agent text,
  case_id uuid
);
GRANT SELECT, INSERT ON public.consents TO authenticated;
GRANT ALL ON public.consents TO service_role;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own consents read" ON public.consents FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_privacy_viewer());
CREATE POLICY "own consents insert" ON public.consents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Audit log (append-only)
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  role text,
  case_id uuid,
  action text NOT NULL,
  object_type text,
  object_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  success boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "privacy viewers read audit" ON public.audit_log FOR SELECT TO authenticated USING (public.is_privacy_viewer());

CREATE OR REPLACE FUNCTION public.log_audit(_action text, _object_type text DEFAULT NULL, _object_id text DEFAULT NULL, _case_id uuid DEFAULT NULL, _metadata jsonb DEFAULT '{}'::jsonb, _success boolean DEFAULT true)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  INSERT INTO audit_log(user_id, role, case_id, action, object_type, object_id, metadata, success)
  VALUES (auth.uid(), (SELECT string_agg(role::text, ',') FROM user_roles WHERE user_id = auth.uid()), _case_id, left(_action,64), _object_type, _object_id, COALESCE(_metadata,'{}'::jsonb), _success);
END; $$;
REVOKE EXECUTE ON FUNCTION public.log_audit(text,text,text,uuid,jsonb,boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.log_audit(text,text,text,uuid,jsonb,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.audit_case_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO audit_log(user_id, case_id, action, object_type, object_id, metadata)
    VALUES (auth.uid(), NEW.id, 'change_case_status', 'case', NEW.id::text, jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;
  IF NEW.payment_succeeded IS DISTINCT FROM OLD.payment_succeeded THEN
    INSERT INTO audit_log(user_id, case_id, action, object_type, object_id, metadata)
    VALUES (auth.uid(), NEW.id, 'payment_status_changed', 'case', NEW.id::text, jsonb_build_object('paid', NEW.payment_succeeded));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_audit_case_status AFTER UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.audit_case_status();

CREATE OR REPLACE FUNCTION public.audit_roles() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO audit_log(user_id, action, object_type, object_id, metadata)
  VALUES (auth.uid(), 'change_permissions', 'user_role', COALESCE(NEW.user_id, OLD.user_id)::text, jsonb_build_object('op', TG_OP, 'role', COALESCE(NEW.role, OLD.role)));
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_audit_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_roles();

CREATE OR REPLACE FUNCTION public.audit_documents() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO audit_log(user_id, case_id, action, object_type, object_id, metadata)
  VALUES (auth.uid(), COALESCE(NEW.case_id, OLD.case_id), CASE TG_OP WHEN 'INSERT' THEN 'upload_document' ELSE 'delete_document' END, 'document', COALESCE(NEW.id, OLD.id)::text, jsonb_build_object('doc_type', COALESCE(NEW.doc_type, OLD.doc_type)));
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_audit_documents AFTER INSERT OR DELETE ON public.case_documents FOR EACH ROW EXECUTE FUNCTION public.audit_documents();

-- Privacy requests
CREATE TABLE public.privacy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  request_type text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  legal_hold boolean NOT NULL DEFAULT false,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.privacy_requests TO authenticated;
GRANT ALL ON public.privacy_requests TO service_role;
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr read" ON public.privacy_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_privacy_viewer());
CREATE POLICY "pr insert" ON public.privacy_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'open');
CREATE POLICY "pr admin update" ON public.privacy_requests FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_pr_updated BEFORE UPDATE ON public.privacy_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Vendors registry
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name text NOT NULL,
  service text,
  data_categories text,
  region text,
  purpose text,
  dpa_signed boolean NOT NULL DEFAULT false,
  subprocessors text,
  retention text,
  security_notes text,
  last_reviewed date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendors read" ON public.vendors FOR SELECT TO authenticated USING (public.is_privacy_viewer());
CREATE POLICY "vendors admin" ON public.vendors FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.vendors (vendor_name, service, data_categories, region, purpose, retention, security_notes) VALUES
('Lovable Cloud (Supabase)','מסד נתונים, אחסון מסמכים, התחברות','כל נתוני התיק והמסמכים','EU/US','אחסון ועיבוד תיקים','לפי מדיניות שמירה','RLS, אחסון פרטי, קישורים זמניים'),
('Lovable','אירוח האתר','נתוני גלישה טכניים','US','הפעלת האתר','לפי ספק',''),
('Tranzila','סליקת תשלומים','סכום, מזהה תיק. פרטי אשראי לא עוברים דרכנו','IL','גביית תשלום','לפי ספק','PCI DSS'),
('Gmail (Google)','שליחת מיילים','שם, מייל, סטטוס תיק. ללא קבצים מצורפים','US','עדכוני תיק','לפי ספק',''),
('Green API','WhatsApp','שם, טלפון, תזכורות. ללא מסמכים','IL/EU','תזכורות','לפי ספק',''),
('n8n','אוטומציות','מזהי תיק וסטטוס','EU','תהליכים אוטומטיים','לפי ספק',''),
('Google Gemini / Anthropic','עיבוד מסמכים אוטומטי','תוכן מסמכים לצורך סיווג וחילוץ','US','אימות מסמכים וסיכום','ללא שמירה אצל הספק לפי תנאיו','בדיקה אנושית להחלטות מהותיות');