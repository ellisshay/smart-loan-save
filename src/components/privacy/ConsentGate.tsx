import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck } from "lucide-react";
import { CONTROLLER, hasConsent, recordConsent } from "@/lib/privacy";

export default function ConsentGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "needed" | "ok">("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return setState("ok");
      setUserId(user.id);
      setState((await hasConsent(user.id, "privacy_notice")) ? "ok" : "needed");
    });
  }, []);

  if (state === "loading") return null;
  if (state === "ok") return <>{children}</>;

  const accept = async () => {
    if (!userId || !privacy) return;
    setSaving(true);
    const a = await recordConsent(userId, "privacy_notice");
    const b = await recordConsent(userId, "automated_processing");
    setSaving(false);
    if (a && b) setState("ok");
  };

  return (
    <div dir="rtl" className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-primary" size={28} />
        <h1 className="text-2xl font-bold text-foreground">הודעת פרטיות לפני תחילת מילוי הפרטים</h1>
      </div>
      <div className="text-sm leading-7 text-muted-foreground space-y-3">
        <p><strong className="text-foreground">בעל השליטה במידע:</strong> {CONTROLLER.name}, {CONTROLLER.businessId}. פניות: {CONTROLLER.email}</p>
        <p><strong className="text-foreground">מטרת האיסוף:</strong> בדיקת התאמה למשכנתא, ניתוח כושר החזר, הכנת תיק והשגת הצעות מגופים פיננסיים.</p>
        <p><strong className="text-foreground">חובה או רשות:</strong> אין חובה חוקית למסור את המידע. ללא המידע והמסמכים הנדרשים לא נוכל לטפל בתיק.</p>
        <p><strong className="text-foreground">למי יועבר:</strong> לבנקים וגופים פיננסיים לצורך קבלת הצעות, רק לאחר הסכמה נפרדת שתתבקש בהמשך; ולספקי שירות טכניים הפועלים עבורנו (אחסון, סליקה, דיוור).</p>
        <p><strong className="text-foreground">עיבוד אוטומטי:</strong> המערכת עשויה להשתמש בכלים אוטומטיים לצורך עיבוד, סיווג וסיכום מידע. החלטות מקצועיות מהותיות נבדקות על ידי איש מקצוע.</p>
        <p><strong className="text-foreground">הזכויות שלך:</strong> לעיין במידע, לבקש לתקן אותו ולבקש מחיקה, דרך <Link to="/dashboard/privacy" className="text-primary underline">עמוד הפרטיות שלי</Link>.</p>
        <p><Link to="/legal/privacy" target="_blank" className="text-primary underline">למדיניות הפרטיות המלאה</Link></p>
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox checked={privacy} onCheckedChange={(v) => setPrivacy(v === true)} className="mt-1" />
        <span className="text-sm text-foreground">אני מאשר/ת שקראתי את הודעת הפרטיות ואני מסכים/ה למסירת המידע לצורך בדיקת וטיפול בתיק המשכנתא.</span>
      </label>
      <Button variant="cta" disabled={!privacy || saving} onClick={accept} className="w-full">
        {saving ? "שומר..." : "המשך למילוי הפרטים"}
      </Button>
    </div>
  );
}
