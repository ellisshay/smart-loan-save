DROP POLICY IF EXISTS "Advisors can insert purchases" ON public.lead_purchases;
CREATE POLICY "Admins insert purchases" ON public.lead_purchases FOR INSERT TO authenticated WITH CHECK (public.is_admin());

ALTER TABLE public.consents ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.consents ADD COLUMN IF NOT EXISTS session_token uuid;

CREATE OR REPLACE FUNCTION public.record_session_consent(_token uuid, _type text, _version text, _ua text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF _type NOT IN ('quick_check','marketing') THEN RAISE EXCEPTION 'invalid consent type'; END IF;
  IF NOT EXISTS (SELECT 1 FROM quiz_sessions WHERE session_token=_token) THEN RAISE EXCEPTION 'unknown session'; END IF;
  INSERT INTO consents(user_id, session_token, consent_type, consent_version, user_agent)
  VALUES (auth.uid(), _token, _type, left(_version,32), left(_ua,400));
END $$;
GRANT EXECUTE ON FUNCTION public.record_session_consent(uuid,text,text,text) TO anon, authenticated;

CREATE TABLE public.cancellation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  contact text NOT NULL,
  case_number text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cancellation_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.cancellation_requests TO authenticated;
GRANT ALL ON public.cancellation_requests TO service_role;
CREATE POLICY "Admins read cancellations" ON public.cancellation_requests FOR SELECT TO authenticated USING (public.is_admin());