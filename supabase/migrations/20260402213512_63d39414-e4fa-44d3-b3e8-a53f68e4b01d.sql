
-- Market rates table
CREATE TABLE public.market_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prime numeric NOT NULL DEFAULT 4.6,
  fixed_not_linked numeric NOT NULL DEFAULT 5.1,
  fixed_linked numeric NOT NULL DEFAULT 4.2,
  variable_5 numeric NOT NULL DEFAULT 4.8,
  variable_1 numeric NOT NULL DEFAULT 4.5,
  cpi numeric NOT NULL DEFAULT 3.2,
  source text DEFAULT 'manual',
  updated_at timestamptz DEFAULT now(),
  updated_by text
);

ALTER TABLE public.market_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read market rates" ON public.market_rates
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage rates" ON public.market_rates
  FOR ALL USING (is_admin());

-- Insert initial rates
INSERT INTO public.market_rates (prime, fixed_not_linked, fixed_linked, variable_5, variable_1, cpi, source)
VALUES (4.6, 5.1, 4.2, 4.8, 4.5, 3.2, 'manual_initial');

-- Chat messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can insert own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
