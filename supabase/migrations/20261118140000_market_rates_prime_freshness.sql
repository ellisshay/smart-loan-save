-- #52: the daily job updates only prime from the Bank of Israel. It used to stamp source and
-- updated_at on the whole row, so manually entered reference rates looked freshly verified.
-- Prime now carries its own stamp; updated_at/source stay with the manually maintained values.
-- Additive only.
ALTER TABLE public.market_rates
  ADD COLUMN IF NOT EXISTS prime_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS prime_source text;
