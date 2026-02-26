import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { IntakeStep } from "@/types/intake";

interface Props {
  steps: IntakeStep[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export default function IntakeProgressBar({ steps, currentStep, onStepClick }: Props) {
  return (
    <div className="w-full mb-8">
      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full mb-4 overflow-hidden">
        <motion.div
          className="absolute h-full bg-gold-gradient rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Step indicators - desktop */}
      <div className="hidden md:flex justify-between">
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <button
              key={step.key}
              onClick={() => i <= currentStep && onStepClick(i)}
              className={`flex flex-col items-center gap-1 transition-colors ${
                i <= currentStep ? "cursor-pointer" : "cursor-default opacity-50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? "bg-gold text-accent-foreground"
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
            </button>
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
