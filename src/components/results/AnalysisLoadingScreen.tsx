import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";

const STEPS = [
  { label: "מנתח פרופיל תעסוקתי", duration: 800 },
  { label: "מחשב יחס החזר להכנסה", duration: 800 },
  { label: "בודק LTV ויחס הון עצמי", duration: 800 },
  { label: "משווה לתנאי שוק אפריל 2026", duration: 800 },
  { label: "בונה תמהילים מותאמים אישית", duration: 800 },
];

interface Props {
  onComplete: () => void;
}

export default function AnalysisLoadingScreen({ onComplete }: Props) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const runStep = (step: number) => {
      if (step >= STEPS.length) {
        timeout = setTimeout(onComplete, 600);
        return;
      }
      setCurrentStep(step);
      timeout = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, step]);
        runStep(step + 1);
      }, STEPS[step].duration);
    };
    runStep(0);
    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
      <motion.div
        className="max-w-md w-full mx-auto px-6 space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center space-y-2">
          <motion.div
            className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 text-primary" />
          </motion.div>
          <h2 className="text-xl font-bold text-foreground">מנתח את הפרופיל שלך...</h2>
          <p className="text-sm text-muted-foreground">רק כמה שניות</p>
        </div>

        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const isComplete = completedSteps.includes(i);
            const isActive = currentStep === i && !isComplete;
            return (
              <motion.div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isComplete ? "bg-primary/5" : isActive ? "bg-muted" : "opacity-40"
                }`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: isComplete || isActive ? 1 : 0.4, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {isComplete ? (
                  <CheckCircle className="h-5 w-5 text-[hsl(var(--success))] shrink-0" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 text-primary shrink-0 animate-spin" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                )}
                <span className={`text-sm font-medium ${isComplete ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                  {isComplete && " ✓"}
                </span>
              </motion.div>
            );
          })}
        </div>

        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${((completedSteps.length) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>
    </div>
  );
}
