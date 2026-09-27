/** Shared display logic for the three-level document validation engine. */

export type ValidationLevel = "green" | "yellow" | "red";

export const LEVEL_UI: Record<ValidationLevel, { label: string; clientLabel: string; cls: string; row: string }> = {
  green: {
    label: "מאומת",
    clientLabel: "מאומת",
    cls: "bg-success/10 text-success border-success/20",
    row: "bg-success/5 border-success/20",
  },
  yellow: {
    label: "בבדיקת מומחה",
    clientLabel: "בבדיקת מומחה",
    cls: "bg-warning/10 text-warning border-warning/20",
    row: "bg-warning/5 border-warning/30",
  },
  red: {
    label: "אי התאמה מהותית",
    clientLabel: "נדרשת סריקה חוזרת",
    cls: "bg-destructive/10 text-destructive border-destructive/20",
    row: "bg-destructive/5 border-destructive/30",
  },
};

/** Manual decisions available to the mortgage operator. */
export const MANUAL_DECISIONS = [
  { key: "manual_verified", label: "אומת ידנית", level: "green", overall: "verified" },
  { key: "mismatch_approved", label: "אי התאמה אושרה כתקינה", level: "green", overall: "verified" },
  { key: "client_clarification", label: "נדרש בירור מול הלקוח", level: "yellow", overall: "review" },
  { key: "material_mismatch", label: "אי התאמה מהותית", level: "red", overall: "rejected" },
] as const;

export type ManualDecisionKey = typeof MANUAL_DECISIONS[number]["key"];

/** Reads the validation level of a document, falling back to the legacy overall field. */
export function levelOf(data: any): ValidationLevel | undefined {
  if (!data) return undefined;
  if (data.level === "green" || data.level === "yellow" || data.level === "red") return data.level;
  if (data.overall === "verified") return "green";
  if (data.overall === "review") return "yellow";
  if (data.overall === "rejected") return "red";
  return undefined;
}

/** A document counts as complete when it is verified or only pending professional review. */
export function isDocSettled(data: any): boolean {
  const l = levelOf(data);
  return l === "green" || l === "yellow";
}
