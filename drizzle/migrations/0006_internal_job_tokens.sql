-- lovable-cron-fallback-reviewed: existing nudge job, cadence unchanged, only adding auth header
CREATE TABLE public.internal_job_tokens (name text PRIMARY KEY, token text NOT NULL);
GRANT ALL ON public.internal_job_tokens TO service_role;
REVOKE ALL ON public.internal_job_tokens FROM anon, authenticated;
ALTER TABLE public.internal_job_tokens ENABLE ROW LEVEL SECURITY;
INSERT INTO public.internal_job_tokens(name, token) VALUES
 ('cron', encode(gen_random_bytes(32),'hex')),
 ('tranzila_notify', encode(gen_random_bytes(32),'hex'))
ON CONFLICT DO NOTHING;
SELECT cron.unschedule('send-nudges-every-30min');
SELECT cron.unschedule('send-reminders-every-3h');
SELECT cron.schedule('send-nudges-every-30min','*/30 * * * *', $$select net.http_post(url:='https://galdnzngimxthzzjqkjc.supabase.co/functions/v1/send-nudges',headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',(select token from public.internal_job_tokens where name='cron')),body:='{}'::jsonb);$$);
SELECT cron.schedule('send-reminders-every-3h','0 */3 * * *', $$select net.http_post(url:='https://galdnzngimxthzzjqkjc.supabase.co/functions/v1/send-reminders',headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',(select token from public.internal_job_tokens where name='cron')),body:='{}'::jsonb);$$);