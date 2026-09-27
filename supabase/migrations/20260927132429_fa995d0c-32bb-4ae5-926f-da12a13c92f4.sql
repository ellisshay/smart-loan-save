DROP POLICY IF EXISTS "authenticated can read validation settings" ON public.validation_settings;
CREATE POLICY "admins can read validation settings" ON public.validation_settings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can create quiz session" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Anyone can read own quiz session" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Anyone can update quiz session" ON public.quiz_sessions;
CREATE POLICY "Admins read quiz sessions" ON public.quiz_sessions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.quiz_create_session()
RETURNS TABLE(id uuid, session_token uuid)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.quiz_sessions (quiz_data, user_id) VALUES ('{}'::jsonb, auth.uid())
  RETURNING quiz_sessions.id, quiz_sessions.session_token;
$$;

CREATE OR REPLACE FUNCTION public.quiz_get_session(_token uuid)
RETURNS TABLE(quiz_data jsonb, current_step integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT q.quiz_data::jsonb, q.current_step FROM public.quiz_sessions q WHERE q.session_token = _token;
$$;

CREATE OR REPLACE FUNCTION public.quiz_update_session(_token uuid, _quiz_data jsonb, _current_step integer, _score integer, _purpose text, _completed boolean DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF pg_column_size(_quiz_data) > 65536 THEN RAISE EXCEPTION 'payload too large'; END IF;
  UPDATE public.quiz_sessions SET
    quiz_data = COALESCE(_quiz_data, quiz_data),
    current_step = COALESCE(_current_step, current_step),
    score_estimate = COALESCE(_score, score_estimate),
    purpose = COALESCE(_purpose, purpose),
    completed = COALESCE(_completed, completed)
  WHERE session_token = _token;
END; $$;

GRANT EXECUTE ON FUNCTION public.quiz_create_session() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.quiz_get_session(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.quiz_update_session(uuid, jsonb, integer, integer, text, boolean) TO anon, authenticated;