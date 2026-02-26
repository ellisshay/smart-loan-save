import { CaseStatus } from "@/types/admin";

export interface MockCase {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  status: CaseStatus;
  createdAt: string;
  mortgageAmount: number;
  goal: string;
  income: number;
  riskLevel: string;
  documents: { name: string; uploaded: boolean }[];
  notes: string;
  mixesGenerated: boolean;
  reportGenerated: boolean;
  sentToBank: boolean;
  bankName?: string;
  bankOffer?: string;
}

export const MOCK_CASES: MockCase[] = [
  {
    id: "CASE-1001",
    clientName: "דני כהן",
    phone: "050-1234567",
    email: "dani@example.com",
    status: "analyzing",
    createdAt: "2026-02-24T10:30:00",
    mortgageAmount: 850000,
    goal: "להוריד החזר חודשי",
    income: 22000,
    riskLevel: "מאוזן",
    documents: [
      { name: "דוח יתרות", uploaded: true },
      { name: "תלושי שכר", uploaded: true },
      { name: "תעודת זהות", uploaded: true },
      { name: "אישור הכנסות", uploaded: false },
    ],
    notes: "לקוח עם משכנתא ב-3 מסלולים, ריבית ממוצעת 5.2%",
    mixesGenerated: false,
    reportGenerated: false,
    sentToBank: false,
  },
  {
    id: "CASE-1002",
    clientName: "מיכל רוזנברג",
    phone: "052-9876543",
    email: "michal@example.com",
    status: "mixes_ready",
    createdAt: "2026-02-23T14:15:00",
    mortgageAmount: 1200000,
    goal: "לקצר תקופה",
    income: 35000,
    riskLevel: "שמרני",
    documents: [
      { name: "דוח יתרות", uploaded: true },
      { name: "תלושי שכר", uploaded: true },
      { name: "תעודת זהות", uploaded: true },
      { name: "אישור הכנסות", uploaded: true },
    ],
    notes: "מעוניינת לקצר ב-5 שנים לפחות",
    mixesGenerated: true,
    reportGenerated: true,
    sentToBank: false,
  },
  {
    id: "CASE-1003",
    clientName: "אורי שפירא",
    phone: "054-5551234",
    email: "ori@example.com",
    status: "sent_to_banks",
    createdAt: "2026-02-22T09:00:00",
    mortgageAmount: 650000,
    goal: "להוריד החזר חודשי",
    income: 18000,
    riskLevel: "אגרסיבי",
    documents: [
      { name: "דוח יתרות", uploaded: true },
      { name: "תלושי שכר", uploaded: true },
      { name: "תעודת זהות", uploaded: true },
      { name: "אישור הכנסות", uploaded: true },
    ],
    notes: "נשלח לבנק הפועלים ולאומי",
    mixesGenerated: true,
    reportGenerated: true,
    sentToBank: true,
    bankName: "בנק הפועלים, בנק לאומי",
  },
  {
    id: "CASE-1004",
    clientName: "יעל אברהם",
    phone: "053-7778899",
    email: "yael@example.com",
    status: "waiting_docs",
    createdAt: "2026-02-25T16:45:00",
    mortgageAmount: 950000,
    goal: "להוריד החזר חודשי",
    income: 25000,
    riskLevel: "מאוזן",
    documents: [
      { name: "דוח יתרות", uploaded: false },
      { name: "תלושי שכר", uploaded: true },
      { name: "תעודת זהות", uploaded: true },
      { name: "אישור הכנסות", uploaded: false },
    ],
    notes: "",
    mixesGenerated: false,
    reportGenerated: false,
    sentToBank: false,
  },
  {
    id: "CASE-1005",
    clientName: "עמית לוי",
    phone: "050-3332211",
    email: "amit@example.com",
    status: "offer_received",
    createdAt: "2026-02-20T11:00:00",
    mortgageAmount: 1500000,
    goal: "לקצר תקופה",
    income: 42000,
    riskLevel: "שמרני",
    documents: [
      { name: "דוח יתרות", uploaded: true },
      { name: "תלושי שכר", uploaded: true },
      { name: "תעודת זהות", uploaded: true },
      { name: "אישור הכנסות", uploaded: true },
    ],
    notes: "התקבלה הצעה מבנק דיסקונט - ריבית 3.8% ממוצעת",
    mixesGenerated: true,
    reportGenerated: true,
    sentToBank: true,
    bankName: "בנק דיסקונט",
    bankOffer: "ריבית ממוצעת 3.8%, חיסכון חודשי ₪1,200",
  },
  {
    id: "CASE-1006",
    clientName: "נועם בן דוד",
    phone: "058-1112233",
    email: "noam@example.com",
    status: "payment_received",
    createdAt: "2026-02-26T08:30:00",
    mortgageAmount: 780000,
    goal: "להוריד החזר חודשי",
    income: 16000,
    riskLevel: "אגרסיבי",
    documents: [
      { name: "דוח יתרות", uploaded: false },
      { name: "תלושי שכר", uploaded: false },
      { name: "תעודת זהות", uploaded: false },
      { name: "אישור הכנסות", uploaded: false },
    ],
    notes: "שילם עכשיו, ממתין להעלאת מסמכים",
    mixesGenerated: false,
    reportGenerated: false,
    sentToBank: false,
  },
];
