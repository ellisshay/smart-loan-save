-- #44: keep every "send me the result" request, also when the email provider fails.
-- Additive only. Server functions (service role) are the only readers and writers; the browser has no access.
CREATE TABLE IF NOT EXISTS public.quick_result_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token uuid NOT NULL,
  email text NOT NULL,
  -- what the client asked to receive: ltv, dti, mixes and first name, as shown on screen
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  -- a short code only, never provider responses or message content
  last_error text CHECK (last_error IS NULL OR char_length(last_error) <= 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

-- One request per check and address: retrying updates the same row instead of creating another.
CREATE UNIQUE INDEX IF NOT EXISTS quick_result_requests_session_email_uidx
  ON public.quick_result_requests (session_token, lower(email));
CREATE INDEX IF NOT EXISTS quick_result_requests_unsent_idx
  ON public.quick_result_requests (status, created_at) WHERE status <> 'sent';

ALTER TABLE public.quick_result_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.quick_result_requests FROM anon, authenticated;
GRANT ALL ON public.quick_result_requests TO service_role;

DROP POLICY IF EXISTS "Admins read quick result requests" ON public.quick_result_requests;
CREATE POLICY "Admins read quick result requests" ON public.quick_result_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.quick_result_requests TO authenticated;
