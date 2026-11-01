import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Loader2 } from "lucide-react";
import ContactCard from "@/components/dashboard/ContactCard";
import { CASE_STATUSES, type CaseStatus } from "@/types/admin";
import { useMortgageModel } from "@/hooks/useMortgageModel";
import { firstMonthSplit, projectTracks } from "@/lib/mortgage/tracks";
import NextActionCard from "@/components/mortgage/NextActionCard";
import HealthGauge from "@/components/mortgage/HealthGauge";
import CaseProgress from "@/components/mortgage/CaseProgress";
import MortgageTimeline from "@/components/mortgage/MortgageTimeline";
import ScenarioSimulator from "@/components/mortgage/ScenarioSimulator";
import { BalanceChart, PaymentBreakdown, PrincipalInterest, TrackDonut } from "@/components/mortgage/charts";
import { EmptyState, EstimateNote, Kpi, Section, nis, pct, withCase, years } from "@/components/mortgage/primitives";

const SOURCE_TEXT = {
  current: "לפי המסלולים במשכנתא הנוכחית שלכם.",
  offer: "לפי ההצעה שבחרתם.",
  example: "תמהיל לדוגמה לפי ריביות שוק ממוצעות. זו לא הצעה של בנק, וההצעות בפועל יכולות להיות שונות.",
} as const;

/** Mortgage Command Center: where the mortgage stands, the main numbers, what to watch, what to do now. */
export default function DashboardHome() {
  const { model: m, caseId, loading, shared } = useMortgageModel();
  const [more, setMore] = useState(false);
  const projection = useMemo(() => (m && m.tracks.length ? projectTracks(m.tracks, m.cpi) : null), [m]);
  const split = useMemo(() => (m && m.tracks.length ? firstMonthSplit(m.tracks, m.cpi) : null), [m]);

  if (loading || !m) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="טוען" /></div>;

  const refi = m.caseType === "refi";
  const link = (href: string) => withCase(href, caseId);
  const dataHref = link(refi ? "/dashboard/mortgage" : "/dashboard/property");
  const statusLabel = CASE_STATUSES[shared.status as CaseStatus]?.label;
  const dtiTone = m.dti === null ? "default" : m.dti > 0.4 ? "warn" : m.dti <= 0.33 ? "good" : "default";

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl" dir="rtl">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">המשכנתא שלי</h1>
        <p className="text-sm text-muted-foreground mt-1">{refi ? "מחזור משכנתא" : "משכנתא חדשה"} · כל התמונה במקום אחד</p>
      </header>

      <NextActionCard next={m.next} caseId={caseId} statusLabel={statusLabel} />

      {/* Four critical numbers first; the rest behind "הצג עוד". */}
      <section aria-label="המספרים המרכזיים">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi label={refi ? "יתרת המשכנתא" : "סכום המשכנתא"} value={nis(m.loanAmount)} hint={m.loanAmount === null ? "חסר" : undefined} />
          <Kpi label="החזר חודשי" value={nis(m.monthlyPayment)} estimate={m.monthlyPayment !== null && m.paymentIsEstimate} hint={m.monthlyPayment === null ? "חסר" : undefined} />
          <Kpi label="החזר מתוך ההכנסה" value={pct(m.dti)} tone={dtiTone} hint={m.dti === null ? "חסרה הכנסה" : m.dti > 0.4 ? "גבוה יחסית" : undefined} estimate={m.dti !== null && m.paymentIsEstimate} />
          <Kpi label="אחוז מימון" value={pct(m.ltv)} hint={m.ltv === null ? "חסר שווי נכס" : "מתוך שווי הנכס"} />
        </div>
        <button type="button" onClick={() => setMore((v) => !v)} aria-expanded={more}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary min-h-11">
          {more ? "הסתר" : "הצג עוד"} <ChevronDown size={16} className={more ? "rotate-180 transition-transform" : "transition-transform"} />
        </button>
        {more && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-1">
            <Kpi label="שווי הנכס" value={nis(m.propertyValue)} />
            <Kpi label="הון עצמי" value={nis(m.equity)} hint={refi && m.equity !== null ? "שווי פחות יתרה" : undefined} />
            <Kpi label="הכנסה חודשית נטו" value={nis(m.income)} hint="של כל הלווים" />
            <Kpi label="התחייבויות חודשיות אחרות" value={nis(m.obligations)} />
            <Kpi label="החזר מומלץ עד" value={nis(m.recommendedMaxPayment)} hint="כשליש מההכנסה, פחות התחייבויות" />
            <Kpi label="ההחזר המקסימלי שציינתם" value={nis(m.clientMaxPayment)} />
            <Kpi label={refi ? "תקופה שנותרה" : "תקופת המשכנתא"} value={years(m.termMonths)} hint={m.termIsAssumption ? "לפי תמהיל לדוגמה" : undefined} />
            <Kpi label="הצעות מבנקים" value={String(m.offersCount)} />
          </div>
        )}
      </section>

      <Section title="מדד מצב המשכנתא" subtitle="תמונת מצב על סמך הנתונים שמסרתם">
        <HealthGauge health={m.health} missingHref={dataHref} />
      </Section>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <Section title="ממה המשכנתא מורכבת" subtitle={m.trackSource ? SOURCE_TEXT[m.trackSource] : undefined}>
          {m.trackSummary
            ? <TrackDonut summary={m.trackSummary} />
            : <EmptyState text={refi ? "השלימו את פרטי המסלולים כדי לראות את הגרף." : "השלימו את סכום המשכנתא כדי לראות את הגרף."} cta="להשלמת הפרטים" href={dataHref} />}
        </Section>

        <Section title="לאן הולך ההחזר החודשי" subtitle="החודש הראשון, לפי המסלולים">
          {split && (split.principal + split.interest) > 0
            ? <><PaymentBreakdown principal={split.principal} interest={split.interest} cpi={split.index} /><EstimateNote>הערכה. {m.cpi ? `השפעת המדד מחושבת לפי הנחת אינפלציה שנתית של ${m.cpi}% במסלולים צמודים.` : ""}</EstimateNote></>
            : <EmptyState text="השלימו את פרטי המשכנתא כדי לראות את פירוט ההחזר." cta="להשלמת הפרטים" href={dataHref} />}
        </Section>
      </div>

      <Section title="יתרת המשכנתא לאורך השנים" subtitle="תחזית משוערת אם ממשיכים לשלם כרגיל">
        {projection && projection.points.length > 1 ? (
          <>
            <BalanceChart points={projection.points} />
            <div className="mt-5"><PrincipalInterest principal={projection.totalPrincipal} interest={projection.totalInterest} /></div>
            <EstimateNote>
              התחזית מניחה שהריביות הנוכחיות נשארות קבועות{m.cpi ? ` ואינפלציה של ${m.cpi}% בשנה במסלולים צמודים` : ""}. בפועל ריבית משתנה ומדד יכולים לשנות את התוצאה.
              {m.trackSource === "example" && " החישוב מבוסס על תמהיל לדוגמה."}
            </EstimateNote>
          </>
        ) : <EmptyState text="השלימו את פרטי המשכנתא כדי לראות את הגרף." cta="להשלמת הפרטים" href={dataHref} />}
      </Section>

      <Section title="ציר הזמן של המשכנתא">
        {m.termMonths
          ? <MortgageTimeline tracks={m.tracks} termMonths={m.termMonths} rateChangeDate={m.rateChangeDate} />
          : <EmptyState text="השלימו את תקופת המשכנתא כדי לראות את ציר הזמן." cta="להשלמת הפרטים" href={dataHref} />}
      </Section>

      <Section title="מה קורה אם…?" subtitle="בחרו שאלה וראו מיד את ההשפעה">
        {m.tracks.length
          ? <>{m.trackSource === "example" && <p className="text-sm text-muted-foreground mb-3">החישוב מבוסס על תמהיל לדוגמה עד שתתקבל הצעה מהבנק.</p>}<ScenarioSimulator tracks={m.tracks} cpi={m.cpi} /></>
          : <EmptyState text="השלימו את פרטי המשכנתא כדי להשתמש בסימולטור." cta="להשלמת הפרטים" href={dataHref} />}
      </Section>

      <Section title="התקדמות התיק" action={<Link to={link("/dashboard/status")} className="text-sm font-semibold text-primary min-h-11 inline-flex items-center">לכל השלבים</Link>}>
        <CaseProgress steps={m.progress} compact />
      </Section>

      <ContactCard />
    </div>
  );
}
