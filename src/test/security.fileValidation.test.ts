// SECURITY-B regression: server-side upload validation (scenarios 11-14). Synthetic files only.
import { describe, expect, it } from "vitest";
import { validateUpload, detectType, safeDisplayName, MAX_UPLOAD_BYTES, CUSTOMER_DOC_TYPES } from "../../supabase/functions/_shared/fileValidation";

const enc = (s: string) => new TextEncoder().encode(s);
const pdf = (body = "1 0 obj << /Type /Catalog >> endobj") => enc(`%PDF-1.7\n${body}\ntrailer << >>\n%%EOF\n`);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1]);
const WEBP = enc("RIFF\u0000\u0000\u0000\u0000WEBPVP8 ");

describe("upload validation", () => {
  it("accepts a well-formed PDF, PNG, JPEG and WEBP by their bytes", () => {
    expect(validateUpload(pdf())).toMatchObject({ ok: true, type: { ext: "pdf" } });
    expect(validateUpload(PNG)).toMatchObject({ ok: true, type: { ext: "png" } });
    expect(validateUpload(JPG)).toMatchObject({ ok: true, type: { ext: "jpg" } });
    expect(validateUpload(WEBP)).toMatchObject({ ok: true, type: { ext: "webp" } });
  });
  it("11: rejects HTML disguised as a PDF (name/extension are ignored)", () => {
    expect(validateUpload(enc("<!doctype html><html><script>alert(1)</script></html>"))).toEqual({ ok: false, reason: "unsupported_type" });
  });
  it("12: rejects SVG disguised as a PDF", () => {
    expect(validateUpload(enc('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>'))).toEqual({ ok: false, reason: "unsupported_type" });
  });
  it("13: rejects files over 10 MB", () => {
    const big = new Uint8Array(MAX_UPLOAD_BYTES + 1); big.set(pdf(), 0);
    expect(validateUpload(big)).toEqual({ ok: false, reason: "too_large" });
  });
  it("14: rejects a malformed (truncated) PDF", () => {
    expect(validateUpload(enc("%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n"))).toEqual({ ok: false, reason: "malformed_pdf" });
  });
  it("rejects a PDF with active content (JavaScript / launch actions / embedded files)", () => {
    expect(validateUpload(pdf("<< /OpenAction << /S /JavaScript /JS (app.alert(1)) >> >>"))).toEqual({ ok: false, reason: "active_content" });
    expect(validateUpload(pdf("<< /S /Launch /F (cmd.exe) >>"))).toEqual({ ok: false, reason: "active_content" });
    expect(validateUpload(pdf("<< /Type /EmbeddedFile >>"))).toEqual({ ok: false, reason: "active_content" });
  });
  it("rejects executables, ZIP/Office files and empty files", () => {
    expect(validateUpload(enc("MZ\u0090\u0000\u0003\u0000\u0000\u0000\u0004\u0000\u0000\u0000"))).toEqual({ ok: false, reason: "unsupported_type" });
    expect(validateUpload(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 0, 0, 0, 0]))).toEqual({ ok: false, reason: "unsupported_type" });
    expect(validateUpload(new Uint8Array())).toEqual({ ok: false, reason: "empty" });
    expect(detectType(enc("short"))).toBeNull();
  });
});

describe("filename handling", () => {
  it("keeps the original name as safe display metadata only", () => {
    expect(safeDisplayName("../../etc/passwd")).toBe("passwd");
    expect(safeDisplayName("C:\\Users\\x\\תלוש <script>.pdf")).toBe("תלוש script.pdf");
    expect(safeDisplayName("")).toBe("document");
    expect(safeDisplayName("a".repeat(300)).length).toBe(120);
  });
  it("only allow-listed document types can be uploaded", () => {
    expect(CUSTOMER_DOC_TYPES).toContain("payslips");
    expect(CUSTOMER_DOC_TYPES as readonly string[]).not.toContain("../tender");
    expect(CUSTOMER_DOC_TYPES as readonly string[]).not.toContain("tender");
  });
});
