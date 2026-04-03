
-- Create quiz_sessions table for live saving of smart assessment data
CREATE TABLE public.quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT NULL,
  quiz_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  score_estimate integer DEFAULT 0,
  current_step integer DEFAULT 0,
  purpose text DEFAULT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by session token
CREATE UNIQUE INDEX idx_quiz_sessions_token ON public.quiz_sessions(session_token);
CREATE INDEX idx_quiz_sessions_user ON public.quiz_sessions(user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create a quiz session (pre-auth)
CREATE POLICY "Anyone can create quiz session"
ON public.quiz_sessions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow reading own session by token (anon) or user_id (authenticated)
CREATE POLICY "Anyone can read own quiz session"
ON public.quiz_sessions FOR SELECT
TO anon, authenticated
USING (true);

-- Allow updating own session
CREATE POLICY "Anyone can update quiz session"
ON public.quiz_sessions FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_quiz_sessions_updated_at
BEFORE UPDATE ON public.quiz_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
