ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS emails_sent jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE public.mortgage_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid UNIQUE,
  case_type text,
  borrower_count int,
  age_range text,
  income_range text,
  property_area text,
  property_value numeric,
  loan_amount numeric,
  ltv numeric,
  dti numeric,
  selected_mix text,
  offered_rate numeric,
  source text NOT NULL DEFAULT 'client',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mortgage_profiles TO authenticated;
GRANT ALL ON public.mortgage_profiles TO service_role;
ALTER TABLE public.mortgage_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view profiles pool" ON public.mortgage_profiles FOR SELECT TO authenticated USING (public.is_admin());
CREATE TRIGGER update_mortgage_profiles_updated_at BEFORE UPDATE ON public.mortgage_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.market_rates_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_on date NOT NULL DEFAULT current_date UNIQUE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.market_rates_history TO anon, authenticated;
GRANT ALL ON public.market_rates_history TO service_role;
ALTER TABLE public.market_rates_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read rate history" ON public.market_rates_history FOR SELECT USING (true);

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;