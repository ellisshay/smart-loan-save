import type { KnowledgeCluster } from "./types";

export const clusters: KnowledgeCluster[] = [
  {
    id: "first-mortgage",
    label: "משכנתא ראשונה",
    description:
      "הדרך מההון העצמי ועד חתימה: כמה תוכלו לקבל, מה הבנק בודק ואיך לא נתקעים בדרך.",
  },
  {
    id: "refinance",
    label: "מחזור משכנתא",
    description: "מתי מחזור משתלם, כמה זה עולה ואיך מחשבים את החיסכון האמיתי.",
  },
  {
    id: "mix-rates",
    label: "תמהילים וריביות",
    description: "מסלולים, ריביות ופיזור: איך בונים תמהיל שלא מפתיע לרעה.",
  },
  {
    id: "calculators",
    label: "מחשבונים",
    description: "כלים חינמיים לבדיקה עצמית: יכולת, תמהיל, מחזור ועוד.",
  },
  {
    id: "pre-approval",
    label: "אישור עקרוני",
    description: "מה זה אישור עקרוני, כמה זמן הוא תקף ולמה כדאי להוציא אותו לפני חוזה.",
  },
  {
    id: "self-employed",
    label: "עצמאים",
    description: "משכנתא לעצמאים: איך הבנק מסתכל על ההכנסות ואיזה מסמכים צריך.",
  },
  {
    id: "advisor",
    label: "יועץ משכנתאות",
    description: "מתי יועץ מחזיר את עצמו, כמה הוא עולה ואיך בודקים שהוא אמין.",
  },
  {
    id: "documents",
    label: "מסמכים",
    description: "כל המסמכים למשכנתא: מה צריך, למה צריך, ומה קורה כשחסר.",
  },
  {
    id: "bank-auction",
    label: "מכרז בנקים",
    description: "איך מריצים מכרז בנקים ומשתמשים בהצעות כדי להוריד ריבית.",
  },
];

export const getCluster = (id: string) => clusters.find((c) => c.id === id);
