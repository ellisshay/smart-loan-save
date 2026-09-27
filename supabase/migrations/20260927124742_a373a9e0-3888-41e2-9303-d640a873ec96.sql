CREATE TABLE public.validation_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value numeric NOT NULL,
  label text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.validation_settings TO authenticated;
GRANT INSERT, UPDATE ON public.validation_settings TO authenticated;
GRANT ALL ON public.validation_settings TO service_role;

ALTER TABLE public.validation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read validation settings"
ON public.validation_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "admins can insert validation settings"
ON public.validation_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admins can update validation settings"
ON public.validation_settings FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER validation_settings_updated_at
BEFORE UPDATE ON public.validation_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.validation_settings (key, value, label) VALUES
  ('income_green_pct', 15, 'סטיית שכר מותרת לאימות מלא (%)'),
  ('income_yellow_pct', 30, 'סטיית שכר עד בדיקת מפעיל (%)'),
  ('name_green_score', 80, 'ציון התאמת שם לאימות מלא'),
  ('name_yellow_score', 55, 'ציון התאמת שם לבדיקת מפעיל'),
  ('employer_green_score', 75, 'ציון התאמת מעסיק לאימות מלא');