import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, TrendingDown, AlertTriangle, CheckCircle, FileText, Lightbulb } from "lucide-react";

interface InsightCard {
  icon: React.ElementType;
  title: string;
  body: string;
  type: "positive" | "warning" | "info";
}

interface Props {
  intakeData: Record<string, any>;
  score: number;
}

export default function PersonalizedInsights({ intakeData, score }: Props) {
  const insights = generateInsights(intakeData, score);
  
  if (insights.length === 0) return null;

  const colorMap = {
    positive: { bg: "bg-primary/5 border-primary/20", icon: "text-primary", title: "text-primary" },
    warning: { bg: "bg-[hsl(var(--warning))]/5 border-[hsl(var(--warning))]/20", icon: "text-[hsl(var(--warning))]", title: "text-[hsl(var(--warning))]" },
    info: { bg: "bg-muted border-border", icon: "text-muted-foreground", title: "text-foreground" },
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">תובנות אישיות</h2>
      <div className="grid gap-3">
        {insights.map((insight, i) => {
          const colors = colorMap[insight.type];
          const Icon = insight.icon;
          return (
            <Card key={i} className={`${colors.bg} border`}>
              <CardContent className="py-4 px-5 flex items-start gap-3">
                <Icon className={`h-5 w-5 ${colors.icon} shrink-0 mt-0.5`} />
                <div className="space-y-1">
                  <p className={`font-bold text-sm ${colors.title}`}>{insight.title}</p>
                  <p className="text-sm text-muted-foreground">{insight.body}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function generateInsights(data: Record<string, any>, score: number): InsightCard[] {
  const insights: InsightCard[] = [];
  const income = data.income || {};
  const property = data.property || {};
  const liabilities = data.liabilities || {};

  // Employment type insights
  const employment = income.employmentStatus;
  const occupation = (income.occupation || "").toLowerCase();
  const seniority = income.workSeniority || 0;

  if (employment === "salaried") {
    const isHighTech = ["הייטק", "תוכנה", "פיתוח", "tech", "software", "engineer", "developer", "hi-tech"]
      .some(k => occupation.includes(k));
    
    if (isHighTech) {
      insights.push({
        icon: Briefcase,
        title: "💻 פרופיל הייטק: יתרון משמעותי",
        body: `אופציות ובונוסים יכולים להיחשב כהכנסה נוספת. ${seniority > 24 ? `עם ${Math.round(seniority / 12)} שנות ניסיון בתחום, הפרופיל שלך נחשב יציב.` : "ותק מעל שנתיים ישפר את התנאים."}`,
        type: "positive",
      });
    } else if (seniority > 36) {
      insights.push({
        icon: CheckCircle,
        title: "👔 יציבות תעסוקתית גבוהה",
        body: `ותק של ${Math.round(seniority / 12)} שנים אצל אותו מעסיק – זה בונוס משמעותי מול הבנק.`,
        type: "positive",
      });
    }

    if (income.contractType === "temporary") {
      insights.push({
        icon: AlertTriangle,
        title: "⚠️ חוזה זמני",
        body: "חוזה עבודה זמני עלול להערים קשיים. מומלץ להמציא אישור מהמעסיק על כוונה להעסקה ארוכת טווח.",
        type: "warning",
      });
    }
  }

  if (employment === "self_employed") {
    const bizSeniority = income.businessSeniority || 0;
    const annualIncome = income.annualIncome || 0;
    const monthlyAvg = income.monthlyAvgSelfEmployed || 0;

    if (bizSeniority < 24) {
      insights.push({
        icon: AlertTriangle,
        title: "⚠️ עצמאי עם ותק נמוך",
        body: `ותק עסקי של פחות מ-2 שנים מקשה על אישור משכנתא. בנקים דורשים לפחות 2 שנות דוחות.`,
        type: "warning",
      });
    }

    if (annualIncome > 0 && monthlyAvg > 0) {
      const impliedAnnual = monthlyAvg * 12;
      const variance = Math.abs(annualIncome - impliedAnnual) / Math.max(annualIncome, impliedAnnual) * 100;
      if (variance > 20) {
        insights.push({
          icon: TrendingDown,
          title: "📊 שונות בהכנסה כעצמאי",
          body: `נראית שונות בהכנסות בין השנים. יש לנו 3 דרכים להציג את זה לטובתך מול הבנק.`,
          type: "warning",
        });
      }
    }

    if (income.hasOpenTaxDebts === "yes") {
      insights.push({
        icon: AlertTriangle,
        title: "🚨 חובות מס פתוחים",
        body: "חובות מס פתוחים עלולים לעכב אישור. מומלץ להסדיר לפני הגשה.",
        type: "warning",
      });
    }
  }

  // LTV insight
  const purchasePrice = property.purchasePrice || 0;
  const requestedMortgage = property.requestedMortgage || 0;
  if (purchasePrice > 0 && requestedMortgage > 0) {
    const ltv = Math.round((requestedMortgage / purchasePrice) * 100);
    if (ltv <= 60) {
      insights.push({
        icon: CheckCircle,
        title: "🏠 LTV מצוין: " + ltv + "%",
        body: "אחוז מימון נמוך מאוד – זה ייתן לך כוח מיקוח מול הבנקים.",
        type: "positive",
      });
    } else if (ltv > 75) {
      insights.push({
        icon: AlertTriangle,
        title: "🏠 LTV גבוה: " + ltv + "%",
        body: "אחוז מימון מעל 75% מגביל את אפשרויות המשכנתא ומייקר את הריבית.",
        type: "warning",
      });
    }
  }

  // DTI insight
  const totalIncome = income.monthlyNetIncome || 0;
  const totalLiabilities = (liabilities.existingLoanPayments || 0) + (liabilities.creditCardMonthly || 0);
  const maxPayment = liabilities.maxDesiredPayment || 0;
  if (totalIncome > 0) {
    const dti = Math.round(((totalLiabilities + maxPayment) / totalIncome) * 100);
    if (dti > 40) {
      insights.push({
        icon: AlertTriangle,
        title: `⚠️ יחס החזר גבוה: ${dti}%`,
        body: "יחס החזר להכנסה מעל 40% מסכן את האישור. מומלץ לסגור הלוואות קיימות לפני הגשה.",
        type: "warning",
      });
    }
  }

  // Delinquent debt
  if (liabilities.hasDelinquentDebt === "yes") {
    insights.push({
      icon: AlertTriangle,
      title: "🚨 חובות בפיגור",
      body: "חובות בפיגור הם דגל אדום מול הבנק. מומלץ להסדיר את כל החובות לפני הגשה.",
      type: "warning",
    });
  }

  // Score-based general insight
  if (score >= 80 && insights.filter(i => i.type === "warning").length === 0) {
    insights.push({
      icon: Lightbulb,
      title: "🎯 פרופיל חזק – נצל את זה",
      body: "עם ציון גבוה כזה, כדאי להגיש ל-3 בנקים במקביל ולמקסם את כוח המיקוח.",
      type: "positive",
    });
  }

  return insights.slice(0, 4); // Max 4 insights
}
