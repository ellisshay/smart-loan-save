
-- Add new columns to market_rates
ALTER TABLE public.market_rates
  ADD COLUMN IF NOT EXISTS prime_minus numeric DEFAULT 4.9,
  ADD COLUMN IF NOT EXISTS kalatz numeric DEFAULT 4.7,
  ADD COLUMN IF NOT EXISTS kalatz_long numeric DEFAULT 4.9,
  ADD COLUMN IF NOT EXISTS katz numeric DEFAULT 3.2,
  ADD COLUMN IF NOT EXISTS variable_5_linked numeric DEFAULT 2.9,
  ADD COLUMN IF NOT EXISTS variable_5_kalatz numeric DEFAULT 4.4,
  ADD COLUMN IF NOT EXISTS variable_2_linked numeric DEFAULT 2.6,
  ADD COLUMN IF NOT EXISTS zakaut numeric DEFAULT 3.0,
  ADD COLUMN IF NOT EXISTS cpi_annual numeric DEFAULT 2.8,
  ADD COLUMN IF NOT EXISTS next_committee text DEFAULT '25 במאי 2026';

-- Update defaults on existing columns
ALTER TABLE public.market_rates ALTER COLUMN prime SET DEFAULT 5.5;
