-- SYNTHETIC DATA ONLY. No real people, IDs, salaries or documents.
SET search_path = public, extensions;
INSERT INTO auth.users (id, email, raw_user_meta_data, email_confirmed_at) VALUES
 ('aaaaaaaa-0000-4000-8000-00000000000a','customer.a@staging.invalid','{"first_name":"Test","last_name":"CustomerA"}',now()),
 ('bbbbbbbb-0000-4000-8000-00000000000b','customer.b@staging.invalid','{"first_name":"Test","last_name":"CustomerB"}',now()),
 ('adadadad-0000-4000-8000-0000000000ad','admin@staging.invalid','{"first_name":"Test","last_name":"Admin"}',now()),
 ('0b0b0b0b-0000-4000-8000-0000000000ab','operations@staging.invalid','{"first_name":"Test","last_name":"Ops"}',now()),
 ('a0a0a0a0-0000-4000-8000-0000000000aa','advisor@staging.invalid','{"first_name":"Test","last_name":"Advisor"}',now()),
 ('5c5c5c5c-0000-4000-8000-00000000005c','supervisor@staging.invalid','{"first_name":"Test","last_name":"Supervisor"}',now());
INSERT INTO user_roles(user_id, role) VALUES
 ('adadadad-0000-4000-8000-0000000000ad','admin'),
 ('0b0b0b0b-0000-4000-8000-0000000000ab','operations'),
 ('a0a0a0a0-0000-4000-8000-0000000000aa','mortgage_advisor'),
 ('5c5c5c5c-0000-4000-8000-00000000005c','supervisor')
ON CONFLICT DO NOTHING;

-- Fake IDs: 000000018 / 000000026 (check digit valid, clearly synthetic). Signature: a 1x1 placeholder.
INSERT INTO cases (id, user_id, case_type, status, intake_complete, payment_succeeded, assigned_advisor_id, intake_data) VALUES
 ('ca5eaaaa-0000-4000-8000-00000000000a','aaaaaaaa-0000-4000-8000-00000000000a','new','InAnalysis',true,true,'a0a0a0a0-0000-4000-8000-0000000000aa',
  '{"personal":{"borrowerCount":"2","borrower1":{"firstName":"Test","lastName":"CustomerA","idNumber":"000000018","birthDate":"1990-01-01","phone":"0500000001","email":"customer.a@staging.invalid","dependents":1},
     "borrower2":{"firstName":"Test","lastName":"BorrowerTwo","idNumber":"000000026","birthDate":"1991-02-02","phone":"0500000002"}},
    "income":{"employmentStatus":"salaried","employer":"Synthetic Ltd","monthlyNetIncome":12345,"grossSalary":17000,"b2EmploymentStatus":"salaried","b2MonthlyNetIncome":9876},
    "liabilities":{"existingLoanPayments":500,"hasDelinquentDebt":"no","hasLegalProceedings":"no","riskLevel":"medium","maxDesiredPayment":6000},
    "property":{"transactionType":"second_hand","purchasePrice":1500000,"requestedMortgage":900000,"ownEquity":600000},
    "declarations":{"hasExecutionFile":"no","hasBankruptcy":"no"},
    "consent":{"fullName":"Test CustomerA","signature":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==","signedAt":"2026-11-01T10:00:00Z","termsAccepted":true,"privacyAccepted":true,"dataUsageAccepted":true}}'),
 ('ca5ebbbb-0000-4000-8000-00000000000b','bbbbbbbb-0000-4000-8000-00000000000b','refi','InAnalysis',true,true,NULL,
  '{"personal":{"borrowerCount":"1","borrower1":{"firstName":"Test","lastName":"CustomerB","idNumber":"000000034","birthDate":"1985-05-05"}},"income":{"monthlyNetIncome":20000}}');

INSERT INTO storage.buckets (id, name, public) VALUES ('case-documents','case-documents',false) ON CONFLICT DO NOTHING;
INSERT INTO storage.objects (bucket_id, name, owner) VALUES
 ('case-documents','aaaaaaaa-0000-4000-8000-00000000000a/ca5eaaaa-0000-4000-8000-00000000000a/payslips/1_payslip.pdf','aaaaaaaa-0000-4000-8000-00000000000a'),
 ('case-documents','aaaaaaaa-0000-4000-8000-00000000000a/ca5eaaaa-0000-4000-8000-00000000000a/bank_statements/2_statement.pdf','aaaaaaaa-0000-4000-8000-00000000000a'),
 ('case-documents','bbbbbbbb-0000-4000-8000-00000000000b/ca5ebbbb-0000-4000-8000-00000000000b/id_card/3_id.pdf','bbbbbbbb-0000-4000-8000-00000000000b'),
 ('case-documents','tender/ca5ebbbb-0000-4000-8000-00000000000b/offer.pdf',NULL);
INSERT INTO case_documents (id, case_id, doc_type, file_name, file_path, is_required, ai_extracted_data) VALUES
 ('d0c0aaaa-0000-4000-8000-0000000000a1','ca5eaaaa-0000-4000-8000-00000000000a','payslips','payslip.pdf','aaaaaaaa-0000-4000-8000-00000000000a/ca5eaaaa-0000-4000-8000-00000000000a/payslips/1_payslip.pdf',true,
   '{"level":"green","overall":"verified","manual_review":{"decision":"manual_verified","label":"אומת ידנית","at":"2026-11-01T11:00:00Z"}}'),
 ('d0c0aaaa-0000-4000-8000-0000000000a2','ca5eaaaa-0000-4000-8000-00000000000a','bank_statements','statement.pdf','aaaaaaaa-0000-4000-8000-00000000000a/ca5eaaaa-0000-4000-8000-00000000000a/bank_statements/2_statement.pdf',true,
   '{"level":"red","overall":"rejected"}'),
 ('d0c0bbbb-0000-4000-8000-0000000000b1','ca5ebbbb-0000-4000-8000-00000000000b','id_card','id.pdf','bbbbbbbb-0000-4000-8000-00000000000b/ca5ebbbb-0000-4000-8000-00000000000b/id_card/3_id.pdf',true,NULL);
INSERT INTO consents (user_id, consent_type, consent_version, case_id) VALUES
 ('bbbbbbbb-0000-4000-8000-00000000000b','bank_data_transfer','2026-10-v2','ca5ebbbb-0000-4000-8000-00000000000b');
-- A tender with one offer on B's case (opened as postgres; RLS bypassed for seeding)
INSERT INTO tenders (id, case_id) VALUES ('7e7e0000-0000-4000-8000-00000000000b','ca5ebbbb-0000-4000-8000-00000000000b');
INSERT INTO tender_banks (id, tender_id, slot, status) VALUES ('7b7b0000-0000-4000-8000-00000000000b','7e7e0000-0000-4000-8000-00000000000b',1,'offer_received');
INSERT INTO tender_offers (tender_bank_id, version, first_payment, client_visible) VALUES ('7b7b0000-0000-4000-8000-00000000000b',1,5000,true);
