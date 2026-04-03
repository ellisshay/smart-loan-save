import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, ArrowRight, AlertTriangle, CheckCircle,
  Home, RefreshCw, TrendingUp, Building2, GraduationCap, Umbrella,
  Briefcase,
} from "lucide-react";
import { useQuizSession } from "@/hooks/useQuizSession";
import { QuizData } from "@/types/quiz";

// ─── Shared UI Components ───

function OptionCard({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 transition-all text-right min-h-[56px] ${
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function StepNote({ children, variant = "info" }: { children: React.ReactNode; variant?: "info" | "warning" | "success" }) {
  const colors = {
    info: "bg-primary/10 border-primary/20 text-primary",
    warning: "bg-[hsl(var(--warning))]/10 border-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]",
    success: "bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/20 text-[hsl(var(--success))]",
  };
  const icons = {
    info: null,
    warning: <AlertTriangle size={14} className="shrink-0 mt-0.5" />,
    success: <CheckCircle size={14} className="shrink-0 mt-0.5" />,
  };
  return (
    <div className={`flex items-start gap-2 text-xs p-3 rounded-lg border ${colors[variant]}`}>
      {icons[variant]}
      <span>{children}</span>
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  note,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  note?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-[hsl(var(--primary))]"
      />
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

const shekel = (v: number) => `₪${v.toLocaleString("he-IL")}`;

// ─── Step Components ───

function StepPurpose({ data, update }: StepProps) {
  const options = [
    { value: "new", label: "משכנתא חדשה", desc: "רכישת נכס", icon: Home },
    { value: "refi", label: "מיחזור", desc: "יש לי משכנתא ואני רוצה לשפר", icon: RefreshCw },
    { value: "increase", label: "הגדלת משכנתא", desc: "רוצה להוסיף על המשכנתא הקיימת", icon: TrendingUp },
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">מה אתה מחפש?</h2>
      <div className="grid gap-3">
        {options.map((opt) => (
          <OptionCard key={opt.value} selected={data.purpose === opt.value} onClick={() => update({ purpose: opt.value as QuizData["purpose"] })}>
            <div className="flex items-center gap-3">
              <opt.icon size={24} className="text-primary shrink-0" />
              <div>
                <p className="font-bold text-base">{opt.label}</p>
                <p className="text-sm text-muted-foreground">{opt.desc}</p>
              </div>
            </div>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

function StepPersonal({ data, update }: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">פרטים אישיים</h2>

      {/* Age */}
      <div className="space-y-2">
        <p className="font-medium text-sm">מה הגיל שלך?</p>
        <div className="grid grid-cols-5 gap-2">
          {["18-25", "26-35", "36-45", "46-55", "56+"].map((v) => (
            <OptionCard key={v} selected={data.age_range === v} onClick={() => update({ age_range: v })} className="text-center text-sm py-3">
              {v}
            </OptionCard>
          ))}
        </div>
        <StepNote>הגיל משפיע על תקופת ההלוואה המקסימלית</StepNote>
      </div>

      {/* Marital */}
      <div className="space-y-2">
        <p className="font-medium text-sm">מצב משפחתי</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { v: "single", l: "יחיד/ה" },
            { v: "married", l: "זוג נשוי" },
            { v: "unmarried_couple", l: "זוג לא נשוי" },
            { v: "divorced", l: "גרוש/ה" },
            { v: "widowed", l: "אלמן/ה" },
          ].map((o) => (
            <OptionCard key={o.v} selected={data.marital_status === o.v} onClick={() => update({ marital_status: o.v })} className="text-center text-sm py-3">
              {o.l}
            </OptionCard>
          ))}
        </div>
      </div>

      {/* Co-borrower */}
      {(data.marital_status === "married" || data.marital_status === "unmarried_couple") && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
          <p className="font-medium text-sm">האם בן/בת הזוג יחתמו על המשכנתא?</p>
          <div className="grid grid-cols-2 gap-2">
            <OptionCard selected={data.co_borrower === true} onClick={() => update({ co_borrower: true })} className="text-center text-sm py-3">
              כן, שנינו
            </OptionCard>
            <OptionCard selected={data.co_borrower === false} onClick={() => update({ co_borrower: false })} className="text-center text-sm py-3">
              לא, רק אני
            </OptionCard>
          </div>
        </motion.div>
      )}

      {/* Children */}
      <div className="space-y-2">
        <p className="font-medium text-sm">ילדים</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { v: "0", l: "אין" },
            { v: "1-2", l: "1-2" },
            { v: "3-4", l: "3-4" },
            { v: "5+", l: "5+" },
          ].map((o) => (
            <OptionCard key={o.v} selected={data.children === o.v} onClick={() => update({ children: o.v })} className="text-center text-sm py-3">
              {o.l}
            </OptionCard>
          ))}
        </div>
        <StepNote>ילדים משפיעים על ההוצאות החודשיות שהבנק מחשב</StepNote>
      </div>
    </div>
  );
}

function StepEmployment({ data, update }: StepProps) {
  const empOptions = [
    { v: "employee", l: "שכיר/ה", d: "משכורת קבועה", icon: Briefcase },
    { v: "self_employed", l: "עצמאי/ת", d: "עסק עצמי / פרילנס", icon: Building2 },
    { v: "both", l: "שכיר/ה + עצמאי/ת", d: "הכנסה משולבת", icon: TrendingUp },
    { v: "company_owner", l: "בעל/ת חברה", d: "משכורת מחברה בבעלותי", icon: Building2 },
    { v: "student", l: "סטודנט/ית", d: "לומד/ת כרגע", icon: GraduationCap },
    { v: "pension", l: "פנסיה/קצבה", d: "הכנסה קבועה אחרת", icon: Umbrella },
  ];

  const sectors = [
    { v: "tech", l: "הייטק / תוכנה" }, { v: "finance", l: "בנקאות ופיננסים" },
    { v: "medicine", l: "רפואה ובריאות" }, { v: "education", l: "חינוך" },
    { v: "government", l: "ממשלה / מדינה" }, { v: "construction", l: "בניה ונדלן" },
    { v: "commerce", l: "מסחר ושירותים" }, { v: "industry", l: "תעשיה" }, { v: "other", l: "אחר" },
  ];

  const sectorNotes: Record<string, string> = {
    tech: "בונוסים ואופציות יכולים להיחשב כהכנסה נוספת",
    government: "עובדי מדינה נחשבים יציבים מאוד בעיני הבנקים",
    construction: "נבדוק אם יש חוזה מול מעסיק",
  };

  const isEmp = data.employment_type === "employee" || data.employment_type === "both";
  const isSelf = data.employment_type === "self_employed" || data.employment_type === "both";
  const isOwner = data.employment_type === "company_owner";
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">תעסוקה והכנסות</h2>

      {/* Employment type */}
      <div className="space-y-2">
        <p className="font-medium text-sm">סוג תעסוקה ראשית</p>
        <div className="grid grid-cols-2 gap-2">
          {empOptions.map((o) => (
            <OptionCard key={o.v} selected={data.employment_type === o.v} onClick={() => update({ employment_type: o.v })}>
              <div className="flex items-center gap-2">
                <o.icon size={18} className="text-primary shrink-0" />
                <div>
                  <p className="font-medium text-sm">{o.l}</p>
                  <p className="text-xs text-muted-foreground">{o.d}</p>
                </div>
              </div>
            </OptionCard>
          ))}
        </div>
      </div>

      {/* Employee fields */}
      {isEmp && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 border-t border-border pt-4">
          <p className="font-medium text-sm text-primary">פרטי שכיר</p>

          {/* Sector */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">תחום עבודה</p>
            <div className="grid grid-cols-3 gap-2">
              {sectors.map((s) => (
                <OptionCard key={s.v} selected={data.work_sector === s.v} onClick={() => update({ work_sector: s.v })} className="text-center text-xs py-2">
                  {s.l}
                </OptionCard>
              ))}
            </div>
            {data.work_sector && sectorNotes[data.work_sector] && (
              <StepNote variant="success">{sectorNotes[data.work_sector]}</StepNote>
            )}
          </div>

          {/* Seniority */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">ותק בעבודה הנוכחית</p>
            <div className="grid grid-cols-5 gap-2">
              {[
                { v: "under_6m", l: "פחות מ-6 חודשים" },
                { v: "6-12m", l: "6-12 חודשים" },
                { v: "1-3", l: "1-3 שנים" },
                { v: "3-5", l: "3-5 שנים" },
                { v: "5+", l: "5+ שנים" },
              ].map((o) => (
                <OptionCard key={o.v} selected={data.seniority === o.v} onClick={() => update({ seniority: o.v })} className="text-center text-xs py-2">
                  {o.l}
                </OptionCard>
              ))}
            </div>
            {data.seniority === "under_6m" && (
              <StepNote variant="warning">ותק קצר מעלה את רמת הסיכון בעיני הבנק. יש לנו טכניקות לטפל בזה.</StepNote>
            )}
          </div>

          {/* Salary */}
          <SliderField
            label="שכר נטו חודשי"
            value={data.salary_net || 12000}
            onChange={(v) => update({ salary_net: v })}
            min={3000} max={60000} step={500}
            format={(v) => `${shekel(v)} לחודש`}
            note="שכר נטו = אחרי ניכוי מס, ביטוח לאומי ופנסיה"
          />

          {data.co_borrower && (
            <SliderField
              label="שכר נטו חודשי – מגיש/ה שני/ה"
              value={data.salary_net_2 || 10000}
              onChange={(v) => update({ salary_net_2: v })}
              min={3000} max={60000} step={500}
              format={(v) => `${shekel(v)} לחודש`}
            />
          )}

          {data.co_borrower && data.salary_net && data.salary_net_2 && (
            <StepNote variant="success">הכנסה משפחתית: {shekel((data.salary_net || 0) + (data.salary_net_2 || 0))}</StepNote>
          )}

          {/* Bonuses (tech/finance) */}
          {(data.work_sector === "tech" || data.work_sector === "finance") && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">בונוסים שנתיים</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: "none", l: "אין" },
                  { v: "up_30k", l: "עד ₪30,000/שנה" },
                  { v: "30k_80k", l: "₪30K–₪80K/שנה" },
                  { v: "80k_plus", l: "מעל ₪80K/שנה" },
                ].map((o) => (
                  <OptionCard key={o.v} selected={data.annual_bonus === o.v} onClick={() => update({ annual_bonus: o.v })} className="text-center text-xs py-2">
                    {o.l}
                  </OptionCard>
                ))}
              </div>
            </div>
          )}

          {/* Stock options (tech) */}
          {data.work_sector === "tech" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">אופציות/מניות</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: "none", l: "אין" },
                  { v: "unvested", l: "יש – עוד לא בשלו" },
                  { v: "vested", l: "יש – בשלו השנה" },
                  { v: "sold", l: "יש – מכרתי לאחרונה" },
                ].map((o) => (
                  <OptionCard key={o.v} selected={data.stock_options === o.v} onClick={() => update({ stock_options: o.v })} className="text-center text-xs py-2">
                    {o.l}
                  </OptionCard>
                ))}
              </div>
              {data.stock_options === "vested" && (
                <StepNote variant="success">אופציות שבשלו בשנה האחרונה יכולות להיחשב כהון עצמי נוסף</StepNote>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Self-employed fields */}
      {isSelf && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 border-t border-border pt-4">
          <p className="font-medium text-sm text-primary">פרטי עצמאי</p>

          <Input
            placeholder="תחום העסק (לדוגמה: פיתוח תוכנה, יעוץ...)"
            value={data.business_field || ""}
            onChange={(e) => update({ business_field: e.target.value })}
            className="text-right"
          />

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">כמה שנים עצמאי?</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { v: "under_1", l: "פחות משנה" },
                { v: "1-2", l: "1-2 שנים" },
                { v: "2-3", l: "2-3 שנים" },
                { v: "3+", l: "3+ שנים" },
              ].map((o) => (
                <OptionCard key={o.v} selected={data.self_years === o.v} onClick={() => update({ self_years: o.v })} className="text-center text-xs py-2">
                  {o.l}
                </OptionCard>
              ))}
            </div>
            {(data.self_years === "under_1" || data.self_years === "1-2") && (
              <StepNote variant="warning">פחות מ-2 שנות ותק כעצמאי מאתגר, אבל לא בלתי אפשרי. יש לנו אסטרטגיות.</StepNote>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">הכנסה שנתית {currentYear - 1}</label>
              <Input
                type="number"
                placeholder="₪"
                value={data.annual_income_y1 || ""}
                onChange={(e) => update({ annual_income_y1: Number(e.target.value) })}
                className="text-right"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">הכנסה שנתית {currentYear - 2}</label>
              <Input
                type="number"
                placeholder="₪"
                value={data.annual_income_y2 || ""}
                onChange={(e) => update({ annual_income_y2: Number(e.target.value) })}
                className="text-right"
              />
            </div>
          </div>

          {data.annual_income_y1 && data.annual_income_y2 && (
            <>
              <StepNote variant="info">ממוצע חודשי: {shekel(Math.round((data.annual_income_y1 + data.annual_income_y2) / 2 / 12))}</StepNote>
              {data.annual_income_y1 < data.annual_income_y2 * 0.7 && (
                <StepNote variant="warning">ירידה משמעותית בהכנסה בין השנים – הבנק יחשב ממוצע</StepNote>
              )}
              {data.annual_income_y1 > data.annual_income_y2 * 1.5 && (
                <StepNote variant="success">עלייה בהכנסה – זה חיובי! הבנק יעדיף לראות מגמה עולה.</StepNote>
              )}
            </>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">האם מגיש דוחות שנתיים?</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: "yes_ordered", l: "כן, מסודר" },
                { v: "yes_late", l: "כן, לפעמים מאחר" },
                { v: "no", l: "לא מגיש" },
              ].map((o) => (
                <OptionCard key={o.v} selected={data.files_reports === o.v} onClick={() => update({ files_reports: o.v })} className="text-center text-xs py-2">
                  {o.l}
                </OptionCard>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Company owner fields */}
      {isOwner && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 border-t border-border pt-4">
          <p className="font-medium text-sm text-primary">פרטי חברה</p>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">סוג חברה</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: "ltd", l: 'בע"מ' },
                { v: "licensed", l: "עוסק מורשה" },
                { v: "partnership", l: "שותפות" },
              ].map((o) => (
                <OptionCard key={o.v} selected={data.company_type === o.v} onClick={() => update({ company_type: o.v })} className="text-center text-xs py-2">
                  {o.l}
                </OptionCard>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">משכורת רשומה חודשית</label>
              <Input
                type="number" placeholder="₪"
                value={data.registered_salary || ""}
                onChange={(e) => update({ registered_salary: Number(e.target.value) })}
                className="text-right"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">רווח חברה שנתי ממוצע</label>
              <Input
                type="number" placeholder="₪"
                value={data.company_profit || ""}
                onChange={(e) => update({ company_profit: Number(e.target.value) })}
                className="text-right"
              />
            </div>
          </div>
          <StepNote>בנקים בוחנים שילוב של משכורת + רווחי חברה</StepNote>
        </motion.div>
      )}
    </div>
  );
}

function StepProperty({ data, update }: StepProps) {
  const areas = [
    { v: "tel_aviv", l: "תל אביב וגוש דן" }, { v: "jerusalem", l: "ירושלים" },
    { v: "haifa", l: "חיפה והצפון" }, { v: "south", l: "הדרום" },
    { v: "sharon", l: "השרון" }, { v: "center", l: "מרכז" }, { v: "periphery", l: "פריפריה" },
  ];

  const areaNotes: Record<string, string> = {
    tel_aviv: "מחירים גבוהים = LTV גבוה יותר נדרש",
    periphery: "יתרונות מסוימים בתוכניות ממשלתיות",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">הנכס והעסקה</h2>

      <SliderField
        label="מחיר הנכס"
        value={data.property_price || 1500000}
        onChange={(v) => update({ property_price: v })}
        min={500000} max={6000000} step={50000}
        format={shekel}
      />
      <div className="flex gap-2 justify-center">
        {[1000000, 1500000, 2000000].map((v) => (
          <Button key={v} variant="outline" size="sm" onClick={() => update({ property_price: v })} className="text-xs">
            {shekel(v)}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <p className="font-medium text-sm">אזור הנכס</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {areas.map((a) => (
            <OptionCard key={a.v} selected={data.property_area === a.v} onClick={() => update({ property_area: a.v })} className="text-center text-xs py-2">
              {a.l}
            </OptionCard>
          ))}
        </div>
        {data.property_area && areaNotes[data.property_area] && (
          <StepNote>{areaNotes[data.property_area]}</StepNote>
        )}
      </div>

      <div className="space-y-2">
        <p className="font-medium text-sm">מצב הנכס</p>
        <div className="grid gap-2">
          {[
            { v: "found", l: "מצאתי נכס ספציפי" },
            { v: "searching", l: "מחפש עדיין" },
            { v: "construction", l: "בנייה מקבלן" },
          ].map((o) => (
            <OptionCard key={o.v} selected={data.property_status === o.v} onClick={() => update({ property_status: o.v })} className="text-sm py-3">
              {o.l}
            </OptionCard>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-medium text-sm">נכסים קיימים</p>
        <div className="grid gap-2">
          {[
            { v: "none", l: "אין נכסים נוספים" },
            { v: "one_no_mortgage", l: "יש נכס אחד נוסף – ללא משכנתא" },
            { v: "one_with_mortgage", l: "יש נכס אחד נוסף – עם משכנתא" },
            { v: "multiple", l: "יש 2+ נכסים" },
          ].map((o) => (
            <OptionCard key={o.v} selected={data.existing_properties === o.v} onClick={() => update({ existing_properties: o.v })} className="text-sm py-3">
              {o.l}
            </OptionCard>
          ))}
        </div>
      </div>

      {(data.existing_properties === "one_with_mortgage" || data.existing_properties === "multiple") && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">שווי הנכס הנוסף</label>
              <Input type="number" placeholder="₪" value={data.additional_property_value || ""} onChange={(e) => update({ additional_property_value: Number(e.target.value) })} className="text-right" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">יתרת המשכנתא עליו</label>
              <Input type="number" placeholder="₪" value={data.additional_mortgage_balance || ""} onChange={(e) => update({ additional_mortgage_balance: Number(e.target.value) })} className="text-right" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">האם מוכרים את הנכס במקביל?</p>
            <div className="grid grid-cols-2 gap-2">
              <OptionCard selected={data.selling_property === true} onClick={() => update({ selling_property: true })} className="text-center text-sm py-2">כן</OptionCard>
              <OptionCard selected={data.selling_property === false} onClick={() => update({ selling_property: false })} className="text-center text-sm py-2">לא</OptionCard>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StepEquity({ data, update }: StepProps) {
  const price = data.property_price || 1500000;
  const equity = data.equity_amount || 0;
  const ltv = price > 0 ? Math.round(((price - equity) / price) * 100) : 0;
  const ltvColor = ltv < 60 ? "text-[hsl(var(--success))]" : ltv <= 75 ? "text-[hsl(var(--warning))]" : "text-destructive";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">הון עצמי</h2>

      <SliderField
        label="סה״כ הון עצמי זמין"
        value={equity}
        onChange={(v) => update({ equity_amount: v })}
        min={0} max={3000000} step={10000}
        format={shekel}
      />

      {/* Live LTV */}
      <Card className="bg-muted/50">
        <CardContent className="py-4 px-5 grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <p className="text-xs text-muted-foreground">הון עצמי</p>
            <p className="font-bold">{shekel(equity)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">הלוואה נדרשת</p>
            <p className="font-bold">{shekel(Math.max(0, price - equity))}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">LTV</p>
            <p className={`font-bold ${ltvColor}`}>{ltv}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Equity sources */}
      <div className="space-y-2">
        <p className="font-medium text-sm">מקורות הון עצמי</p>
        {[
          "חסכון אישי", "עזרת הורים / מתנה", "מכירת נכס קיים",
          "קרן השתלמות", "פיצויים / חסכון פנסיוני", "הלוואה מגורם אחר",
        ].map((source) => {
          const sources = data.equity_sources || [];
          const checked = sources.some((s) => s.source === source);
          return (
            <div key={source} className="flex items-center gap-2">
              <Checkbox
                checked={checked}
                onCheckedChange={(c) => {
                  const updated = c
                    ? [...sources, { source, amount: 0 }]
                    : sources.filter((s) => s.source !== source);
                  update({ equity_sources: updated });
                }}
              />
              <span className="text-sm">{source}</span>
            </div>
          );
        })}
        {(data.equity_sources || []).some((s) => s.source === "הלוואה מגורם אחר") && (
          <StepNote variant="warning">הלוואה שנלקחת לצורך הון עצמי יכולה להשפיע על אישור המשכנתא</StepNote>
        )}
      </div>

      {/* Government eligibility */}
      <div className="space-y-2">
        <p className="font-medium text-sm">זכאות לדיור ממשלתי</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: "young_couple", l: "כן – זוג צעיר" },
            { v: "new_immigrant", l: "כן – עולה חדש" },
            { v: "disabled", l: "כן – נכה" },
            { v: "none", l: "לא / לא בטוח" },
          ].map((o) => (
            <OptionCard key={o.v} selected={data.government_eligibility === o.v} onClick={() => update({ government_eligibility: o.v })} className="text-center text-xs py-2">
              {o.l}
            </OptionCard>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepObligations({ data, update }: StepProps) {
  const loans = data.loans || [];
  const totalLoanPayments = loans.reduce((s, l) => s + l.monthly, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">התחייבויות קיימות</h2>
      <StepNote>הבנק בודק את כל ההתחייבויות שלך לפני אישור</StepNote>

      {/* Loans */}
      <div className="space-y-2">
        <p className="font-medium text-sm">הלוואות קיימות</p>
        <div className="grid grid-cols-2 gap-2">
          <OptionCard selected={data.has_loans === false} onClick={() => update({ has_loans: false, loans: [] })} className="text-center text-sm py-3">
            אין הלוואות
          </OptionCard>
          <OptionCard selected={data.has_loans === true} onClick={() => update({ has_loans: true })} className="text-center text-sm py-3">
            יש הלוואות
          </OptionCard>
        </div>
      </div>

      {data.has_loans && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {loans.map((loan, i) => (
            <Card key={i}>
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">הלוואה {i + 1}</span>
                  <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => update({ loans: loans.filter((_, j) => j !== i) })}>
                    הסר
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    className="text-xs rounded-md border border-border bg-card p-2"
                    value={loan.type}
                    onChange={(e) => {
                      const updated = [...loans];
                      updated[i] = { ...loan, type: e.target.value };
                      update({ loans: updated });
                    }}
                  >
                    <option value="">סוג</option>
                    <option value="personal">אישית</option>
                    <option value="car">רכב</option>
                    <option value="leasing">ליסינג</option>
                    <option value="credit">אשראי מגולגל</option>
                    <option value="other">אחר</option>
                  </select>
                  <Input
                    type="number" placeholder="החזר/חודש" className="text-xs text-right"
                    value={loan.monthly || ""}
                    onChange={(e) => {
                      const updated = [...loans];
                      updated[i] = { ...loan, monthly: Number(e.target.value) };
                      update({ loans: updated });
                    }}
                  />
                  <Input
                    type="number" placeholder="חודשים נשארו" className="text-xs text-right"
                    value={loan.remaining_months || ""}
                    onChange={(e) => {
                      const updated = [...loans];
                      updated[i] = { ...loan, remaining_months: Number(e.target.value) };
                      update({ loans: updated });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          {loans.length < 5 && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => update({ loans: [...loans, { type: "", monthly: 0, remaining_months: 0 }] })}>
              + הוסף הלוואה
            </Button>
          )}
          {totalLoanPayments > 0 && (
            <StepNote>סה״כ החזרי הלוואות: {shekel(totalLoanPayments)}/חודש</StepNote>
          )}
        </motion.div>
      )}

      {/* Additional obligations */}
      <div className="space-y-3">
        <p className="font-medium text-sm">התחייבויות נוספות</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Checkbox checked={!!data.alimony} onCheckedChange={(c) => update({ alimony: c ? 1 : 0 })} />
            <span className="text-sm">מזונות</span>
            {!!data.alimony && (
              <Input type="number" placeholder="₪/חודש" className="w-24 text-xs text-right" value={data.alimony || ""} onChange={(e) => update({ alimony: Number(e.target.value) })} />
            )}
          </div>
          <div className="flex items-center gap-3">
            <Checkbox checked={data.overdraft === true} onCheckedChange={(c) => update({ overdraft: !!c })} />
            <span className="text-sm">מינוס בבנק קבוע</span>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox checked={data.guarantor === true} onCheckedChange={(c) => update({ guarantor: !!c })} />
            <span className="text-sm">ערבות להלוואה אחרת</span>
          </div>
        </div>
      </div>

      {/* Credit history */}
      <div className="space-y-2">
        <p className="font-medium text-sm">היסטוריית אשראי</p>
        <div className="grid gap-2">
          {[
            { v: "clean", emoji: "😊", l: "נקי לגמרי", d: "אף פעם לא פיגרתי בתשלום" },
            { v: "minor_past", emoji: "😐", l: "בעיות קטנות בעבר", d: "היו כמה עיכובים, אבל הכל סגור" },
            { v: "active_issues", emoji: "😟", l: "יש בעיות פעילות", d: "יש חובות / עיכובים פעילים" },
          ].map((o) => (
            <OptionCard key={o.v} selected={data.credit_history === o.v} onClick={() => update({ credit_history: o.v })}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{o.emoji}</span>
                <div>
                  <p className="font-medium text-sm">{o.l}</p>
                  <p className="text-xs text-muted-foreground">{o.d}</p>
                </div>
              </div>
            </OptionCard>
          ))}
        </div>
        {data.credit_history === "active_issues" && (
          <StepNote variant="info">זה קורה לאנשים רבים. יש לנו יועצים שמתמחים בדיוק במקרים כאלה.</StepNote>
        )}
      </div>
    </div>
  );
}

function StepExistingMortgage({ data, update }: StepProps) {
  const banks = ["פועלים", "לאומי", "מזרחי", "דיסקונט", "בינלאומי", "אחר"];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">משכנתא קיימת</h2>

      <div className="space-y-2">
        <p className="font-medium text-sm">בנק</p>
        <div className="grid grid-cols-3 gap-2">
          {banks.map((b) => (
            <OptionCard key={b} selected={data.current_bank === b} onClick={() => update({ current_bank: b })} className="text-center text-sm py-2">
              {b}
            </OptionCard>
          ))}
        </div>
      </div>

      <SliderField
        label="יתרה לסיום"
        value={data.current_balance || 500000}
        onChange={(v) => update({ current_balance: v })}
        min={50000} max={3000000} step={10000}
        format={shekel}
      />

      <SliderField
        label="שנים שנשארו"
        value={data.current_years_left || 20}
        onChange={(v) => update({ current_years_left: v })}
        min={1} max={30} step={1}
        format={(v) => `${v} שנים`}
      />

      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">החזר חודשי נוכחי</label>
        <Input
          type="number" placeholder="₪"
          value={data.current_monthly || ""}
          onChange={(e) => update({ current_monthly: Number(e.target.value) })}
          className="text-right"
        />
      </div>

      <div className="space-y-2">
        <p className="font-medium text-sm">יש לך הצעה קיימת מבנק?</p>
        <div className="grid grid-cols-2 gap-2">
          <OptionCard selected={data.has_bank_offer === true} onClick={() => update({ has_bank_offer: true })} className="text-center text-sm py-3">כן</OptionCard>
          <OptionCard selected={data.has_bank_offer === false} onClick={() => update({ has_bank_offer: false })} className="text-center text-sm py-3">לא</OptionCard>
        </div>
      </div>

      {data.has_bank_offer && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">ריבית ההצעה</label>
            <Input type="number" step="0.1" placeholder="%" value={data.bank_offer_rate || ""} onChange={(e) => update({ bank_offer_rate: Number(e.target.value) })} className="text-right" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">החזר חודשי</label>
            <Input type="number" placeholder="₪" value={data.bank_offer_monthly || ""} onChange={(e) => update({ bank_offer_monthly: Number(e.target.value) })} className="text-right" />
          </div>
        </motion.div>
      )}

      {data.has_bank_offer && data.bank_offer_rate && data.bank_offer_rate > 4.8 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 px-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <p className="text-xs text-muted-foreground">ההצעה שלך</p>
              <p className="font-bold text-destructive">{data.bank_offer_rate}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ממוצע שוק</p>
              <p className="font-bold text-[hsl(var(--success))]">4.8%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">הפרש חודשי</p>
              <p className="font-bold text-destructive">
                ₪{Math.round((data.current_balance || 500000) * (data.bank_offer_rate - 4.8) / 100 / 12).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepPreferences({ data, update }: StepProps) {
  const priorityOptions = [
    { v: "low_monthly", emoji: "💰", l: "החזר חודשי נמוך", d: "אני רוצה לשלם כמה שפחות כל חודש" },
    { v: "total_savings", emoji: "💎", l: "חיסכון כולל", d: "חשוב לי הסכום הכולל שאשלם" },
    { v: "stability", emoji: "🔒", l: "יציבות וביטחון", d: "אני רוצה ריבית קבועה שלא תפתיע" },
    { v: "flexibility", emoji: "🔓", l: "גמישות", d: "אולי ארצה לפרוע מוקדם" },
    { v: "speed", emoji: "⚡", l: "מהירות אישור", d: "אני צריך אישור מהיר" },
  ];

  const urgencyOptions = [
    { v: "urgent_30", emoji: "🔥", l: "יש עסקה שצריך לסגור תוך 30 יום" },
    { v: "medium_90", emoji: "📅", l: "יש עסקה בתוך 2-3 חודשים" },
    { v: "planning", emoji: "🔍", l: "מחפש ומתכנן קדימה" },
    { v: "refi_check", emoji: "🔄", l: "רוצה לבדוק מיחזור" },
  ];

  const priorities = data.priorities || [];
  const togglePriority = (v: string) => {
    const updated = priorities.includes(v) ? priorities.filter((p) => p !== v) : [...priorities, v];
    update({ priorities: updated });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">מה הכי חשוב לך?</h2>

      <div className="space-y-2">
        <p className="font-medium text-sm">סדר עדיפויות (בחר עד 3)</p>
        <div className="grid gap-2">
          {priorityOptions.map((o) => (
            <OptionCard
              key={o.v}
              selected={priorities.includes(o.v)}
              onClick={() => {
                if (priorities.length < 3 || priorities.includes(o.v)) togglePriority(o.v);
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{o.emoji}</span>
                <div>
                  <p className="font-medium text-sm">{o.l}</p>
                  <p className="text-xs text-muted-foreground">{o.d}</p>
                </div>
                {priorities.includes(o.v) && (
                  <Badge className="mr-auto text-xs">{priorities.indexOf(o.v) + 1}</Badge>
                )}
              </div>
            </OptionCard>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-medium text-sm">דחיפות</p>
        <div className="grid gap-2">
          {urgencyOptions.map((o) => (
            <OptionCard key={o.v} selected={data.urgency === o.v} onClick={() => update({ urgency: o.v })}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{o.emoji}</span>
                <span className="text-sm">{o.l}</span>
              </div>
            </OptionCard>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-medium text-sm">הערות חופשיות (לא חובה)</p>
        <Textarea
          placeholder={`כתוב כאן כל מידע נוסף שחשוב לך שנדע...\nלדוגמה: 'אני בהייטק עם אופציות שיבשילו בעוד שנתיים'\n'הורים שלי נותנים עזרה שלא נרשמת רשמית'`}
          value={data.notes || ""}
          onChange={(e) => update({ notes: e.target.value })}
          className="text-right min-h-[100px]"
        />
      </div>
    </div>
  );
}

// ─── Step Props Interface ───
interface StepProps {
  data: QuizData;
  update: (partial: Partial<QuizData>) => void;
}

// ─── Main SmartAssessment Component ───
export default function SmartAssessment({
  onComplete,
}: {
  onComplete: (score: number, data: QuizData) => void;
}) {
  const { quizData, currentStep, score, saving, updateData, goToStep, markComplete } = useQuizSession();

  // Determine steps based on purpose
  const steps = useMemo(() => {
    const base = [
      { id: "purpose", label: "מטרה", component: StepPurpose },
      { id: "personal", label: "פרטים אישיים", component: StepPersonal },
      { id: "employment", label: "תעסוקה והכנסות", component: StepEmployment },
      { id: "property", label: "הנכס", component: StepProperty },
      { id: "equity", label: "הון עצמי", component: StepEquity },
      { id: "obligations", label: "התחייבויות", component: StepObligations },
    ];
    if (quizData.purpose === "refi" || quizData.purpose === "increase") {
      base.push({ id: "existing", label: "משכנתא קיימת", component: StepExistingMortgage });
    }
    base.push({ id: "preferences", label: "העדפות", component: StepPreferences });
    return base;
  }, [quizData.purpose]);

  const totalSteps = steps.length;
  const CurrentStepComponent = steps[currentStep]?.component;
  const isLastStep = currentStep === totalSteps - 1;

  const canAdvance = () => {
    const d = quizData;
    switch (steps[currentStep]?.id) {
      case "purpose": return !!d.purpose;
      case "personal": return !!d.age_range && !!d.marital_status;
      case "employment": return !!d.employment_type;
      case "property": return !!d.property_price;
      case "equity": return d.equity_amount !== undefined;
      case "obligations": return d.has_loans !== undefined && !!d.credit_history;
      case "existing": return !!d.current_bank;
      case "preferences": return (d.priorities?.length || 0) > 0 && !!d.urgency;
      default: return true;
    }
  };

  const handleNext = async () => {
    if (isLastStep) {
      await markComplete();
      onComplete(score, quizData);
    } else {
      goToStep(currentStep + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>שלב {currentStep + 1} מתוך {totalSteps}</span>
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs text-primary animate-pulse">שומר...</span>}
            <span className="font-bold text-foreground">ציון: {score}</span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          {CurrentStepComponent && (
            <CurrentStepComponent data={quizData} update={updateData} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3">
        {currentStep > 0 && (
          <Button variant="outline" className="flex-1" onClick={() => goToStep(currentStep - 1)}>
            <ArrowRight size={16} />
            חזרה
          </Button>
        )}
        <Button
          className="flex-1"
          disabled={!canAdvance()}
          onClick={handleNext}
        >
          {isLastStep ? "קבל ציון וניתוח ←" : "המשך ←"}
          <ArrowLeft size={16} />
        </Button>
      </div>
    </div>
  );
}
