// Explicit allow-lists for every payload that leaves EasyMorte for an AI provider.
// Rule: build new objects field by field. Never spread intake_data, profiles or document extractions.
// Never include: names, ID numbers, birth dates, phone, email, address, signatures, declarations text,
// raw documents, values extracted from documents, or rows that belong to other customers.
// Pure TypeScript (no Deno/npm imports) so it is unit-tested by vitest.

// deno-lint-ignore no-explicit-any
type Loose = any;

const n = (v: unknown): number | null => {
  const x = typeof v === "string" ? Number(v.replace(/,/g, "")) : Number(v);
  return Number.isFinite(x) ? x : null;
};
const s = (v: unknown, allowed: readonly string[]): string | null =>
  typeof v === "string" && allowed.includes(v) ? v : null;
const yn = (v: unknown): boolean | null => (v === "yes" ? true : v === "no" ? false : null);

const EMPLOYMENT = ["salaried", "self_employed", "company_owner", "pensioner", "unemployed"] as const;
const GOALS = ["lower_payment", "total_savings", "stability", "shorter_term", "combined"] as const;
const RISK = ["low", "medium", "high"] as const;
const TX = ["second_hand", "new_build", "land_build", "land", "investment"] as const;
const HORIZON = ["under_5", "5_to_10", "over_10", "unknown"] as const;

function borrower(inc: Loose, second: boolean) {
  const p = second ? "b2" : "";
  const k = (name: string) => (second ? `${p}${name[0].toUpperCase()}${name.slice(1)}` : name);
  const additional = second
    ? n(inc.b2AdditionalIncomeAmount)
    : [inc.rentalIncome, inc.benefitsIncome, inc.alimonyIncome, inc.investmentIncome, inc.otherIncome]
        .map(n).filter((x): x is number => x !== null).reduce((a, b) => a + b, 0) || null;
  return {
    employment: s(inc[k("employmentStatus")], EMPLOYMENT),
    seniority_years: n(inc[k("workSeniority")]),
    contract: s(inc[k("contractType")], ["permanent", "temporary"]),
    net_income: n(inc[k("monthlyNetIncome")]),
    avg_net_3m: n(inc[k("averageNet3Months")]),
    additional_income: additional,
  };
}

/** Payload for generate-financial-score. Numbers and enumerations only. */
export function financialScorePayload(input: {
  caseType: unknown; goal: unknown; intake: Loose; tracks: Loose[]; docs: Loose[];
}) {
  const i = input.intake && typeof input.intake === "object" ? input.intake : {};
  const inc = i.income ?? {};
  const liab = i.liabilities ?? {};
  const prop = i.property ?? {};
  const req = i.mortgage_request ?? {};
  const cm = i.current_mortgage ?? {};
  const rp = i.refi_property ?? {};
  const dec = i.declarations ?? {};
  const pref = i.preferences ?? i.refi_preferences ?? {};
  const two = i.personal?.borrowerCount === "2";
  const tracks = Array.isArray(input.tracks) && input.tracks.length ? input.tracks : (Array.isArray(cm.tracks) ? cm.tracks : []);
  return {
    case_type: s(input.caseType, ["new", "refi"]),
    goal: s(input.goal, GOALS),
    borrower_count: two ? 2 : 1,
    dependents: n(i.personal?.borrower1?.dependents),
    borrowers: two ? [borrower(inc, false), borrower(inc, true)] : [borrower(inc, false)],
    obligations: {
      loans_monthly: n(liab.existingLoanPayments),
      credit_cards_monthly: n(liab.creditCardMonthly),
      alimony_paid: n(liab.alimonyPaid),
      used_credit_frames: n(liab.usedCreditFrames),
      max_desired_payment: n(liab.maxDesiredPayment),
    },
    property: {
      transaction_type: s(prop.transactionType, TX),
      area: s(prop.areaType, ["center", "periphery"]),
      price: n(prop.purchasePrice),
      appraisal: n(prop.appraisalValue),
      equity: n(i.equity?.amount ?? prop.ownEquity),
    },
    request: {
      amount: n(req.requestedAmount ?? prop.requestedMortgage),
      years: n(req.desiredYears),
      max_payment: n(req.maxPayment),
    },
    refi: input.caseType === "refi" ? {
      balance: n(cm.totalBalance),
      monthly: n(cm.currentMonthlyPayment),
      remaining_years: n(cm.remainingYears),
      property_value: n(rp.estimatedValue),
      wants_increase: yn(i.refi_goal?.wantsIncrease),
      increase_amount: n(i.refi_goal?.increaseAmount),
    } : null,
    tracks: tracks.slice(0, 12).map((t: Loose) => ({
      type: typeof (t.track_type ?? t.trackType) === "string" ? String(t.track_type ?? t.trackType).slice(0, 40) : null,
      balance: n(t.principal_balance ?? t.principalBalance),
      rate: n(t.interest_rate ?? t.interestRate),
      indexed: typeof t.is_indexed === "boolean" ? t.is_indexed : yn(t.isIndexed),
      remaining_years: n(t.remaining_years ?? t.remainingYears),
    })),
    preferences: {
      risk: s(pref.riskLevel ?? liab.riskLevel, RISK),
      stability_priority: n(pref.stabilityPriority),
      horizon: s(pref.holdingHorizon, HORIZON),
    },
    // Flags only, never the declaration text.
    flags: {
      delinquent_debt: yn(liab.hasDelinquentDebt),
      legal_proceedings: yn(liab.hasLegalProceedings ?? dec.hasLegalProceedings),
      execution_file: yn(dec.hasExecutionFile),
      bankruptcy: yn(dec.hasBankruptcy),
      restricted_account: yn(dec.hasRestrictedAccount),
      bounced_checks: yn(dec.hasBouncedChecks),
    },
    // Document status only, never extracted values.
    documents: (Array.isArray(input.docs) ? input.docs : []).slice(0, 30).map((d: Loose) => ({
      type: typeof d.doc_type === "string" ? d.doc_type.slice(0, 40) : null,
      level: s(d.ai_extracted_data?.level, ["green", "yellow", "red"]),
    })),
  };
}

/** Aggregate statistics of the anonymous pool. Never individual rows. */
export function poolAggregate(rows: Loose[]) {
  const pool = Array.isArray(rows) ? rows : [];
  const avg = (k: string) => {
    const v = pool.map((r) => n(r?.[k])).filter((x): x is number => x !== null && x > 0);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
  };
  return {
    count: pool.length,
    avg_loan: avg("loan_amount"),
    avg_property_value: avg("property_value"),
    avg_ltv: avg("ltv"),
    avg_dti: avg("dti"),
  };
}

/** Declared values for document cross-checking. Name and employment figures only. No ID number, no birth date. */
export function documentCheckDeclared(intake: Loose, docType: string) {
  const i = intake && typeof intake === "object" ? intake : {};
  const second = /_b2$/.test(docType);
  const b = second ? i.personal?.borrower2 : i.personal?.borrower1;
  const inc = i.income ?? {};
  const name = [b?.firstName, b?.lastName].filter((x) => typeof x === "string").join(" ").trim().slice(0, 80) || null;
  return {
    borrower: second ? 2 : 1,
    name,
    employer: typeof (second ? inc.b2Employer : inc.employer) === "string"
      ? String(second ? inc.b2Employer : inc.employer).slice(0, 80) : null,
    gross_salary: n(second ? inc.b2GrossSalary : inc.grossSalary),
    net_income: n(second ? inc.b2MonthlyNetIncome : inc.monthlyNetIncome),
    loans_monthly: n(i.liabilities?.existingLoanPayments),
  };
}

/** Document types that are never sent to an AI provider (identity documents). */
export const NO_AI_DOC_TYPES = ["id_card", "id_card_b2"] as const;

/** Make.com notification: an internal alert only. No customer data. */
export function makeIntakePayload(c: { id: string; case_number?: unknown; case_type?: unknown; status?: unknown }, adminBaseUrl: string) {
  return {
    event: "intake_complete",
    timestamp: new Date().toISOString(),
    case_id: c.id,
    case_number: typeof c.case_number === "string" ? c.case_number : null,
    case_type: s(c.case_type, ["new", "refi"]),
    status: typeof c.status === "string" ? c.status : null,
    admin_url: `${adminBaseUrl.replace(/\/$/, "")}/admin/cases/${c.id}`,
  };
}

/** Keys that must never appear anywhere in an outbound AI/vendor payload. Used by tests. */
export const FORBIDDEN_KEYS = [
  "idNumber", "id_number", "birthDate", "birth_date", "signature", "phone", "email",
  "firstName", "lastName", "first_name", "last_name", "address", "fullName", "full_name",
  "ai_extracted_data", "extracted", "intake_data", "consent", "zipCode", "citizenshipDetails",
];
