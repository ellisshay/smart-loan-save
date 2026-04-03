-- Create nudge_log table for tracking follow-up messages
CREATE TABLE public.nudge_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nudge_type text NOT NULL, -- '2h', '24h', '72h'
  channel text NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'email'
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'skipped'
  error_message text,
  UNIQUE (user_id, nudge_type)
);

-- Enable RLS
ALTER TABLE public.nudge_log ENABLE ROW LEVEL SECURITY;

-- Only admins and service role can access
CREATE POLICY "Admins can view nudge logs"
  ON public.nudge_log FOR SELECT
  USING (is_admin());

CREATE POLICY "Service role can insert nudge logs"
  ON public.nudge_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage nudge logs"
  ON public.nudge_log FOR ALL
  USING (is_admin());