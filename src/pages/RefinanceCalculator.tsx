import { useMemo, useState } from "react";
import { CalculatorShell, NumberField, BigResult, ResultGrid, BeforeAfter } from "@/components/calculators/CalculatorShell";
import { nis } from "@/components/mortgage/primitives";
import { refinanceCompare, VERDICT_TEXT } from "@/lib/mortgage/scenarios";

const EXPLAIN = {
  potential: "לפי הנתונים שהזנתם, ההחזר החלופי נמוך יותר ועלויות המחזור מתקזזות בתוך פרק זמן סביר. כדאי לבדוק את המספרים המדויקים לפי דוח יתרות לסילוק, כולל עמלות הפירעון בפועל.",
  check: "יש הפרש, אבל הוא קטן או שלוקח זמן רב לכסות את עלויות המחזור. בדיקה לפי דוח יתרות לסילוק תראה אם שינוי של חלק מהמסלולים משתלם יותר ממחזור מלא.",
  none: "לפי הנתונים שהזנתם, הריבית החלופית לא מורידה את העלות אחרי עלויות המחזור. ייתכן שעדיין יש מסלולים בודדים שכדאי לבדוק.",
} as const;

export default function RefinanceCalculator() {
  const [balance, setBalance] = useState<number | null>(800_000);
  const [yrs, setYrs] = useState<number | null>(20);
  const [cur, setCur] = useState<number | null>(5.2);
  const [next, setNext] = useState<number | null>(4.4);
  const [costs, setCosts] = useState<number | null>(6000);

  const r = useMemo(() => {
    if (!balance || !yrs || cur === null || next === null) return null;
    return refinanceCompare({ balance, years: yrs, currentRate: cur, newRate: next, costs: costs || 0 });
  }, [balance, yrs, cur, next, costs]);

  const be = r?.breakEven;
  return (
    <CalculatorShell
      title="מחשבון מחזור משכנתא"
      question="האם מחזור משכנתא יכול להשתלם לי?"
      intro="בדיקה ראשונית: ההחזר היום מול ההחזר בריבית אחרת, אחרי עלויות המחזור."
      inputs={<>
        <NumberField label="יתרת המשכנתא" suffix="₪" value={balance} onChange={setBalance} max={50_000_000} />
        <NumberField label="שנים שנותרו" suffix="שנים" value={yrs} onChange={setYrs} min={1} max={30} />
        <NumberField label="ריבית ממוצעת היום" suffix="%" value={cur} onChange={setCur} decimals max={15} />
        <NumberField label="ריבית חלופית משוערת" suffix="%" value={next} onChange={setNext} decimals max={15} />
        <NumberField label="עלויות מחזור ועמלות פירעון" suffix="₪" value={costs} onChange={setCosts} max={5_000_000} hint="אם לא ידוע, השאירו הערכה. דוח יתרות לסילוק מפרט את העמלות" />
      </>}
      result={r ? <>
        <BigResult label="תוצאה ראשונית" value={VERDICT_TEXT[r.verdict]} tone={r.verdict === "potential" ? "good" : undefined} />
        <ResultGrid items={[
          { label: "החזר חודשי משוער היום", value: nis(r.current) },
          { label: "החזר חודשי חלופי", value: nis(r.next) },
          { label: "הפרש חודשי", value: nis(r.monthlySaving), hint: r.monthlySaving > 0 ? "פחות בכל חודש" : "אין חיסכון חודשי" },
          { label: "הפרש לאורך כל התקופה", value: nis(r.lifetime), hint: "אחרי עלויות המחזור" },
          { label: "נקודת איזון", value: be ? `${be} חודשים` : "—", hint: be ? "הזמן לכסות את עלויות המחזור" : "לא מזוהה" },
          { label: "עלויות מחזור", value: nis(r.costs) },
        ]} />
      </> : <p className="text-muted-foreground">הזינו יתרה, תקופה ושתי ריביות כדי לראות את התוצאה.</p>}
      visual={r && <BeforeAfter rows={[
        { label: "החזר חודשי", before: r.current, after: r.next, fmt: nis },
        { label: "סך התשלומים עד הסוף", before: r.current * r.months, after: r.next * r.months + r.costs, fmt: nis },
      ]} />}
      explanation={r && <p>{EXPLAIN[r.verdict]} החישוב מניח ריבית ממוצעת אחת לכל היתרה ואותה תקופה, ולא כולל הצמדה למדד.</p>}
      cta={{ text: "לבדיקה מדויקת צריך את פירוט המסלולים והעמלות בפועל.", label: "העלו דוח יתרות לסילוק וקבלו בדיקה מדויקת יותר", href: "/balance-check", secondary: { label: "או בדיקת משכנתא מהירה בלי דוח", href: "/mortgage-check" } }}
      note="זהו חישוב אינדיקטיבי בלבד ואינו המלצה למחזר. עמלות פירעון, ריביות ותנאים בפועל נקבעים על ידי הבנק ומופיעים בדוח היתרות לסילוק."
    />
  );
}
