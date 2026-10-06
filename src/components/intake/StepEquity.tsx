import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EQUITY_SOURCES } from "@/types/intake";

interface EquityData {
  amount: number;
  sources: string[];
  inAccount: "yes" | "no" | "";
  availableDate?: string;
  notes?: string;
}

interface Props {
  defaultValues: Partial<EquityData>;
  suggestedAmount?: number;
  onNext: (data: EquityData) => void;
  onBack: () => void;
  saving: boolean;
}

export default function StepEquity({ defaultValues, suggestedAmount = 0, onNext, onBack, saving }: Props) {
  const [data, setData] = useState<EquityData>({
    amount: Number(defaultValues.amount ?? suggestedAmount ?? 0),
    sources: defaultValues.sources ?? [],
    inAccount: defaultValues.inAccount ?? "",
    availableDate: defaultValues.availableDate ?? "",
    notes: defaultValues.notes ?? "",
  });

  const valid = useMemo(
    () => data.amount > 0 && data.sources.length > 0 && (data.inAccount === "yes" || data.inAccount === "no"),
    [data],
  );

  const toggleSource = (value: string) => {
    setData((cur) => ({
      ...cur,
      sources: cur.sources.includes(value)
        ? cur.sources.filter((s) => s !== value)
        : [...cur.sources, value],
    }));
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">הון עצמי</h2>
        <p className="text-sm text-muted-foreground">מאיפה מגיע הכסף וכמה ממנו זמין כבר עכשיו</p>
      </div>

      <div className="space-y-5">
        <div className="rounded-xl bg-muted/40 border border-border p-4">
          <span className="text-xs text-muted-foreground block">הון עצמי שציינתם בשלב הנכס</span>
          <span className="font-display text-2xl font-black text-foreground">₪{Number(data.amount || 0).toLocaleString()}</span>
          <p className="text-xs text-muted-foreground mt-1">לשינוי הסכום חזרו לשלב "נכס ועסקה", כדי שסכום המשכנתא ואחוז המימון יתעדכנו יחד.</p>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">מקורות ההון *</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EQUITY_SOURCES.map((source) => (
              <label key={source.value} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 cursor-pointer">
                <Checkbox checked={data.sources.includes(source.value)} onCheckedChange={() => toggleSource(source.value)} />
                <span className="text-sm">{source.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-1.5 block">הכסף כבר זמין בחשבון? *</Label>
          <select
            value={data.inAccount}
            onChange={(e) => setData((cur) => ({ ...cur, inAccount: e.target.value as EquityData["inAccount"] }))}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="">בחר...</option>
            <option value="yes">כן, הכסף זמין</option>
            <option value="no">עדיין לא, צפוי להיכנס</option>
          </select>
        </div>

        {data.inAccount === "no" && (
          <div>
            <Label className="text-sm font-medium mb-1.5 block">מתי הכסף צפוי להיות זמין?</Label>
            <Input type="date" value={data.availableDate || ""} onChange={(e) => setData((cur) => ({ ...cur, availableDate: e.target.value }))} />
          </div>
        )}

        <div>
          <Label className="text-sm font-medium mb-1.5 block">הערה על מקור הכסף, אם צריך</Label>
          <Input value={data.notes || ""} onChange={(e) => setData((cur) => ({ ...cur, notes: e.target.value }))} placeholder="לדוגמה: מתנה מההורים, מכירת דירה, קרן השתלמות..." />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>← חזרה</Button>
        <Button type="button" variant="cta" size="lg" disabled={!valid || saving} onClick={() => onNext(data)}>
          {saving ? "שומר..." : "שמור והמשך ←"}
        </Button>
      </div>
    </motion.div>
  );
}
