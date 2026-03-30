
-- Advisor profiles
CREATE TABLE public.advisor_profiles (
  user_id uuid PRIMARY KEY,
  company text,
  license_number text NOT NULL,
  rating numeric DEFAULT 0,
  lead_credits integer DEFAULT 0,
  subscription_tier text DEFAULT 'none' CHECK (subscription_tier IN ('none', 'basic', 'professional', 'premium')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.advisor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Advisors can view own profile" ON public.advisor_profiles FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Advisors can update own profile" ON public.advisor_profiles FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Advisors can insert own profile" ON public.advisor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Leads table
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  property_area text,
  property_price_range text,
  purpose text,
  income_range text,
  equity_range text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'expired')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Advisors can view open leads" ON public.leads FOR SELECT USING (
  (status = 'open' AND public.has_role(auth.uid(), 'advisor'))
  OR is_admin()
  OR auth.uid() = client_id
);
CREATE POLICY "System can insert leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = client_id OR is_admin());
CREATE POLICY "Admin can update leads" ON public.leads FOR UPDATE USING (is_admin() OR auth.uid() = client_id);

-- Lead purchases
CREATE TABLE public.lead_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  advisor_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 200,
  purchased_at timestamptz DEFAULT now()
);
ALTER TABLE public.lead_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Advisors can view own purchases" ON public.lead_purchases FOR SELECT USING (auth.uid() = advisor_id OR is_admin());
CREATE POLICY "Advisors can insert purchases" ON public.lead_purchases FOR INSERT WITH CHECK (auth.uid() = advisor_id);

-- Offers
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  advisor_id uuid NOT NULL,
  bank_name text NOT NULL,
  interest_rate numeric NOT NULL,
  track_type text NOT NULL,
  monthly_payment numeric NOT NULL,
  total_cost numeric,
  loan_period integer,
  advisor_fee numeric DEFAULT 0,
  notes text,
  validity_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Advisors can view own offers" ON public.offers FOR SELECT USING (
  auth.uid() = advisor_id OR is_admin()
  OR EXISTS (SELECT 1 FROM public.leads WHERE leads.id = offers.lead_id AND leads.client_id = auth.uid())
);
CREATE POLICY "Advisors can insert offers" ON public.offers FOR INSERT WITH CHECK (auth.uid() = advisor_id);
CREATE POLICY "Advisors can update own offers" ON public.offers FOR UPDATE USING (auth.uid() = advisor_id OR is_admin());

-- Function to check lead purchase
CREATE OR REPLACE FUNCTION public.has_purchased_lead(_advisor_id uuid, _lead_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lead_purchases
    WHERE advisor_id = _advisor_id AND lead_id = _lead_id
  )
$$;

-- Additional policy for purchased leads
CREATE POLICY "Advisors can view purchased leads" ON public.leads FOR SELECT USING (
  public.has_purchased_lead(auth.uid(), id)
);
