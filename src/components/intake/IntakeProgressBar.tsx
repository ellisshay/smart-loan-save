import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { IntakeStep } from "@/types/intake";
import { Button } from "@/components/ui/button";

interface Props {
  steps: IntakeStep[];
  currentStep: number;
  completedSteps: string[];
  onStepClick: (step: number) => void;
}

export default function IntakeProgressBar({ steps, currentStep, completedSteps, onStepClick }: Props) {
  return (
    <div className="w-full mb-8">
      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full mb-4 overflow-hidden">
        <motion.div
          className="absolute h-full bg-gold-gradient rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(completedSteps.length / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Step indicators - desktop */}
      <div className="flex gap-2 md:justify-between overflow-x-auto pb-2">
        {steps.map((step, i) => {
          const isCompleted = completedSteps.includes(step.key);
          const isCurrent = i === currentStep;
          return (
            <Button variant="ghost"
              key={step.key}
              onClick={() => onStepClick(i)}
              aria-current={isCurrent ? "step" : undefined}
              className="flex flex-col items-center gap-1 h-auto px-1 min-w-14 shrink-0 transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                     ? "bg-success/10 text-success"
                    : isCurrent
                    ? "bg-gold-gradient text-accent-foreground shadow-gold"
                    : "bg-secondary text-foreground/60 border border-border"
                }`}
              >
                {isCompleted ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-[10px] font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                {step.title}
              </span>
              <span className={`text-[10px] h-4 ${isCompleted ? "text-success" : "text-primary"}`}>{isCompleted ? "הושלם" : isCurrent ? "כאן" : ""}</span>
            </Button>
          );
        })}
      </div>

      {/* Mobile: current step indicator */}
      <div className="md:hidden flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          שלב {currentStep + 1} מתוך {steps.length}
        </span>
        <span className="text-sm text-muted-foreground">{steps[currentStep]?.title}</span>
      </div>
    </div>
  );
}
