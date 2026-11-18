-- #52: normalised balance report analyses. Stores extracted values with page/label evidence and the
-- reconciliation result, never the uploaded file or the file name. Identifier-like digit runs in the
-- evidence are masked before insert (supabase/functions/_shared/balanceReport.ts: redact).
-- Additive only.
CREATE TABLE IF NOT EXISTS public.balance_report_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('complete', 'needs_completion', 'conflict')),
  mode text NOT NULL CHECK (mode IN ('text', 'file')),
  model text NOT NULL,
  rechecked boolean NOT NULL DEFAULT false,
  track_count integer NOT NULL DEFAULT 0 CHECK (track_count BETWEEN 0 AND 12),
  report jsonb NOT NULL,
  issues jsonb NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS balance_report_analyses_user_created_idx ON public.balance_report_analyses (user_id, created_at DESC);

ALTER TABLE public.balance_report_analyses ENABLE ROW LEVEL SECURITY;

-- Owners read their own analyses; admins read all. Writes only through the edge function (service role).
DROP POLICY IF EXISTS "owner reads own balance analyses" ON public.balance_report_analyses;
CREATE POLICY "owner reads own balance analyses" ON public.balance_report_analyses
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "admin reads balance analyses" ON public.balance_report_analyses;
CREATE POLICY "admin reads balance analyses" ON public.balance_report_analyses
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.balance_report_analyses FROM anon;
GRANT SELECT ON public.balance_report_analyses TO authenticated;
