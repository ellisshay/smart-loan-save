import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Edit, Send } from "lucide-react";
import type { IntakeStep } from "@/types/intake";

interface Props {
  steps: IntakeStep[];
  intakeData: Record<string, any>;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  loading: boolean;
}

const LABELS: Record<string, string> = {
  firstName: "שם פרטי",
  lastName: "שם משפחה",
  idNumber: "ת.ז.",
  phone: "טלפון",
  email: "אימייל",
  maritalStatus: "מצב משפחתי",
  borrowerCount: "מספר לווים",
  transactionType: "סוג עסקה",
  propertyCity: "עיר",
  purchasePrice: "מחיר רכישה",
  ownEquity: "הון עצמי",
  requestedMortgage: "סכום משכנתא",
  employmentStatus: "תעסוקה",
  monthlyNetIncome: "הכנסה נטו",
  existingLoanPayments: "החזרים קיימים",
  maxDesiredPayment: "החזר מקסימלי",
  riskLevel: "רמת סיכון",
  mainGoal: "יעד מרכזי",
  stabilityPriority: "עדיפות יציבות",
  primeExposure: "חשיפה לפריים",
  indexExposure: "חשיפה למדד",
  holdingHorizon: "אופק אחזקה",
  currentBank: "בנק נוכחי",
  totalBalance: "יתרה לסילוק",
  currentMonthlyPayment: "החזר חודשי",
  remainingYears: "שנים שנותרו",
  estimatedValue: "שווי נכס",
  refiReasons: "סיבות למיחזור",
};

const VALUE_MAP: Record<string, Record<string, string>> = {
  maritalStatus: { single: "יחיד/ה", married: "נשוי/אה", common_law: "ידועים בציבור", divorced: "גרוש/ה", widowed: "אלמן/ה" },
  transactionType: { second_hand: "יד שנייה", new_build: "מקבלן", land_build: "קרקע + בנייה" },
  employmentStatus: { salaried: "שכיר", self_employed: "עצמאי", both: "גם וגם", maternity: "חל״ת", unemployed: "לא עובד" },
  riskLevel: { low: "נמוכה", medium: "בינונית", high: "גבוהה" },
  mainGoal: { lower_payment: "הורדת החזר", total_savings: "חיסכון כולל", stability: "יציבות", shorter_term: "קיצור" },
  primeExposure: { low: "נמוכה", medium: "בינונית", high: "גבוהה" },
  indexExposure: { low: "נמוכה", medium: "בינונית", high: "גבוהה" },
  holdingHorizon: { under_5: "פחות מ-5", "5_to_10": "5-10", over_10: "10+", unknown: "לא יודע" },
};

function formatValue(key: string, val: any): string {
  if (val === undefined || val === null || val === "") return "—";
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "number") return val.toLocaleString();
  if (VALUE_MAP[key]?.[val]) return VALUE_MAP[key][val];
  if (val === "yes") return "כן";
  if (val === "no") return "לא";
  return String(val);
}

export default function StepSummary({ steps, intakeData, onEdit, onSubmit, loading }: Props) {
  const dataSteps = steps.filter(s => s.key !== "documents" && s.key !== "consent" && s.key !== "summary");

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">סיכום התיק</h2>
        <p className="text-sm text-muted-foreground">בדוק את הנתונים לפני ההגשה</p>
      </div>

      {dataSteps.map((step, i) => {
        const stepData = intakeData[step.key];
        if (!stepData || typeof stepData !== "object") return null;

        return (
          <motion.div
            key={step.key}
            className="bg-card rounded-xl p-5 border border-border"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success" />
                {step.title}
              </h3>
              <button
                onClick={() => onEdit(i)}
                className="text-xs text-gold font-semibold hover:underline flex items-center gap-1"
              >
                <Edit size={12} />
                עריכה
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              {Object.entries(stepData)
                .filter(([k]) => LABELS[k])
                .map(([key, val]) => (
                  <div key={key}>
                    <span className="text-xs text-muted-foreground">{LABELS[key]}</span>
                    <div className="text-sm font-medium text-foreground">{formatValue(key, val)}</div>
                  </div>
                ))}
            </div>
          </motion.div>
        );
      })}

      <div className="flex gap-3 pt-6">
        <Button
          type="button"
          variant="cta"
          size="xl"
          className="flex-1"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <span className="animate-pulse">שולח...</span>
          ) : (
            <>
              <Send size={20} />
              הגש תיק
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
