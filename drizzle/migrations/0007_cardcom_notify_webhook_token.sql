INSERT INTO public.internal_job_tokens(name, token) VALUES ('cardcom_notify', encode(gen_random_bytes(32),'hex')) ON CONFLICT (name) DO NOTHING;

DELETE FROM public.internal_job_tokens WHERE name = 'tranzila_notify';