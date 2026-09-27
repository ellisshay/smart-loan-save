# EasyMorte: personal area, emails, report and data pool

## 1. Personal area layout
- Keep the site header and footer inside the client personal area (wrap dashboard in the main site layout, keep side menu).

## 2. Contact card for both borrowers
- New "Contact details" card on the dashboard home: name, phone, email for borrower 1 and borrower 2 (if two borrowers), editable, saved to the case.

## 3. Button arrows
- Replace all right-pointing arrows on buttons (icons and "→" text) with left-pointing ones site-wide (RTL correct).

## 4. Contact email everywhere
- Replace every contact email on the site (footer, contact page, legal, WhatsApp/contact blocks) with easymorte.il@gmail.com.

## 5. Emails sent from easymorte.il@gmail.com
- Connect the Gmail account easymorte.il@gmail.com (connect card will appear, you sign in once).
- Client emails (to the email they entered):
  - Case opened confirmation.
  - Status update on every status change (payment, review, offers received, etc.).
  - Reminder after 2 days if details are incomplete (checked automatically every few hours, sent once).
  - "File complete" update once all details and documents are in.
- Admin email (to easymorte.il@gmail.com) on every case opening, even partial, with a client card: names, phones, emails, case type, property, income, completion percentage, link to the case.

## 6. Save progress
- Every step auto-saves to the case; returning days later resumes at the same step with all data (already stored per case, will verify and add autosave on every field change).

## 7. Final detailed report
- After completion, client gets a detailed report: estimated mortgage amount, monthly payment, suggested mix based on the day's market rates (rates table, updated daily from public Bank of Israel data), and comparison to similar profiles in our data pool.

## 8. Mortgage data pool by profile
- New anonymized profile table (age range, income range, LTV, property area, case type, final mix, rates offered).
- Daily job collects public market data (Bank of Israel average mortgage rates, prime, CPI) into the rates table.
- Report cross-references the client with similar profiles plus public data.

## 9. End-to-end test
- Run the full flow: sign up, open case with two borrowers, leave midway, return, complete, verify emails sent (client + admin), status update, report shown.

## Technical details
- Gmail connector via gateway from edge functions: send-client-email, notify-admin-new-case, cron-driven send-reminders (pg_cron, 48h after last update, flag in case to send once).
- Status-change email triggered from admin status update and webhook-handler.
- Contact card stored in intake_data.contacts via update_case_safe.
- New tables: mortgage_profiles (anonymized, admin-read only), with GRANTs + RLS; fetch-market-rates edge function on daily cron.
- Report built by existing generate-financial-score with pool stats passed in.

## Notes
- Automated checks cannot guarantee public web data accuracy; sources shown in the report.
- Gmail has daily sending limits (about 500/day for a regular account), fine for current volume.
