import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, Send } from "lucide-react";

const banks = [
  "בנק הפועלים", "בנק לאומי", "בנק דיסקונט", "בנק מזרחי טפחות",
  "הבנק הבינלאומי", "בנק ירושלים", "בנק מסד", "בנק יהב",
];

const trackTypes = [
  { value: "fixed", label: "קבועה לא צמודה" },
  { value: "prime", label: "פריים" },
  { value: "variable_linked", label: "משתנה צמודה" },
  { value: "fixed_linked", label: "קבועה צמודה" },
  { value: "variable", label: "משתנה לא צמודה" },
  { value: "mix", label: "שילוב מסלולים" },
];

interface Props {
  leadId: string;
  advisorId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function AdvisorOfferForm({ leadId, advisorId, onBack, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    bank_name: "",
    interest_rate: "",
    track_type: "",
    monthly_payment: "",
    total_cost: "",
    loan_period: "",
    advisor_fee: "",
    notes: "",
    validity_date: "",
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("offers" as any).insert({
        lead_id: leadId,
        advisor_id: advisorId,
        bank_name: form.bank_name,
        interest_rate: parseFloat(form.interest_rate),
        track_type: form.track_type,
        monthly_payment: parseFloat(form.monthly_payment),
        total_cost: form.total_cost ? parseFloat(form.total_cost) : null,
        loan_period: form.loan_period ? parseInt(form.loan_period) : null,
        advisor_fee: form.advisor_fee ? parseFloat(form.advisor_fee) : 0,
        notes: form.notes || null,
        validity_date: form.validity_date || null,
      });
      if (error) throw error;

      // Fire webhook for new offer
      const { data: leadData } = await supabase.from("leads").select("case_id").eq("id", leadId).single();
      if (leadData?.case_id) {
        await supabase.functions.invoke("webhook-handler", {
          body: {
            event_name: "offer_submitted",
            case_id: leadData.case_id,
            payload: {
              bank_name: form.bank_name,
              interest_rate: form.interest_rate,
              monthly_payment: form.monthly_payment,
              track_type: form.track_type,
              loan_period: form.loan_period,
              advisor_id: advisorId,
            },
          },
        });
      }

      toast({ title: "ההצעה הוגשה בהצלחה! 🎉" });
      onSuccess();
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowRight size={16} /> חזרה לדשבורד
      </button>

      <h2 className="font-display text-2xl font-black text-foreground mb-6">הגשת הצעה</h2>

      <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 border border-border shadow-card space-y-4">
        <div>
          <Label>שם בנק</Label>
          <Select value={form.bank_name} onValueChange={(v) => update("bank_name", v)}>
            <SelectTrigger><SelectValue placeholder="בחר בנק" /></SelectTrigger>
            <SelectContent>
              {banks.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>ריבית (%)</Label>
            <Input type="number" step="0.01" value={form.interest_rate} onChange={(e) => update("interest_rate", e.target.value)} required dir="ltr" placeholder="3.5" />
          </div>
          <div>
            <Label>מסלול</Label>
            <Select value={form.track_type} onValueChange={(v) => update("track_type", v)}>
              <SelectTrigger><SelectValue placeholder="בחר מסלול" /></SelectTrigger>
              <SelectContent>
                {trackTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>החזר חודשי (₪)</Label>
            <Input type="number" value={form.monthly_payment} onChange={(e) => update("monthly_payment", e.target.value)} required dir="ltr" placeholder="4,500" />
          </div>
          <div>
            <Label>עלות כוללת (₪)</Label>
            <Input type="number" value={form.total_cost} onChange={(e) => update("total_cost", e.target.value)} dir="ltr" placeholder="1,200,000" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>תקופה (שנים)</Label>
            <Input type="number" value={form.loan_period} onChange={(e) => update("loan_period", e.target.value)} dir="ltr" placeholder="25" />
          </div>
          <div>
            <Label>עמלת יועץ (₪)</Label>
            <Input type="number" value={form.advisor_fee} onChange={(e) => update("advisor_fee", e.target.value)} dir="ltr" placeholder="0" />
          </div>
        </div>

        <div>
          <Label>תוקף הצעה</Label>
          <Input type="date" value={form.validity_date} onChange={(e) => update("validity_date", e.target.value)} dir="ltr" />
        </div>

        <div>
          <Label>הערות</Label>
          <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="פרטים נוספים על ההצעה..." rows={3} />
        </div>

        <Button type="submit" variant="cta" className="w-full" size="lg" disabled={loading || !form.bank_name || !form.interest_rate || !form.monthly_payment || !form.track_type}>
          <Send size={18} />
          {loading ? "שולח..." : "הגש הצעה"}
        </Button>
      </form>
    </div>
  );
}
