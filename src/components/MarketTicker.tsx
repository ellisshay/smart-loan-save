import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Item {
  label: string;
  value: string;
  change?: number; // percent
  note?: string;
}

// Official indices without a public live feed, latest published values (update monthly).
const STATIC_ITEMS: Item[] = [
  { label: "מדד המחירים לצרכן", value: "2.8%", note: "שנתי" },
  { label: "מדד תשומות הבנייה", value: "3.9%", note: "שנתי" },
  { label: 'ת"א נדל"ן', value: "1,842.6", change: 0.6 },
];

const fmt = (n: number, d = 3) => n.toLocaleString("he-IL", { minimumFractionDigits: d, maximumFractionDigits: d });
const percent = (n: number | null | undefined) => typeof n === "number" ? `${n.toFixed(2)}%` : "-";

export default function MarketTicker() {
  const [live, setLive] = useState<Item[]>([
    { label: "דולר / שקל", value: "-" },
    { label: "אירו / שקל", value: "-" },
    { label: "אירו / דולר", value: "-" },
    { label: "ביטקוין / דולר", value: "-" },
  ]);
  const [rates, setRates] = useState<Item[]>([
    { label: "ריבית בנק ישראל", value: "-" },
    { label: "ריבית פריים", value: "-" },
    { label: "קבועה לא צמודה", value: "-", note: "ממוצע" },
    { label: "קבועה צמודה", value: "-", note: "ממוצע" },
    { label: "משתנה כל 5", value: "-", note: "ממוצע" },
  ]);

  useEffect(() => {
    const load = async () => {
      const { data: marketRates } = await supabase
        .from("market_rates")
        .select("prime, fixed_not_linked, fixed_linked, variable_5, updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (marketRates) {
        const updated = marketRates.updated_at
          ? new Date(marketRates.updated_at).toLocaleDateString("he-IL")
          : undefined;
        setRates([
          { label: "ריבית בנק ישראל", value: percent(Number(marketRates.prime) - 1.5) },
          { label: "ריבית פריים", value: percent(Number(marketRates.prime)) },
          { label: "קבועה לא צמודה", value: percent(Number(marketRates.fixed_not_linked)), note: "ממוצע" },
          { label: "קבועה צמודה", value: percent(Number(marketRates.fixed_linked)), note: "ממוצע" },
          { label: "משתנה כל 5", value: percent(Number(marketRates.variable_5)), note: "ממוצע" },
          ...(updated ? [{ label: "עדכון ריביות", value: updated }] : []),
        ]);
      }

      try {
        const [fx, fxPrev, btc] = await Promise.all([
          fetch("https://api.frankfurter.dev/v1/latest?from=USD&to=ILS,EUR").then((r) => r.json()),
          fetch(`https://api.frankfurter.dev/v1/${new Date(Date.now() - 4 * 864e5).toISOString().slice(0, 10)}?from=USD&to=ILS,EUR`).then((r) => r.json()),
          fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true").then((r) => r.json()),
        ]);
        const usdIls = fx.rates.ILS, usdEur = fx.rates.EUR;
        const pIls = fxPrev.rates.ILS, pEur = fxPrev.rates.EUR;
        const eurIls = usdIls / usdEur, pEurIls = pIls / pEur;
        const eurUsd = 1 / usdEur, pEurUsd = 1 / pEur;
        const pct = (a: number, b: number) => ((a - b) / b) * 100;
        setLive([
          { label: "דולר / שקל", value: fmt(usdIls), change: pct(usdIls, pIls) },
          { label: "אירו / שקל", value: fmt(eurIls), change: pct(eurIls, pEurIls) },
          { label: "אירו / דולר", value: fmt(eurUsd, 4), change: pct(eurUsd, pEurUsd) },
          { label: "ביטקוין / דולר", value: "$" + Math.round(btc.bitcoin.usd).toLocaleString("en-US"), change: btc.bitcoin.usd_24h_change },
        ]);
      } catch {
        /* keep placeholders */
      }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const items = [...rates, ...STATIC_ITEMS.slice(0, 1), ...live.slice(0, 3), ...STATIC_ITEMS.slice(1), live[3]];
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2 px-6 border-l border-gold/15 whitespace-nowrap">
          <span className="text-[11px] tracking-wide text-muted-foreground">{it.label}</span>
          <span className="font-ticker text-xs text-foreground">{it.value}</span>
          {it.note && <span className="text-[10px] text-muted-foreground">{it.note}</span>}
          {typeof it.change === "number" && (
            <span className={`flex items-center gap-0.5 font-ticker text-[11px] ${it.change >= 0 ? "text-success" : "text-destructive"}`}>
              {it.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(it.change).toFixed(2)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative h-9 overflow-hidden border-b border-gold/20 bg-card" aria-label="נתוני שוק">
      <div className="absolute inset-y-0 right-0 z-10 flex items-center gap-2 bg-card px-4 border-l border-gold/25">
        <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
        <span className="text-[11px] font-semibold text-gold">שוק</span>
      </div>
      <div className="flex h-full w-max items-center animate-ticker">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
