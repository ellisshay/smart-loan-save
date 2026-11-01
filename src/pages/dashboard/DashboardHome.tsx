import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Loader2 } from "lucide-react";
import ContactCard from "@/components/dashboard/ContactCard";
import { CASE_STATUSES, type CaseStatus } from "@/types/admin";
import { useMortgageModel } from "@/hooks/useMortgageModel";
import { firstMonthSplit, projectTracks } from "@/lib/mortgage/tracks";
import { dtiBand } from "@/lib/mortgage/affordability";
import NextActionCard from "@/components/mortgage/NextActionCard";
import HealthGauge from "@/components/mortgage/HealthGauge";
import CaseProgress from "@/components/mortgage/CaseProgress";
import MortgageTimeline from "@/components/mortgage/MortgageTimeline";
import ScenarioSimulator from "@/components/mortgage/ScenarioSimulator";
import { BalanceChart, CostBreakdown, PaymentBreakdown, TrackDonut } from "@/components/mortgage/charts";
import { EmptyState, EstimateNote, Kpi, Section, nis, pct, withCase, years } from "@/components/mortgage/primitives";

const SOURCE_TEXT = {
  current: "לפי המסלולים במשכנתא הנוכחית שלכם.",
  offer: "לפי ההצעה שבחרתם.",
  example: "זה לא המבנה של המשכנתא שלכם. זה תמהיל לדוגמה לפי ריביות שוק ממוצעות, עד שתתקבל הצעה מהבנק.",
} as const;

/** How CPI is modelled, in plain Hebrew. Shown wherever linked tracks affect a number. */
const cpiNote = (cpi: number) =>
  `במסלולים הצמודים הקרן מתעדכנת כל חודש לפי הנחת מדד שנתית קבועה של ${cpi}%, והריבית מחושבת על הקרן המעודכנת. ההצמדה מוצגת בנפרד מהריבית, והסכומים נומינליים. המדד בפועל יהיה שונה.`;

/** Mortgage Command Center: where the mortgage stands, the main numbers, what to watch, what to do now. */
export default function DashboardHome() {
  const { model: m, caseId, loading, shared } = useMortgageModel();
  const [more, setMore] = useState(false);
  const projection = useMemo(() => (m && m.tracks.length ? projectTracks(m.tracks, m.cpi) : null), [m]);
  const split = useMemo(() => (m && m.tracks.length ? firstMonthSplit(m.tracks, m.cpi) : null), [m]);

  if (loading || !m) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="טוען" /></div>;

  const refi = m.caseType === "refi";
  const example = m.trackSource === "example";
  const pendingChoice = !m.tracks.length && !!m.offerPaymentRange;
  const link = (href: string) => withCase(href, caseId);
  const dataHref = link(refi ? "/dashboard/mortgage" : "/dashboard/property");
  const tenderHref = link("/dashboard/tender");
  const statusLabel = CASE_STATUSES[shared.status as CaseStatus]?.label;
  const band = dtiBand(m.dti);
  const linkedNote = m.hasLinkedTracks && m.cpi > 0 ? ` ${cpiNote(m.cpi)}` : "";

  // Monthly payment and ratio: a single value, or a range across real offers when none is chosen yet.
  const payValue = m.offerPaymentRange && m.monthlyPayment === null
    ? `${nis(m.offerPaymentRange.min)}–${nis(m.offerPaymentRange.max)}` : nis(m.monthlyPayment);
  const payHint = m.offerPaymentRange && m.monthlyPayment === null ? "טווח ההחזר בהצעות שהתקבלו"
    : m.monthlyPayment === null ? "חסר" : example ? "לפי תמהיל לדוגמה" : undefined;
  const dtiValue = m.dtiRange && m.dti === null ? `${pct(m.dtiRange.min)}–${pct(m.dtiRange.max)}` : pct(m.dti);
  const dtiHint = m.dti === null && !m.dtiRange ? (m.income ? "חסר החזר חודשי" : "חסרה הכנסה") : m.dtiRange && m.dti === null ? "לפי ההצעות" : band?.short;

  const noTracksState = pendingChoice
    ? <EmptyState text={`התקבלו ${m.offersCount} הצעות. אחרי שתבחרו הצעה נציג כאן את המבנה שלה.`} cta="להשוואת ההצעות" href={tenderHref} />
    : <EmptyState text={refi ? "השלימו את פרטי המסלולים כדי לראות את הגרף." : "השלימו את סכום המשכנתא כדי לראות את הגרף."} cta="להשלמת הפרטים" href={dataHref} />;

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
          <Kpi label={refi ? "יתרת המשכנתא" : "סכום המשכנתא"} value={nis(m.loanAmount)} hint={m.loanAmount === null ? "חסר" : refi ? undefined : "הסכום המבוקש"} />
          <Kpi label="החזר חודשי" value={payValue} estimate={m.monthlyPayment !== null && m.paymentIsEstimate} hint={payHint} />
          <Kpi label="החזר מתוך ההכנסה" value={dtiValue} tone={band?.tone ?? "default"} hint={dtiHint} estimate={m.dti !== null && m.paymentIsEstimate} />
          <Kpi label="אחוז מימון" value={pct(m.ltv)} hint={m.ltv === null ? (m.propertyValue ? "חסר סכום משכנתא" : "חסר שווי נכס") : "מתוך שווי הנכס"} />
        </div>
        {band && band.key !== "comfortable" && <p className="text-sm text-muted-foreground mt-2">{band.text}</p>}
        <button type="button" onClick={() => setMore((v) => !v)} aria-expanded={more}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary min-h-11">
          {more ? "הסתר" : "הצג עוד"} <ChevronDown size={16} className={more ? "rotate-180 transition-transform" : "transition-transform"} />
        </button>
        {more && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-1">
            <Kpi label="שווי הנכס" value={nis(m.propertyValue)} />
            <Kpi label="הון עצמי" value={nis(m.equity)} hint={refi && m.equity !== null ? "שווי פחות יתרה" : undefined} />
            <Kpi label="הכנסה חודשית נטו" value={nis(m.income)} hint="של כל הלווים" />
            <Kpi label="התחייבויות חודשיות אחרות" value={m.obligationsKnown ? nis(m.obligations) : "—"} hint={m.obligationsKnown ? undefined : "חסר"} />
            <Kpi label="החזר נוח עד" value={nis(m.recommendedMaxPayment)} hint="כשליש מההכנסה, פחות התחייבויות" />
            <Kpi label="ההחזר המקסימלי שציינתם" value={nis(m.clientMaxPayment)} />
            <Kpi label={refi ? "תקופה שנותרה" : "תקופת המשכנתא"} value={years(m.termMonths)} hint={m.termIsAssumption ? "לפי תמהיל לדוגמה" : undefined} />
            <Kpi label="הצעות מבנקים" value={String(m.offersCount)} />
          </div>
        )}
      </section>

      <Section title="מדד מצב המשכנתא" subtitle="תמונת מצב על סמך הנתונים שמסרתם">
        <HealthGauge health={m.health}
          missingHref={pendingChoice ? tenderHref : dataHref}
          emptyText={pendingChoice ? "המדד יוצג אחרי שתבחרו הצעה, כי הוא מתבסס על ההחזר ועל מבנה המשכנתא בפועל." : undefined}
          emptyCta={pendingChoice ? "להשוואת ההצעות" : undefined}
          estimateNote={example && m.dti !== null ? "יחס ההחזר להכנסה מבוסס על החזר משוער לפי תמהיל לדוגמה." : undefined} />
      </Section>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <Section title={example ? "תמהיל לדוגמה" : "ממה המשכנתא מורכבת"} subtitle={m.trackSource ? SOURCE_TEXT[m.trackSource] : undefined}
          action={example ? <span className="text-[11px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground shrink-0">דוגמה</span> : undefined}>
          {m.trackSummary ? <TrackDonut summary={m.trackSummary} /> : noTracksState}
        </Section>

        <Section title="לאן הולך ההחזר החודשי" subtitle={example ? "בתמהיל לדוגמה, החודש הראשון" : "החודש הראשון, לפי המסלולים"}>
          {split && (split.principal + split.interest) > 0
            ? <><PaymentBreakdown principal={split.principal} interest={split.interest} index={split.index} />
                <EstimateNote>
                  {example ? "הערכה לפי התמהיל לדוגמה, לא לפי המשכנתא שלכם." : "הערכה לפי המסלולים שהוזנו."}{m.hasLinkedTracks && m.cpi > 0 ? " בחודש הראשון ההצמדה מוסיפה מעט להחזר, והתוספת גדלה עם השנים כי הקרן מתעדכנת לפי המדד." : ""}
                  {!m.paymentIsEstimate && m.monthlyPayment && Math.abs(split.principal + split.interest + split.index - m.monthlyPayment) / m.monthlyPayment > 0.02
                    ? ` ההחזר שדיווחתם (${nis(m.monthlyPayment)}) שונה מהחישוב, למשל בגלל הצמדה שכבר נצברה או נתוני מסלולים חלקיים. דוח יתרות לסילוק ייתן תמונה מדויקת.` : ""}
                </EstimateNote></>
            : noTracksState}
        </Section>
      </div>

      <Section title={example ? "תחזית לתמהיל לדוגמה" : "יתרת המשכנתא לאורך השנים"} subtitle="תחזית משוערת אם ממשיכים לשלם כרגיל">
        {projection && projection.points.length > 1 ? (
          <>
            <BalanceChart points={projection.points} />
            <div className="mt-5">
              <p className="text-sm font-semibold mb-2">כמה המשכנתא תעלה לאורך כל התקופה</p>
              <CostBreakdown principal={projection.totalPrincipal} interest={projection.totalInterest} indexation={projection.totalIndexation} />
            </div>
            <EstimateNote>
              התחזית מניחה שהריביות הנוכחיות נשארות קבועות.{linkedNote}
              {example && " החישוב מבוסס על תמהיל לדוגמה, לא על המשכנתא שלכם."}
            </EstimateNote>
          </>
        ) : noTracksState}
      </Section>

      <Section title="ציר הזמן של המשכנתא">
        {m.termMonths && !example
          ? <MortgageTimeline tracks={m.tracks} termMonths={m.termMonths} rateChangeDate={m.rateChangeDate} />
          : <EmptyState text={example || pendingChoice ? "ציר הזמן יוצג אחרי שתבחרו הצעה מהבנק." : "השלימו את תקופת המשכנתא כדי לראות את ציר הזמן."}
              cta={pendingChoice ? "להשוואת ההצעות" : example ? undefined : "להשלמת הפרטים"} href={pendingChoice ? tenderHref : dataHref} />}
      </Section>

      <Section title="מה קורה אם…?" subtitle="בחרו שאלה וראו מיד את ההשפעה">
        {m.tracks.length
          ? <>{example && <p className="text-sm text-muted-foreground mb-3">החישוב מבוסס על תמהיל לדוגמה עד שתתקבל הצעה מהבנק.</p>}<ScenarioSimulator tracks={m.tracks} cpi={m.cpi} /></>
          : noTracksState}
      </Section>

      <Section title="התקדמות התיק" action={<Link to={link("/dashboard/status")} className="text-sm font-semibold text-primary min-h-11 inline-flex items-center">לכל השלבים</Link>}>
        <CaseProgress steps={m.progress} compact />
      </Section>

      <ContactCard />
    </div>
  );
}
