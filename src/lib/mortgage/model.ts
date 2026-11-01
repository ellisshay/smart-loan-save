// Builds the read-only "Mortgage Command Center" model from data that already exists.
// Pure function: no fetching, no fabricated values. Missing data stays null.
import { completedIntakeSteps } from "@/lib/intakeCompletion";
import { levelOf, isDocSettled } from "@/lib/docValidation";
import { REQUIRED_DOCS_NEW, REQUIRED_DOCS_REFI, NEW_CASE_STEPS, REFI_CASE_STEPS } from "@/types/intake";
import { buildMixes, type Rates } from "@/lib/quickCheck";
import { num, pmt } from "./amortization";
import { fromCaseTrackRows, fromIntakeTracks, fromMixTracks, fromOfferTracks, summarizeTracks, type NormalizedTrack, type TrackSummary } from "./tracks";
import { healthScore, type HealthResult } from "./health";
import { caseProgress, type ProgressStep } from "./caseProgress";
import { nextAction, type NextAction } from "./nextAction";
import { REASONABLE_RATIO } from "./affordability";

export interface RawCaseData {
  caseType: "new" | "refi";
  intakeData: Record<string, any>;
  intakeComplete: boolean;
  status: string;
  paymentSucceeded: boolean;
  caseTrackRows?: any[] | null;
  rates?: (Rates & { updated_at?: string | null }) | null;
  tender?: any | null;                 // get_client_tender payload
  documents?: { doc_type: string; ai_extracted_data: any }[] | null;
  slaDueAt?: string | null;
}

export type TrackSource = "current" | "offer" | "example" | null;
export type DocState = "missing" | "received" | "review" | "ok" | "update";

export const DOC_STATE_LABEL: Record<DocState, string> = {
  missing: "חסר", received: "התקבל", review: "בבדיקה", ok: "תקין", update: "נדרש עדכון",
};

export interface DocRow { type: string; label: string; required: boolean; state: DocState; deferred: boolean }

export interface MortgageModel {
  caseType: "new" | "refi";
  propertyValue: number | null;
  equity: number | null;
  loanAmount: number | null;           // requested (new) or outstanding balance (refi)
  income: number | null;               // monthly net household income
  obligations: number;                 // other monthly obligations
  monthlyPayment: number | null;
  paymentIsEstimate: boolean;
  recommendedMaxPayment: number | null;
  clientMaxPayment: number | null;
  dti: number | null;
  ltv: number | null;
  termMonths: number | null;
  termIsAssumption: boolean;
  offersCount: number;
  tracks: NormalizedTrack[];
  trackSource: TrackSource;
  trackSummary: TrackSummary | null;
  cpi: number;
  ratesUpdatedAt: string | null;
  health: HealthResult | null;
  progress: ProgressStep[];
  next: NextAction;
  docs: DocRow[];
  missingDocs: number;
  docsNeedUpdate: number;
  rateChangeDate: string | null;
  offers: { id: string; bank: string; tracks: any[]; first_payment?: number; total_amount?: number; extra_costs?: number; kind?: string; valid_until?: string; advisor_explanation?: string }[];
}

const STEP_HREF: Record<string, string> = {
  personal: "/dashboard/personal", property: "/dashboard/property", refi_property: "/dashboard/property",
  income: "/dashboard/income", liabilities: "/dashboard/liabilities", mortgage_request: "/dashboard/mortgage",
  current_mortgage: "/dashboard/mortgage", declarations: "/dashboard/declarations", documents: "/dashboard/documents",
};

const positiveOrNull = (v: unknown) => (num(v) > 0 ? num(v) : null);

/** Latest client-visible offer per bank from the tender payload. */
export function latestOffers(tender: any): MortgageModel["offers"] {
  const banks: any[] = Array.isArray(tender?.banks) ? tender.banks : [];
  return banks.flatMap((b) => {
    const offers: any[] = Array.isArray(b?.offers) ? b.offers : [];
    if (!offers.length) return [];
    const latest = [...offers].sort((a, c) => num(c.version) - num(a.version))[0];
    return [{ ...latest, bank: b.bank_name || `בנק ${b.slot ?? ""}`.trim() }];
  });
}

export function documentRows(caseType: "new" | "refi", intake: Record<string, any>, documents: RawCaseData["documents"]): DocRow[] {
  const list = caseType === "refi" ? REQUIRED_DOCS_REFI : REQUIRED_DOCS_NEW;
  const deferred: string[] = Array.isArray(intake?.deferred_docs) ? intake.deferred_docs : [];
  const docs = documents || [];
  return list.map((d) => {
    const uploaded = docs.filter((x) => x.doc_type === d.type);
    let state: DocState = "missing";
    if (uploaded.length) {
      const levels = uploaded.map((u) => levelOf(u.ai_extracted_data));
      state = levels.includes("green") ? "ok"
        : levels.includes("yellow") ? "review"
        : levels.length && levels.every((l) => l === "red") ? "update"
        : "received";
    }
    return { type: d.type, label: d.label, required: d.required, state, deferred: state === "missing" && deferred.includes(d.type) };
  });
}

export function buildMortgageModel(raw: RawCaseData): MortgageModel {
  const d = raw.intakeData || {};
  const refi = raw.caseType === "refi";
  const cpi = num(raw.rates?.cpi_annual);

  // Income: both borrowers' net income plus reported additional income.
  const inc = d.income || {};
  const incomeSum = ["monthlyNetIncome", "b2MonthlyNetIncome", "rentalIncome", "benefitsIncome", "alimonyIncome", "investmentIncome", "otherIncome", "b2AdditionalIncomeAmount"]
    .reduce((s, k) => s + num(inc[k]), 0);
  const income = incomeSum > 0 ? incomeSum : null;
  const liab = d.liabilities || {};
  const obligations = num(liab.existingLoanPayments) + num(liab.creditCardMonthly) + num(liab.alimonyPaid);

  const offers = latestOffers(raw.tender);
  const selectedId = raw.tender?.selected_offer_id || null;
  const selectedOffer = selectedId ? offers.find((o) => o.id === selectedId) : null;

  let propertyValue: number | null, loanAmount: number | null, equity: number | null;
  let termMonths: number | null = null, termIsAssumption = false;
  let tracks: NormalizedTrack[] = [], trackSource: TrackSource = null;
  let monthlyPayment: number | null = null, paymentIsEstimate = true;

  if (refi) {
    const cm = d.current_mortgage || {};
    propertyValue = positiveOrNull(d.refi_property?.estimatedValue);
    tracks = fromCaseTrackRows(raw.caseTrackRows);
    if (!tracks.length) tracks = fromIntakeTracks(cm.tracks);
    if (tracks.length) trackSource = "current";
    const trackTotal = tracks.reduce((s, t) => s + t.amount, 0);
    loanAmount = positiveOrNull(cm.totalBalance) ?? (trackTotal || null);
    equity = propertyValue && loanAmount ? Math.max(propertyValue - loanAmount, 0) : null;
    termMonths = positiveOrNull(cm.remainingYears) ? Math.round(num(cm.remainingYears) * 12) : null;
    if (positiveOrNull(cm.currentMonthlyPayment)) { monthlyPayment = num(cm.currentMonthlyPayment); paymentIsEstimate = false; }
  } else {
    const p = d.property || {};
    propertyValue = positiveOrNull(p.appraisalValue) ?? positiveOrNull(p.purchasePrice);
    equity = positiveOrNull(d.equity?.amount) ?? positiveOrNull(p.ownEquity);
    loanAmount = positiveOrNull(d.mortgage_request?.requestedAmount) ?? positiveOrNull(p.requestedMortgage)
      ?? (propertyValue && equity && propertyValue > equity ? propertyValue - equity : null);
    if (positiveOrNull(d.mortgage_request?.desiredYears)) termMonths = Math.round(num(d.mortgage_request.desiredYears) * 12);
    const chosen = selectedOffer || null;
    if (chosen) { tracks = fromOfferTracks(chosen.tracks); trackSource = tracks.length ? "offer" : null; }
    if (!tracks.length && d.quick_check?.mixes?.length) {
      // Example mix from the quick check (clearly labeled as an example in the UI).
      const mixes = d.quick_check.mixes;
      const mix = mixes[Math.floor(mixes.length / 2)] || mixes[0];
      tracks = fromMixTracks(mix?.tracks, cpi); trackSource = tracks.length ? "example" : null;
    }
    if (!tracks.length && loanAmount && raw.rates) {
      const mixes = buildMixes(loanAmount, termMonths ? termMonths / 12 : 25, raw.rates);
      const balanced = mixes.find((m) => m.risk === "בינוני") || mixes[0];
      if (balanced) { tracks = fromMixTracks(balanced.tracks, cpi); trackSource = tracks.length ? "example" : null; }
    }
    if (!termMonths && tracks.length) { termMonths = Math.max(...tracks.map((t) => t.months)); termIsAssumption = trackSource === "example"; }
  }

  const trackSummary = summarizeTracks(tracks, cpi);
  if (monthlyPayment === null) {
    if (trackSummary) { monthlyPayment = trackSummary.monthly; paymentIsEstimate = trackSource !== "offer" || !selectedOffer?.first_payment; }
    else if (loanAmount && termMonths && raw.rates) { monthlyPayment = pmt(loanAmount, num(raw.rates.fixed_not_linked), termMonths); }
  }
  if (selectedOffer?.first_payment) { monthlyPayment = num(selectedOffer.first_payment); paymentIsEstimate = false; }

  const dti = income && monthlyPayment ? (monthlyPayment + obligations) / income : null;
  const ltv = propertyValue && loanAmount ? loanAmount / propertyValue : null;
  const recommendedMaxPayment = income ? Math.max(0, Math.round(income * REASONABLE_RATIO.high - obligations)) : null;
  const clientMaxPayment = positiveOrNull(liab.maxDesiredPayment) ?? positiveOrNull(d.mortgage_request?.maxPayment);

  // Refinance: compare the weighted rate to a market reference built from today's rates with the same track mix.
  let rateGap: number | null = null;
  if (refi && trackSummary && raw.rates) {
    const ref = (k: string) => k === "prime" ? num(raw.rates!.prime)
      : k === "fixed_linked" ? num(raw.rates!.fixed_linked)
      : k === "fixed_unlinked" ? num(raw.rates!.fixed_not_linked)
      : k.startsWith("variable") ? num(raw.rates!.variable_5) : 0;
    const comparable = tracks.filter((t) => ref(t.kind) > 0);
    const tot = comparable.reduce((s, t) => s + t.amount, 0);
    if (tot > 0) rateGap = comparable.reduce((s, t) => s + (t.rate - ref(t.kind)) * t.amount, 0) / tot;
  }

  const health = healthScore({
    dti, ltv,
    variableShare: trackSource && trackSource !== "example" ? trackSummary?.variableShare : null,
    linkedShare: trackSource && trackSource !== "example" ? trackSummary?.linkedShare : null,
    kinds: trackSource && trackSource !== "example" ? trackSummary?.kinds : null,
    remainingYears: termMonths && !termIsAssumption ? termMonths / 12 : null,
    rateGap,
  });

  const docs = documentRows(raw.caseType, d, raw.documents);
  const missingDocs = docs.filter((x) => x.required && x.state === "missing" && !x.deferred).length;
  const docsNeedUpdate = docs.filter((x) => x.state === "update").length;
  const settled = (raw.documents || []).filter((x) => isDocSettled(x.ai_extracted_data)).map((x) => x.doc_type);
  const completed = completedIntakeSteps(d, raw.caseType, settled);
  const steps = (refi ? REFI_CASE_STEPS : NEW_CASE_STEPS).filter((s) => !["summary", "documents"].includes(s.key));
  const firstMissing = steps.find((s) => !completed.includes(s.key));
  const intakeStarted = Object.keys(d).some((k) => ["personal", "property", "refi_goal", "current_mortgage", "income"].includes(k));
  const offersCount = offers.length;

  const common = { status: raw.status, intakeComplete: raw.intakeComplete, paymentSucceeded: raw.paymentSucceeded, missingDocs, docsNeedUpdate, tenderStage: raw.tender?.stage ?? null, offersCount, selectedOffer: !!selectedId };
  return {
    caseType: raw.caseType, propertyValue, equity, loanAmount, income, obligations,
    monthlyPayment, paymentIsEstimate, recommendedMaxPayment, clientMaxPayment, dti, ltv,
    termMonths, termIsAssumption, offersCount, tracks, trackSource, trackSummary, cpi,
    ratesUpdatedAt: raw.rates?.updated_at ?? null,
    health,
    progress: caseProgress({ ...common, intakeStarted }),
    next: nextAction({ ...common, caseType: raw.caseType, firstMissingStep: firstMissing ? { label: firstMissing.title, href: STEP_HREF[firstMissing.key] || "/intake" } : null, slaDueAt: raw.slaDueAt }),
    docs, missingDocs, docsNeedUpdate,
    rateChangeDate: refi ? (d.current_mortgage?.rateChangeDate || null) : null,
    offers,
  };
}
