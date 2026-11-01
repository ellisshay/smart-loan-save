// SECURITY-B regression: outbound AI / vendor payloads must never carry identity data,
// signatures, document extractions or other customers' rows. Synthetic data only.
import { describe, expect, it } from "vitest";
import {
  financialScorePayload, poolAggregate, documentCheckDeclared, makeIntakePayload, FORBIDDEN_KEYS, NO_AI_DOC_TYPES,
} from "../../supabase/functions/_shared/aiPayload";

const FAKE_ID = "000000018";
const FAKE_ID_2 = "000000026";
const SIGNATURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const intake = {
  personal: {
    borrowerCount: "2",
    borrower1: { firstName: "Test", lastName: "CustomerA", idNumber: FAKE_ID, birthDate: "1990-01-01", phone: "0500000001", email: "a@staging.invalid", address: "Synthetic st 1", city: "Testville", dependents: 2 },
    borrower2: { firstName: "Test", lastName: "BorrowerTwo", idNumber: FAKE_ID_2, birthDate: "1991-02-02", phone: "0500000002" },
  },
  income: { employmentStatus: "salaried", employer: "Synthetic Ltd", monthlyNetIncome: 12345, grossSalary: 17000, rentalIncome: 1000, b2EmploymentStatus: "salaried", b2MonthlyNetIncome: 9876, b2Employer: "Other Synthetic" },
  liabilities: { existingLoanPayments: 500, hasDelinquentDebt: "no", riskLevel: "medium", maxDesiredPayment: 6000 },
  property: { transactionType: "second_hand", purchasePrice: 1500000, requestedMortgage: 900000, ownEquity: 600000, propertyAddress: "Secret 5" },
  declarations: { hasExecutionFile: "no", hasBankruptcy: "no", confirmTruthful: true },
  consent: { fullName: "Test CustomerA", signature: SIGNATURE, signedAt: "2026-11-01T10:00:00Z" },
};
const docs = [{ doc_type: "payslips", ai_extracted_data: { level: "green", extracted: { id_number: FAKE_ID, employee_name: "Test CustomerA", net: 12345 } } }];
const tracks = [{ id: "row-id", case_id: "case-id", track_type: "prime", principal_balance: 300000, interest_rate: 5.6, is_indexed: false, remaining_years: 18 }];

function keysDeep(v: unknown, out: string[] = []): string[] {
  if (Array.isArray(v)) v.forEach((x) => keysDeep(x, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { out.push(k); keysDeep(x, out); }
  return out;
}
function assertClean(payload: unknown) {
  const json = JSON.stringify(payload);
  const keys = keysDeep(payload);
  for (const k of FORBIDDEN_KEYS) expect(keys, `forbidden key ${k}`).not.toContain(k);
  expect(json).not.toMatch(/\b\d{9}\b/); // no ID-like 9-digit numbers
  expect(json).not.toContain("data:image");
  expect(json).not.toMatch(/staging\.invalid|050000000|Synthetic st|Secret 5|1990-01-01/);
  expect(json).not.toMatch(/CustomerA|BorrowerTwo/);
}

describe("financial score AI payload", () => {
  const p = financialScorePayload({ caseType: "new", goal: "lower_payment", intake, tracks, docs });
  it("contains no identity data, signature, contact details, address or extracted values", () => assertClean(p));
  it("still carries the financial figures the analysis needs", () => {
    expect(p.borrower_count).toBe(2);
    expect(p.borrowers[0].net_income).toBe(12345);
    expect(p.borrowers[0].additional_income).toBe(1000);
    expect(p.borrowers[1].net_income).toBe(9876);
    expect(p.property.price).toBe(1500000);
    expect(p.request.amount).toBe(900000);
    expect(p.tracks[0]).toEqual({ type: "prime", balance: 300000, rate: 5.6, indexed: false, remaining_years: 18 });
    expect(p.documents).toEqual([{ type: "payslips", level: "green" }]);
  });
  it("does not include database row ids of tracks", () => {
    expect(JSON.stringify(p)).not.toMatch(/row-id|case-id/);
  });
});

describe("anonymous pool", () => {
  it("returns aggregates only, never individual rows", () => {
    const rows = [{ loan_amount: 100, ltv: 50, property_value: 1000 }, { loan_amount: 300, ltv: 70, property_value: 2000 }];
    const agg = poolAggregate(rows);
    expect(agg).toEqual({ count: 2, avg_loan: 200, avg_property_value: 1500, avg_ltv: 60, avg_dti: null });
    expect(JSON.stringify(agg)).not.toContain("sample");
  });
});

describe("document cross-check declared values", () => {
  it("borrower 1: name and employment figures only, no ID or birth date", () => {
    const d = documentCheckDeclared(intake, "payslips");
    expect(d).toEqual({ borrower: 1, name: "Test CustomerA", employer: "Synthetic Ltd", gross_salary: 17000, net_income: 12345, loans_monthly: 500 });
    expect(JSON.stringify(d)).not.toMatch(new RegExp(`${FAKE_ID}|1990-01-01|0500000001|staging\\.invalid`));
  });
  it("borrower 2 documents use borrower 2's data", () => {
    const d = documentCheckDeclared(intake, "payslips_b2");
    expect(d.name).toBe("Test BorrowerTwo");
    expect(d.net_income).toBe(9876);
    expect(JSON.stringify(d)).not.toContain(FAKE_ID_2);
  });
  it("identity documents are on the no-AI list", () => {
    expect(NO_AI_DOC_TYPES).toContain("id_card");
    expect(NO_AI_DOC_TYPES).toContain("id_card_b2");
  });
});

describe("Make.com intake alert", () => {
  it("is an internal alert with a link only", () => {
    const p = makeIntakePayload({ id: "11111111-1111-4111-8111-111111111111", case_number: "EM-1001", case_type: "new", status: "WaitingForPayment" }, "https://www.easymorte.co.il/");
    expect(Object.keys(p).sort()).toEqual(["admin_url", "case_id", "case_number", "case_type", "event", "status", "timestamp"]);
    expect(p.admin_url).toBe("https://www.easymorte.co.il/admin/cases/11111111-1111-4111-8111-111111111111");
    assertClean(p);
  });
});
