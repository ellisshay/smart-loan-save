// Server-side validation for customer document uploads. Pure TypeScript (unit-tested by vitest).
// The browser's file type and extension are never trusted: the type is detected from the file's bytes.

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const UPLOAD_CACHE_SECONDS = "60";

export type DetectedType = { mime: "application/pdf" | "image/jpeg" | "image/png" | "image/webp"; ext: "pdf" | "jpg" | "png" | "webp" };

const startsWith = (b: Uint8Array, sig: number[], at = 0) => sig.every((x, i) => b[at + i] === x);

/** Detects the real file type from magic bytes. Returns null for anything that is not an allowed document type. */
export function detectType(bytes: Uint8Array): DetectedType | null {
  if (bytes.length < 12) return null;
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return { mime: "application/pdf", ext: "pdf" }; // %PDF-
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", ext: "png" };
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return { mime: "image/webp", ext: "webp" };
  return null;
}

const ascii = (b: Uint8Array) => {
  let out = "";
  for (let i = 0; i < b.length; i++) out += String.fromCharCode(b[i]);
  return out;
};

/**
 * Structural PDF checks (a heuristic, not an antivirus):
 * - must end with an %%EOF marker (truncated / malformed files are rejected)
 * - must not contain active content (JavaScript, auto-launch actions, embedded files).
 */
export function pdfProblems(bytes: Uint8Array): string | null {
  const tail = ascii(bytes.subarray(Math.max(0, bytes.length - 2048)));
  if (!tail.includes("%%EOF")) return "malformed_pdf";
  const body = ascii(bytes);
  if (/\/(JavaScript|JS|Launch|EmbeddedFile|RichMedia|XFA)\b/.test(body)) return "active_content";
  return null;
}

export type UploadCheck =
  | { ok: true; type: DetectedType }
  | { ok: false; reason: "empty" | "too_large" | "unsupported_type" | "malformed_pdf" | "active_content" };

export function validateUpload(bytes: Uint8Array): UploadCheck {
  if (!bytes.length) return { ok: false, reason: "empty" };
  if (bytes.length > MAX_UPLOAD_BYTES) return { ok: false, reason: "too_large" };
  const type = detectType(bytes);
  if (!type) return { ok: false, reason: "unsupported_type" };
  if (type.ext === "pdf") {
    const p = pdfProblems(bytes);
    if (p) return { ok: false, reason: p as "malformed_pdf" | "active_content" };
  }
  return { ok: true, type };
}

/** Original filename kept as display metadata only: no path parts, no control or markup characters. */
export function safeDisplayName(name: unknown): string {
  const base = String(name ?? "").split(/[\\/]/).pop() ?? "";
  // deno-lint-ignore no-control-regex
  const clean = base.replace(/[\u0000-\u001f\u007f<>"'`]/g, "").replace(/\s+/g, " ").trim();
  return (clean || "document").slice(0, 120);
}

/** Document types a customer may upload. Anything else is rejected. */
export const CUSTOMER_DOC_TYPES = [
  "id_card", "id_card_b2", "payslips", "payslips_b2", "bank_statements", "purchase_contract",
  "loan_balances", "appraisal", "land_registry", "rights_approval", "annual_reports", "bookkeeping",
  "mortgage_report", "settlement_report", "other_loans", "existing_offer", "general",
] as const;

export const UPLOAD_ERRORS: Record<string, string> = {
  empty: "הקובץ ריק",
  too_large: "הקובץ גדול מדי (עד 10MB)",
  unsupported_type: "ניתן להעלות PDF, JPG, PNG או WEBP בלבד",
  malformed_pdf: "קובץ ה-PDF פגום. נסו לשמור או לסרוק אותו מחדש",
  active_content: "קובץ ה-PDF מכיל תוכן פעיל ולא ניתן להעלות אותו. נסו לשמור אותו מחדש כ-PDF רגיל",
};
