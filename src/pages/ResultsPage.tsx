import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Download, ArrowLeft, MessageCircle, Shield, TrendingUp, Home, Percent, Clock, Users } from "lucide-react";
import AnalysisLoadingScreen from "@/components/results/AnalysisLoadingScreen";
import PersonalizedInsights from "@/components/results/PersonalizedInsights";

interface ScoreBreakdown {
  income_stability: number;
  ltv_ratio: number;
  dti_ratio: number;
  credit_history: number;
  equity_quality: number;
}

interface RecommendedTrack {
  track: string;
  percentage: number;
  rate: number;
  monthly_payment: number;
  reason: string;
}

interface AIAnalysis {
  score: number;
  score_breakdown: ScoreBreakdown;
  ltv: number;
  dti: number;
  max_loan_amount: number;
  recommended_monthly_payment: number;
  strengths: string[];
  risks: string[];
  recommended_mix: RecommendedTrack[];
  summary_for_advisor: string;
  recommended_banks: string[];
}

const WHATSAPP_NUMBER = "972501234567";

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 70 ? "text-[hsl(var(--success))]" : score >= 50 ? "text-[hsl(var(--warning))]" : "text-destructive";
  const bgRing = score >= 70 ? "stroke-[hsl(var(--success))]" : score >= 50 ? "stroke-[hsl(var(--warning))]" : "stroke-destructive";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" className="stroke-muted" />
        <circle
          cx="60" cy="60" r="54" fill="none" strokeWidth="8"
          className={`${bgRing} transition-all duration-1000 ease-out`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-black ${color}`}>{score}</span>
        <span className="text-xs text-muted-foreground">מתוך 100</span>
      </div>
    </div>
  );
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const regTime = localStorage.getItem("easymort_reg_time");
    const deadline = regTime ? new Date(new Date(regTime).getTime() + 48 * 60 * 60 * 1000) : new Date(Date.now() + 48 * 60 * 60 * 1000);

    const tick = () => {
      const diff = Math.max(0, deadline.getTime() - Date.now());
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
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

const breakdownLabels: Record<string, { label: string; icon: React.ElementType; max: number }> = {
  income_stability: { label: "הכנסה ויציבות", icon: TrendingUp, max: 25 },
  ltv_ratio: { label: "LTV", icon: Home, max: 20 },
  dti_ratio: { label: "יחס החזר", icon: Percent, max: 25 },
  credit_history: { label: "היסטוריית אשראי", icon: Shield, max: 15 },
};

export default function ResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");
  const [quickScore, setQuickScore] = useState<number | null>(null);
  const [intakeData, setIntakeData] = useState<Record<string, any>>({});
  const [showLoading, setShowLoading] = useState(searchParams.get("fresh") === "1");

  useEffect(() => {
    const load = async () => {
      // Check for localStorage score (from funnel)
      const savedScore = localStorage.getItem("easymort_score");
      if (savedScore) setQuickScore(Number(savedScore));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If no auth but has localStorage score, show that
        if (savedScore) {
          setLoading(false);
          return;
        }
        navigate("/auth");
        return;
      }

      const [{ data: caseData }, { data: profile }] = await Promise.all([
        supabase.from("cases").select("ai_analysis, intake_data").eq("user_id", user.id)
          .order("created_at", { ascending: false }).limit(1).single(),
        supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).single(),
      ]);

      if (profile) setClientName([profile.first_name, profile.last_name].filter(Boolean).join(" "));

      if (caseData?.ai_analysis) {
        setAnalysis(caseData.ai_analysis as unknown as AIAnalysis);
      }
      if (caseData?.intake_data) {
        const intake = caseData.intake_data as Record<string, any>;
        setIntakeData(intake);
        if (!caseData.ai_analysis && intake.quick_score) setQuickScore(intake.quick_score);
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const displayScore = analysis?.score ?? quickScore ?? 0;

  if (!analysis && !quickScore) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">לא נמצא ניתוח. השלם תחילה את התיק שלך.</p>
        <Button onClick={() => navigate("/dashboard")}>חזור לדשבורד</Button>
      </div>
    );
  }

  const whatsappMsg = encodeURIComponent(
    `שלום, סיימתי ניתוח AI ב-EasyMorte ורוצה לשמוע על שלב ההגשה`
  );

  // Social proof: deterministic "fake" count
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

      <main className="container max-w-3xl py-8 px-4 space-y-8">
        {/* Score Circle */}
        <section className="text-center space-y-3">
          <h1 className="text-2xl font-bold">
            {clientName ? `${clientName}, ` : ""}הציון שלך מוכן
          </h1>
          <ScoreCircle score={displayScore} />
          <p className="text-sm text-muted-foreground">
            {displayScore >= 70 ? "ציון מצוין – סיכוי גבוה לאישור!" :
             displayScore >= 50 ? "ציון סביר – יש מה לשפר" :
             "ציון נמוך – כדאי להתייעץ"}
          </p>
        </section>

        {/* Breakdown Cards (only if full analysis) */}
        {analysis?.score_breakdown && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(breakdownLabels).map(([key, { label, icon: Icon, max }]) => {
              const val = analysis.score_breakdown?.[key as keyof ScoreBreakdown] ?? 0;
              const pct = Math.round((val / max) * 100);
              return (
                <Card key={key} className="text-center">
                  <CardContent className="pt-4 pb-3 px-3 space-y-1.5">
                    <Icon className="h-5 w-5 mx-auto text-primary" />
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold">{val}/{max}</p>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        )}

        {/* Recommended Mix */}
        {analysis?.recommended_mix?.length ? (
          <section className="space-y-3">
            <h2 className="text-lg font-bold">תמהיל מומלץ</h2>
            <div className="grid gap-3">
              {analysis.recommended_mix.map((track, i) => (
                <Card key={i}>
                  <CardContent className="flex items-center justify-between py-4 px-4">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm">{track.track}</p>
                      <p className="text-xs text-muted-foreground">{track.reason}</p>
                    </div>
                    <div className="text-left space-y-0.5">
                      <p className="font-bold text-primary">₪{track.monthly_payment?.toLocaleString()}/חודש</p>
                      <p className="text-xs text-muted-foreground">{track.rate}% | {track.percentage}%</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {/* Strengths & Risks */}
        {analysis && (
          <section className="grid md:grid-cols-2 gap-4">
            {analysis.strengths?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[hsl(var(--success))] flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> נקודות חוזק
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {analysis.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--success))] mt-0.5 shrink-0" />
                      <span>{s}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {analysis.risks?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[hsl(var(--warning))] flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> סיכונים
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {analysis.risks.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--warning))] mt-0.5 shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* PDF Download */}
        <div className="flex justify-center">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> הורד ניתוח מלא PDF
          </Button>
        </div>

        {/* ═══════ UPSELL CARD (Enhanced Stage 4) ═══════ */}
        <Card className="bg-[hsl(var(--navy))] text-white border-0 overflow-hidden">
          <CardContent className="py-8 px-6 space-y-5">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-bold">הציון שלך: {displayScore} – עכשיו נגיש לבנקים</h2>
              <p className="text-sm opacity-80">
                יועץ אישי ישלח את התיק שלך ל-3 בנקים במקביל ויחזיר לך את ההצעה הטובה ביותר תוך 72 שעות
              </p>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-2 text-sm bg-white/10 rounded-lg py-2 px-3">
              <Users className="h-4 w-4 text-destructive" />
              <span>🔴 {socialProofCount} לקוחות עם ציון דומה שלך הזמינו שירות מלא השבוע</span>
            </div>

            <div className="space-y-2">
              {[
                "מכרז בין 3 בנקים לפחות",
                "יועץ אישי לכל התהליך",
                "ממוצע חיסכון: ₪32,000",
              ].map((point, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-[hsl(var(--success))] shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            {/* ROI Line */}
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
                <p className="font-bold text-gold">9X</p>
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-3xl font-black">₪3,500</p>
              <p className="text-sm line-through opacity-50">₪5,000</p>
            </div>

            {/* Countdown Timer */}
            <div className="bg-white/10 rounded-lg py-2">
              <CountdownTimer />
            </div>

            <Button
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base"
              onClick={() => {
                // TODO: replace with actual Stripe payment link
                window.open("https://buy.stripe.com/test_placeholder_3500", "_blank");
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
                <MessageCircle className="h-3 w-3" /> שאל יועץ תחילה
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
