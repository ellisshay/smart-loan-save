import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, AlertTriangle, Download, ArrowLeft, MessageCircle,
  Shield, TrendingUp, Home, Percent, Clock, Users, Lightbulb, BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import AnalysisLoadingScreen from "@/components/results/AnalysisLoadingScreen";

/* ═══════ Types ═══════ */
interface ScoreBreakdown {
  income_stability: { score: number; max: number; note: string };
  ltv_quality: { score: number; max: number; note: string };
  dti_ratio: { score: number; max: number; note: string };
  credit_history: { score: number; max: number; note: string };
  equity_quality: { score: number; max: number; note: string };
}

interface MixTrack {
  track_name: string;
  percentage: number;
  rate: number;
  monthly_payment: number;
  early_repayment: "free" | "penalty";
}

interface Mix {
  name: string;
  tagline: string;
  for_who: string;
  recommended: boolean;
  tracks: MixTrack[];
  total_monthly: number;
  total_interest: number;
  total_cost: number;
  pros: string[];
  cons: string[];
  risk_level: string;
  best_if: string;
}

interface Insight {
  type: "positive" | "warning" | "tip" | "comparison";
  title: string;
  body: string;
  action?: string;
}

interface ExistingOfferComparison {
  their_rate: number;
  their_monthly: number;
  market_rate: number;
  market_monthly: number;
  monthly_diff: number;
  total_diff: number;
  verdict: string;
  recommendation: string;
}

interface AIAnalysis {
  score: number;
  score_label: string;
  approval_probability: string;
  ltv: number;
  dti: number;
  max_monthly: number;
  max_loan_amount: number;
  score_breakdown: ScoreBreakdown;
  mixes: Mix[];
  insights: Insight[];
  existing_offer_comparison: ExistingOfferComparison | null;
  strengths: string[];
  red_flags: string[];
  urgency_note: string | null;
  advisor_summary: string;
  recommended_banks: string[];
}

const WHATSAPP_NUMBER = "972501234567";

/* ═══════ Sub-components ═══════ */

function ScoreCircle({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0);
  const color = score >= 80 ? "text-[hsl(var(--success))]" : score >= 60 ? "text-primary" : score >= 40 ? "text-[hsl(var(--warning))]" : "text-destructive";
  const ringColor = score >= 80 ? "stroke-[hsl(var(--success))]" : score >= 60 ? "stroke-primary" : score >= 40 ? "stroke-[hsl(var(--warning))]" : "stroke-destructive";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (displayed / 100) * circumference;

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1500;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(eased * score));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="relative w-[200px] h-[200px] mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" className="stroke-muted" />
        <circle
          cx="60" cy="60" r="54" fill="none" strokeWidth="8"
          className={`${ringColor} transition-all duration-300`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-black ${color}`}>{displayed}</span>
        <span className="text-xs text-muted-foreground">מתוך 100</span>
      </div>
    </div>
  );
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const regTime = localStorage.getItem("easymort_reg_time");
    const deadline = regTime ? new Date(new Date(regTime).getTime() + 48 * 3600000) : new Date(Date.now() + 48 * 3600000);
    const tick = () => {
      const diff = Math.max(0, deadline.getTime() - Date.now());
      setTimeLeft({ hours: Math.floor(diff / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center justify-center gap-1 text-sm font-mono">
      <Clock className="h-4 w-4" />
      <span>מחיר זה תקף עוד: </span>
      <span className="font-bold">{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
    </div>
  );
}

const breakdownLabels: Record<string, { label: string; icon: React.ElementType }> = {
  income_stability: { label: "יציבות תעסוקה", icon: TrendingUp },
  ltv_quality: { label: "איכות LTV", icon: Home },
  dti_ratio: { label: "יחס החזר", icon: Percent },
  credit_history: { label: "היסטוריית אשראי", icon: Shield },
  equity_quality: { label: "איכות הון עצמי", icon: BarChart3 },
};

const trackColorMap: Record<string, string> = {
  "קל\"צ": "bg-blue-50 dark:bg-blue-950/30",
  "ק\"צ": "bg-blue-50 dark:bg-blue-950/30",
  "קל\"צ ארוך": "bg-blue-50 dark:bg-blue-950/30",
  "פריים": "bg-primary/5",
  "פריים מינוס": "bg-primary/5",
  "משתנה 5": "bg-amber-50 dark:bg-amber-950/30",
  "משתנה 5 צמוד": "bg-amber-50 dark:bg-amber-950/30",
  "משתנה 2 צמוד": "bg-amber-50 dark:bg-amber-950/30",
  "זכאות": "bg-purple-50 dark:bg-purple-950/30",
};

function insightBorder(type: string) {
  switch (type) {
    case "positive": return "border-r-4 border-r-[hsl(var(--success))]";
    case "warning": return "border-r-4 border-r-[hsl(var(--warning))]";
    case "tip": return "border-r-4 border-r-blue-500";
    case "comparison": return "border-r-4 border-r-purple-500";
    default: return "";
  }
}

function insightIcon(type: string) {
  switch (type) {
    case "positive": return <CheckCircle className="h-5 w-5 text-[hsl(var(--success))] shrink-0" />;
    case "warning": return <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning))] shrink-0" />;
    case "tip": return <Lightbulb className="h-5 w-5 text-blue-500 shrink-0" />;
    case "comparison": return <BarChart3 className="h-5 w-5 text-purple-500 shrink-0" />;
    default: return null;
  }
}

/* ═══════ Main Page ═══════ */
export default function ResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");
  const [showLoading, setShowLoading] = useState(searchParams.get("fresh") === "1");
  const [activeMix, setActiveMix] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const [{ data: caseData }, { data: profile }] = await Promise.all([
        supabase.from("cases").select("ai_analysis").eq("user_id", user.id)
          .order("created_at", { ascending: false }).limit(1).single(),
        supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).single(),
      ]);

      if (profile) setClientName([profile.first_name, profile.last_name].filter(Boolean).join(" "));
      if (caseData?.ai_analysis) {
        const parsed = caseData.ai_analysis as unknown as AIAnalysis;
        setAnalysis(parsed);
        // Set active mix to recommended one
        const recIdx = parsed.mixes?.findIndex(m => m.recommended) ?? 0;
        setActiveMix(recIdx >= 0 ? recIdx : 0);
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleLoadingComplete = useCallback(() => setShowLoading(false), []);

  if (showLoading) return <AnalysisLoadingScreen onComplete={handleLoadingComplete} />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6" dir="rtl">
        <p className="text-muted-foreground">לא נמצא ניתוח. השלם תחילה את התיק שלך.</p>
        <Button onClick={() => navigate("/dashboard")}>חזור לדשבורד</Button>
      </div>
    );
  }

  const { score, score_label, approval_probability, ltv, dti, max_monthly, score_breakdown, mixes, insights, existing_offer_comparison, strengths, red_flags, urgency_note, advisor_summary, recommended_banks } = analysis;

  const whatsappMsg = encodeURIComponent("שלום, סיימתי ניתוח AI ב-EasyMorte ורוצה לשמוע על שלב ההגשה");
  const socialProofCount = 8 + (new Date().getDay() * 2) + Math.floor(new Date().getHours() / 6);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-1 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> חזרה לדשבורד
          </Button>
          <span className="font-display font-bold text-lg text-foreground">תוצאות הניתוח</span>
          <div className="w-20" />
        </div>
      </header>

      <main className="container max-w-3xl py-8 px-4 space-y-10">

        {/* ═══════ SECTION 1: Score Circle ═══════ */}
        <motion.section className="text-center space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">
            {clientName ? `${clientName}, ` : ""}הציון שלך מוכן
          </h1>
          <ScoreCircle score={score} />
          <p className="text-lg font-semibold text-foreground">{score_label}</p>
          <p className="text-sm text-muted-foreground">{approval_probability}</p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">LTV: {ltv}%</Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">DTI: {dti}%</Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">החזר מקסימלי: ₪{max_monthly?.toLocaleString()}</Badge>
          </div>
        </motion.section>

        {/* ═══════ SECTION 2: Score Breakdown ═══════ */}
        {score_breakdown && (
          <motion.section className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="text-lg font-bold">פירוט הציון</h2>
            <div className="space-y-3">
              {Object.entries(breakdownLabels).map(([key, { label, icon: Icon }]) => {
                const item = score_breakdown[key as keyof ScoreBreakdown];
                if (!item) return null;
                const pct = Math.round((item.score / item.max) * 100);
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-medium">{label}</span>
                      </div>
                      <span className="font-bold">{item.score}/{item.max}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                    </div>
                    {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ═══════ SECTION 3: Mortgage Mixes ═══════ */}
        {mixes?.length > 0 && (
          <motion.section className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <h2 className="text-lg font-bold">3 תמהילים מותאמים אישית לפרופיל שלך</h2>
            <p className="text-sm text-muted-foreground">בנויים לפי ריביות שוק אפריל 2026 ודרישות בנק ישראל</p>

            {/* Mobile tabs */}
            <div className="flex gap-2 md:hidden overflow-x-auto pb-2">
              {mixes.map((mix, i) => (
                <button
                  key={i}
                  onClick={() => setActiveMix(i)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeMix === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {mix.recommended && "⭐ "}{mix.name}
                </button>
              ))}
            </div>

            {/* Desktop: all cards, Mobile: active only */}
            <div className="grid gap-4">
              {mixes.map((mix, i) => {
                const isVisible = typeof window !== "undefined" && window.innerWidth < 768 ? activeMix === i : true;
                if (!isVisible) return null;
                return (
                  <Card key={i} className={`overflow-hidden ${mix.recommended ? "border-2 border-primary ring-1 ring-primary/20" : ""}`}>
                    {mix.recommended && (
                      <div className="bg-primary text-primary-foreground text-center text-sm font-bold py-1.5">⭐ מומלץ עבורך</div>
                    )}
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold">{mix.name}</h3>
                        <p className="text-sm text-muted-foreground">{mix.tagline}</p>
                        <p className="text-xs text-muted-foreground italic mt-1">{mix.for_who}</p>
                      </div>

                      {/* Tracks table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground">
                              <th className="text-right py-2 font-medium">מסלול</th>
                              <th className="text-center py-2 font-medium">%</th>
                              <th className="text-center py-2 font-medium">ריבית</th>
                              <th className="text-center py-2 font-medium">החזר חודשי</th>
                              <th className="text-center py-2 font-medium">פירעון</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mix.tracks?.map((track, ti) => (
                              <tr key={ti} className={`border-b border-border/50 ${trackColorMap[track.track_name] || ""}`}>
                                <td className="py-2.5 font-medium">{track.track_name}</td>
                                <td className="text-center">{track.percentage}%</td>
                                <td className="text-center">{track.rate}%</td>
                                <td className="text-center font-semibold">₪{track.monthly_payment?.toLocaleString()}</td>
                                <td className="text-center">
                                  {track.early_repayment === "free" ? (
                                    <span className="text-[hsl(var(--success))]" title="ניתן לפירעון ללא עמלה">✓</span>
                                  ) : (
                                    <span className="text-[hsl(var(--warning))]" title="יש עמלת פירעון">⚠️</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Summary */}
                      <div className="bg-muted rounded-lg p-4 text-center space-y-1">
                        <p className="text-2xl font-black text-foreground">₪{mix.total_monthly?.toLocaleString()}/חודש</p>
                        <p className="text-sm text-muted-foreground">עלות ריבית כוללת: ₪{mix.total_interest?.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">עלות כוללת: ₪{mix.total_cost?.toLocaleString()}</p>
                      </div>

                      {/* Pros & Cons */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          {mix.pros?.map((p, pi) => (
                            <div key={pi} className="flex items-start gap-1.5 text-xs">
                              <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--success))] mt-0.5 shrink-0" />
                              <span>{p}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1">
                          {mix.cons?.map((c, ci) => (
                            <div key={ci} className="flex items-start gap-1.5 text-xs">
                              <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--warning))] mt-0.5 shrink-0" />
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <Badge variant="outline" className="text-xs">{mix.risk_level}</Badge>
                        <p className="text-xs text-muted-foreground">מתאים במיוחד ל: {mix.best_if}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ═══════ SECTION 4: Personalized Insights ═══════ */}
        {insights?.length > 0 && (
          <motion.section className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <h2 className="text-lg font-bold">תובנות אישיות לפרופיל שלך</h2>
            <div className="grid gap-3">
              {insights.map((ins, i) => (
                <Card key={i} className={`${insightBorder(ins.type)}`}>
                  <CardContent className="py-4 px-5 flex items-start gap-3">
                    {insightIcon(ins.type)}
                    <div className="space-y-1 flex-1">
                      <p className="font-bold text-sm">{ins.title}</p>
                      <p className="text-sm text-muted-foreground">{ins.body}</p>
                      {ins.action && (
                        <Button variant="link" size="sm" className="text-primary p-0 h-auto text-xs">{ins.action}</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        {/* ═══════ SECTION 5: Existing Offer Comparison ═══════ */}
        {existing_offer_comparison && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> ניתוח ההצעה שלך מול השוק
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-card rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">ההצעה שלך</p>
                    <p className="font-bold text-lg">{existing_offer_comparison.their_rate}%</p>
                    <p className="text-sm">₪{existing_offer_comparison.their_monthly?.toLocaleString()}/חודש</p>
                  </div>
                  <div className="bg-card rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">ממוצע שוק</p>
                    <p className="font-bold text-lg text-[hsl(var(--success))]">{existing_offer_comparison.market_rate}%</p>
                    <p className="text-sm">₪{existing_offer_comparison.market_monthly?.toLocaleString()}/חודש</p>
                  </div>
                </div>
                <div className="text-center space-y-1 py-2">
                  <p className="text-lg font-bold text-destructive">
                    אתה משלם ₪{existing_offer_comparison.monthly_diff?.toLocaleString()} יותר בחודש
                  </p>
                  <p className="text-2xl font-black text-destructive">
                    ₪{existing_offer_comparison.total_diff?.toLocaleString()} יותר על פני חיי המשכנתא
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant={existing_offer_comparison.verdict === "גרוע" ? "destructive" : "secondary"}>
                    {existing_offer_comparison.verdict}
                  </Badge>
                </div>
                <p className="text-sm text-center text-muted-foreground">{existing_offer_comparison.recommendation}</p>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* ═══════ SECTION 6: Strengths & Red Flags ═══════ */}
        <motion.section className="grid md:grid-cols-2 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          {strengths?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[hsl(var(--success))] flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" /> חוזקות הפרופיל שלך
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--success))] mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[hsl(var(--warning))] flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> נקודות לשיפור
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {red_flags?.length > 0 ? (
                red_flags.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--warning))] mt-0.5 shrink-0" />
                    <span>{r}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--success))]">
                  <CheckCircle className="h-4 w-4" />
                  <span>פרופיל נקי – ללא נקודות בעייתיות ✓</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        {/* ═══════ SECTION 7: Urgency Note ═══════ */}
        {urgency_note && (
          <div className="bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/30 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-[hsl(var(--warning))]">⏱ {urgency_note}</p>
          </div>
        )}

        {/* PDF Download */}
        <div className="flex justify-center">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> הורד ניתוח מלא PDF
          </Button>
        </div>

        {/* ═══════ SECTION 8: Upsell ═══════ */}
        <Card className="bg-[hsl(var(--navy))] text-white border-0 overflow-hidden">
          <CardContent className="py-8 px-6 space-y-5">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-bold">הציון שלך: {score} – עכשיו נגיש לבנקים</h2>
              <p className="text-sm opacity-80">{advisor_summary}</p>
            </div>

            {recommended_banks?.length > 0 && (
              <p className="text-sm text-center opacity-70">
                בנקים מומלצים לפרופיל שלך: {recommended_banks.join(" | ")}
              </p>
            )}

            <div className="flex items-center justify-center gap-2 text-sm bg-white/10 rounded-lg py-2 px-3">
              <Users className="h-4 w-4 text-destructive" />
              <span>🔴 {socialProofCount} לקוחות עם ציון דומה הזמינו שירות מלא השבוע</span>
            </div>

            <div className="space-y-2">
              {[
                "יועץ אישי שולח ל-3 בנקים במקביל",
                "מכרז ריביות – הבנקים מתחרים",
                "ממוצע חיסכון: ₪32,000",
              ].map((point, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-[hsl(var(--success))] shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center bg-white/10 rounded-lg py-3">
              <div>
                <p className="text-xs opacity-60">עלות</p>
                <p className="font-bold">₪3,500</p>
              </div>
              <div>
                <p className="text-xs opacity-60">ממוצע חיסכון</p>
                <p className="font-bold text-[hsl(var(--success))]">₪32,000</p>
              </div>
              <div>
                <p className="text-xs opacity-60">ROI</p>
                <p className="font-bold text-[hsl(var(--gold))]">9X</p>
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-3xl font-black">₪3,500</p>
              <p className="text-sm line-through opacity-50">₪5,000</p>
            </div>

            <div className="bg-white/10 rounded-lg py-2">
              <CountdownTimer />
            </div>

            <Button
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base"
              onClick={() => {
                window.open("https://secure.tranzila.com/YOUR_TERMINAL/iframed.php?sum=3500&currency=1&cred_type=1&success_url=https://smart-loan-save.lovable.app/dashboard", "_blank");
              }}
            >
              אני רוצה את ההצעה הטובה ביותר – ₪3,500 ←
            </Button>

            <div className="text-center">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs opacity-70 hover:opacity-100 underline inline-flex items-center gap-1"
              >
                <MessageCircle className="h-3 w-3" /> שאל יועץ קודם →
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
