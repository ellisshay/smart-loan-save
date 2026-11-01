import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Rates } from "@/lib/quickCheck";
import { marketReferenceRate } from "@/lib/mortgage/affordability";

export type MarketRates = Rates & { updated_at?: string | null };

/** Latest public market rates (read-only). `reference` is the average balanced-mix rate, or null. */
export function useMarketRates() {
  const [rates, setRates] = useState<MarketRates | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    supabase.from("market_rates").select("prime,fixed_not_linked,fixed_linked,variable_5,cpi_annual,updated_at")
      .order("updated_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data, error }) => { if (!alive) return; if (error || !data) setFailed(true); else setRates(data as MarketRates); });
    return () => { alive = false; };
  }, []);
  return { rates, failed, reference: marketReferenceRate(rates), cpi: Number(rates?.cpi_annual) || 0 };
}
