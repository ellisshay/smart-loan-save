import { Link } from "react-router-dom";
import { ArrowLeft, Home, TrendingDown, Wallet, PiggyBank, Activity, Layers, Coins, Scale, type LucideIcon } from "lucide-react";

/** Every calculator answers one question. Links use the canonical routes (no redirects). */
const groups: { title: string; items: { q: string; desc: string; href: string; icon: LucideIcon }[] }[] = [
  {
    title: "קונים דירה",
    items: [
      { q: "כמה משכנתא אני יכול לקחת?", desc: "טווח סביר מול גבול אפשרי, לפי ההכנסה וההון העצמי.", href: "/calculators/affordability", icon: Wallet },
      { q: "כמה תעלה לי משכנתא חדשה?", desc: "החזר חודשי, אחוז מימון ועלות כוללת משוערת.", href: "/mortgage-calculator", icon: Home },
      { q: "איך נראים תמהילים שונים?", desc: "שלושה תמהילים לדוגמה לפי ריביות השוק היום.", href: "/calculators/mix", icon: Layers },
    ],
  },
  {
    title: "כבר יש לי משכנתא",
    items: [
      { q: "האם מחזור יכול להשתלם לי?", desc: "ההחזר היום מול ריבית אחרת, אחרי עלויות המחזור.", href: "/refinance-calculator", icon: TrendingDown },
      { q: "האם אני משלם יותר מהשוק?", desc: "הריבית שלכם מול ממוצע השוק העדכני.", href: "/calculators/waste", icon: Scale },
      { q: "כמה אפשר לחסוך?", desc: "מחזור, תוספת להחזר או קיצור תקופה, זה לצד זה.", href: "/calculators/savings", icon: PiggyBank },
      { q: "מה יקרה אם אחזיר חלק מהמשכנתא?", desc: "הקטנת ההחזר מול קיצור התקופה.", href: "/calculators/early-repayment", icon: Coins },
      { q: "מה קורה אם הריבית משתנה?", desc: "סליידר מ-2%- עד 3%+ והשפעה מיידית על ההחזר.", href: "/calculators/rate-sensitivity", icon: Activity },
    ],
  },
];

export default function CalculatorsHub() {
  return (
    <section className="py-10 md:py-16 bg-background" dir="rtl">
      <div className="container max-w-4xl">
        <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground">מחשבוני משכנתא</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">שאלה אחת, תשובה מיידית. בלי הרשמה. כל התוצאות הן הערכה ולא הצעה של בנק.</p>
        <p className="text-foreground/90 leading-[1.9] mt-6 max-w-3xl">
          המחשבונים עוזרים לענות על שתי השאלות הנפוצות ביותר. מי שקונה דירה יכול להתחיל ב
          <Link to="/mortgage-calculator" className="text-primary underline underline-offset-4">מחשבון משכנתא לפי החזר חודשי</Link>
          , שמראה החזר משוער, סך ריבית ויחס החזר מההכנסה לפי סכום, ריבית ותקופה. מי שכבר משלם משכנתא יכול לבדוק ב
          <Link to="/refinance-calculator" className="text-primary underline underline-offset-4">מחשבון מחזור משכנתא</Link>
          {" "}אם ריבית אחרת מורידה את ההחזר אחרי עמלות ועלויות, ומתי מגיעה נקודת האיזון. שני הכלים פועלים כסימולטור ראשוני בלבד: הם מניחים ריבית ממוצעת אחת ואינם כוללים הצמדה למדד, ולכן ההצעה בפועל של הבנק תלויה בתמהיל ובנתוני התיק. אחרי הבדיקה כדאי להשוות הצעות אמיתיות.
        </p>
        {groups.map((g) => (
          <div key={g.title} className="mt-8">
            <h2 className="font-display text-lg font-bold text-foreground mb-3">{g.title}</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {g.items.map(({ q, desc, href, icon: Icon }) => (
                <li key={href}>
                  <Link to={href} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5 min-h-20 hover:border-primary transition-colors">
                    <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon size={20} aria-hidden /></span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-foreground">{q}</span>
                      <span className="block text-sm text-muted-foreground mt-0.5">{desc}</span>
                    </span>
                    <ArrowLeft size={18} className="text-muted-foreground group-hover:text-primary shrink-0" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
