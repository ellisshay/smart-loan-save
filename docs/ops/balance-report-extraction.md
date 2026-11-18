# Balance report extraction (#52)

Function: `supabase/functions/parse-balance-report`. Logic and controls: `supabase/functions/_shared/balanceReport.ts`. Tests use a synthetic report only (`src/test/fixtures/balanceReport.synthetic.ts`). Never commit a real report.

## Flow
1. **PDF with a text layer:** the text is read in code (`unpdf`, an open source library, no account and no fee) and the RTL digit order is repaired per page.
   - pdf.js reverses digit runs in Hebrew lines, e.g. `600,000.00` → `00.000,006`. This was checked on a synthetic Hebrew PDF.
   - Only the text is sent to the model.
2. **Images, scans, or a page with mixed digit order:** the file itself is sent (vision). A number with an ambiguous direction is never guessed.
3. **The model** (the existing gateway and model, `LOVABLE_API_KEY`) returns, for each field, a value, page, label, quote and confidence. Instructions in the document are treated as data.
4. **In code:**
   - Number and date parsing.
   - Dropping unknown keys.
   - Checking the quote appears on the cited page. If it doesn't, confidence drops to 0.4.
   - Masking 7+ digit runs (identifiers).
   - Reconciliation (below).
   - Status: `complete` / `needs_completion` / `conflict`.
5. **Second reading:** only for fields in doubt, and only if `BALANCE_RECHECK_MODEL` is set.
   - If the two readings agree, confidence rises.
   - If they disagree, the value is cleared and remains for a professional check. Neither reading is chosen.
6. **Storage:** a normalised record is saved in `balance_report_analyses` (owner and admin read, writes via the service role only). The file and file name are not stored. The `analysis_id` is carried into the case under `intake_data.balance_check`.

## Controls (`checkReport`)
- **Missing critical field** (rate type, linkage, principal, current rate, months remaining): `needs_completion`.
- **Linked track without linkage differences on principal:** `needs_completion`.
- **Track sums against report totals** (principal, accrued interest, payoff, linkage):
  - Tolerance is the larger of 1 ₪ per summed line or 0.01% of the total.
  - Total payoff may include general fees. The check accepts both with and without them.
- **Per-track payoff** = principal + linkage + accrued interest + linkage on interest, with or without positive track fees.
  - For a track known to be unlinked, linkage counts as 0.
- **Current rate from the "מתן ההלוואה" column, or original rate from "מועד החישוב":** conflict.
- **Months remaining against end date:** a difference over 1.5 months is a conflict. Months are not rounded.
- **Rate out of range, negative principal/payoff, start date after report date:** conflict.
- **Negative fee:** an informational issue only ("לא מענק ללקוח"). It isn't subtracted from any other cost.
- **Payoff balance:** never substituted for principal.

## Cost and privacy limits
- 10 analyses per user per day.
- Each call: 60-second timeout, at most 2 attempts.
- Output read is capped at 120K characters.
- Logs hold only status, counts and the gateway's status code. They never include document content or extracted values.

## What is needed to enable it
| Item | State | Owner action |
|---|---|---|
| Migration `20261118150000_balance_report_analyses.sql` | Checked locally (idempotent, RLS) | Run in Lovable before deploying the function. Without it the function still works, but with no daily limit and no `analysis_id`. |
| Deploy `parse-balance-report` | Code ready | Deploy in Lovable. |
| `npm:unpdf@0.12.1` in the Edge runtime | Checked in Node only, not in Deno | If the import fails, the function falls back to sending the file (as before). No action needed. |
| `BALANCE_RECHECK_MODEL` (second reading) | Prepared, off | Optional. A model name available on the existing gateway. Its cost is a second call only when fields are in doubt. Needs an owner decision on cost before it is set. |
| Real-report test | Not done | Shay can upload his own report on the live site after deployment and check the result. The report is not uploaded to GitHub. |
