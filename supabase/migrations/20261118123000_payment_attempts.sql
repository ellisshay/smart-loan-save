-- #44: one row per Cardcom payment page we open, so a new page is never opened while an earlier one
-- may already have been charged. Additive only. Server functions write; admins read; no browser access.
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  low_profile_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_attempts_case_open_idx ON public.payment_attempts (case_id, created_at DESC) WHERE status = 'open';

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_attempts FROM anon, authenticated;
GRANT ALL ON public.payment_attempts TO service_role;
DROP POLICY IF EXISTS "Admins read payment attempts" ON public.payment_attempts;
CREATE POLICY "Admins read payment attempts" ON public.payment_attempts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.payment_attempts TO authenticated;
