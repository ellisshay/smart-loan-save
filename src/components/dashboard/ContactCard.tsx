import { useEffect, useState } from "react";
import { useDashboardCase } from "@/hooks/useDashboardCase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type B = { firstName?: string; lastName?: string; phone?: string; email?: string };

export default function ContactCard() {
  const { intakeData, loading, saving, saveStep } = useDashboardCase();
  const personal = (intakeData.personal || {}) as Record<string, any>;
  const [b1, setB1] = useState<B>({});
  const [b2, setB2] = useState<B>({});
  const [editing, setEditing] = useState(false);
  const two = personal.borrowerCount === "2";

  useEffect(() => {
    setB1(personal.borrower1 || {});
    setB2(personal.borrower2 || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading) return null;

  const save = async () => {
    await saveStep("personal", {
      ...personal,
      borrower1: { ...(personal.borrower1 || {}), ...b1 },
      ...(two ? { borrower2: { ...(personal.borrower2 || {}), ...b2 } } : {}),
    });
    setEditing(false);
    toast({ title: "פרטי הקשר עודכנו" });
  };

  const block = (title: string, v: B, set: (b: B) => void) => (
    <div className="rounded-xl border border-border bg-background p-4 space-y-2">
      <div className="font-display font-bold text-foreground">{title}</div>
      {editing ? (
        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Input value={v.firstName || ""} onChange={(e) => set({ ...v, firstName: e.target.value })} placeholder="שם פרטי" />
            <Input value={v.lastName || ""} onChange={(e) => set({ ...v, lastName: e.target.value })} placeholder="שם משפחה" />
          </div>
          <Input dir="ltr" value={v.phone || ""} onChange={(e) => set({ ...v, phone: e.target.value })} placeholder="0501234567" />
          <Input dir="ltr" type="email" value={v.email || ""} onChange={(e) => set({ ...v, email: e.target.value })} placeholder="email@example.com" />
        </div>
      ) : (
        <div className="space-y-1 text-sm">
          <div className="text-foreground">{[v.firstName, v.lastName].filter(Boolean).join(" ") || "לא הוזן שם"}</div>
          <div className="flex items-center gap-2 text-muted-foreground"><Phone size={14} /><span dir="ltr">{v.phone || "לא הוזן"}</span></div>
          <div className="flex items-center gap-2 text-muted-foreground"><Mail size={14} /><span dir="ltr">{v.email || "לא הוזן"}</span></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2"><Users size={18} className="text-primary" />כרטיס איש קשר</h2>
        {editing ? (
          <Button size="sm" onClick={save} disabled={saving}>{saving ? "שומר..." : "שמירה"}</Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>עריכה</Button>
        )}
      </div>
      <div className={`grid gap-3 ${two ? "sm:grid-cols-2" : ""}`}>
        {block("לווה 1", b1, setB1)}
        {two && block("לווה 2", b2, setB2)}
      </div>
    </div>
  );
}
