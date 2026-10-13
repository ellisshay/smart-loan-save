import { z } from "zod";

export const quickCheckContactSchema = z.object({
  firstName: z.string().trim().min(2, "יש להזין שם (לפחות שני תווים)").max(40).regex(/^[^<>\p{Cc}]+$/u, "שם לא תקין"),
  phone: z.string().max(30).transform((v) => v.replace(/[\s()-]/g, "")).pipe(z.string().regex(/^(05\d{8}|\+9725\d{8})$/, "יש להזין מספר נייד ישראלי תקין")),
});

export const formatAmount = (value: number) => Number.isFinite(value) ? value.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "";
export const parseAmount = (value: string) => /^\d[\d,]*$/.test(value) ? Number(value.replace(/,/g, "")) : value === "" ? 0 : null;