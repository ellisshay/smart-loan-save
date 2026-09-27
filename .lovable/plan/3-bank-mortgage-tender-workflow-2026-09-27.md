# 3-Bank Mortgage Tender Workflow

Extends the existing admin case page and client portal. No redesign, same look and components.

## What gets built

**Admin / advisor: new "מכרז בנקים" tab inside each case (`/admin/cases/:id`)**
- Summary strip: client, requested amount, property value, LTV, purpose, case status, assigned advisor, tender open date.
- 3 fixed bank slots. Each picks a bank from an editable list of Israeli banks (Hapoalim, Leumi, Discount, Mizrahi-Tefahot, First International, Jerusalem, Mercantile, Yahav + admin can add).
- Bank card: banker contact, submission date, status (12 statuses from the spec), approved amount, approved LTV, approval validity, internal notes, private bank files.
- Offer editor: multiple tracks (type, amount, %, period, rate, rate type, indexation, first payment) + totals, offer date, validity. Save as "ראשונית" / "משופרת" / "סופית". Every save is a new version; older versions stay visible as history.
- "Show to client" toggle per offer and an advisor explanation field.
- Automatic comparison table of the 3 banks. No automatic "winner".
- Closing checklist (11 steps), each marked done by the advisor.
- Assign advisor to a case (admin only).

**Client: new "מכרז המשכנתא שלי" page (`/dashboard/tender`)**
- 9-step progress bar (file complete → mortgage completed).
- 3 bank cards with friendly status messages (auto-translated from advisor status, no internal notes).
- Only offers the advisor approved for display; simple comparison + open each offer to see its tracks.
- "יש לי שאלה לגבי ההצעה" (sends message to advisor) and "אני רוצה להתקדם עם ההצעה" → confirmation screen → advisor + admin get an email. Case stage becomes "מתקדמים לביצוע"; advisor confirms before anything final.
- Simplified closing progress after selection.

## Permissions
- Client: own case, only approved offers, no notes.
- Advisor: only cases assigned to them.
- Admin: everything.
- Bank files in a private storage folder, short-lived signed links only.

## Audit trail
Every change to bank slots, offers, selections and notes is logged (who, what, old value, new value, time). Offers are never overwritten, only new versions added.

## Technical details
- New tables: `banks`, `tenders` (case_id, advisor_id, opened_at, stage), `tender_banks` (slot 1-3, bank_id, status, fields, internal_notes), `tender_offers` (versioned: tender_bank_id, version, kind, tracks jsonb, totals, client_visible, advisor_explanation), `tender_checklist`, `tender_client_actions` (question / proceed). Add `assigned_advisor_id` to `cases`.
- Client reads through a security-definer function / view that strips internal notes and non-approved offers.
- Generic audit trigger writing old/new jsonb into existing `audit_log`; UPDATE/DELETE blocked on `tender_offers`.
- RLS via `has_role` + assignment check; GRANTs on every table.
- Email via existing `case-email` function (new "tender_proceed" and "status" templates).
