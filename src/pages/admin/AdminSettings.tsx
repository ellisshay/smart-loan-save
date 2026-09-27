import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { SlidersHorizontal } from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: number;
  label: string;
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (!isAdmin) { navigate("/"); return; }
      const { data } = await supabase.from("validation_settings").select("id, key, value, label").order("key");
      setRows((data || []).map((r: any) => ({ ...r, value: Number(r.value) })));
      setLoading(false);
    };
    load();
  }, [navigate]);

  const save = async () => {
    setSaving(true);
    for (const r of rows) {
      const { error } = await supabase.from("validation_settings").update({ value: r.value }).eq("id", r.id);
      if (error) {
        setSaving(false);
        return toast({ title: "השמירה נכשלה", description: error.message, variant: "destructive" });
      }
    }
    setSaving(false);
    toast({ title: "ההגדרות נשמרו", description: "הספים החדשים יחולו על כל בדיקת מסמך מעכשיו" });
  };

  if (loading) {
    return <div className="p-6 md:p-8 max-w-3xl space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-display text-3xl font-black text-foreground flex items-center gap-2">
          <SlidersHorizontal size={24} className="text-primary" />
          ספי אימות מסמכים
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          קובע מתי מסמך מאומת אוטומטית, מתי הוא עובר לבדיקת מפעיל ומתי מדובר באי התאמה מהותית.
          הספים נועדו לאפשר שונות טבעית בשכר, בשמות ובשמות מעסיקים בלי להאשים את הלקוח.
        </p>
      </motion.div>

      <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-4">
            <label className="text-sm text-foreground">{r.label}</label>
            <input
              type="number"
              min={0}
              max={100}
              value={r.value}
              onChange={(e) => setRows((prev) => prev.map((p) => p.id === r.id ? { ...p, value: Number(e.target.value) } : p))}
              className="w-24 h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm text-center"
            />
          </div>
        ))}
        <Button variant="cta" onClick={save} disabled={saving} className="w-full mt-2">
          {saving ? "שומר..." : "שמור הגדרות"}
        </Button>
      </div>
    </div>
  );
}
