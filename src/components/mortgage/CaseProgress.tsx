import { Check, Circle, Hand, Loader2 } from "lucide-react";
import { STEP_STATE_LABEL, type ProgressStep } from "@/lib/mortgage/caseProgress";
import { cn } from "@/lib/utils";

const ICON = { done: Check, active: Loader2, waiting: Circle, action: Hand } as const;
const DOT = {
  done: "bg-success text-white",
  active: "bg-primary text-white",
  waiting: "bg-muted text-muted-foreground",
  action: "bg-warning text-white",
} as const;

/** 9-step case progress. `compact` shows a horizontal strip for the dashboard home. */
export default function CaseProgress({ steps, compact = false }: { steps: ProgressStep[]; compact?: boolean }) {
  if (compact) {
    const current = steps.findIndex((s) => s.state !== "done");
    const doneCount = steps.filter((s) => s.state === "done").length;
    const cur = steps[current] ?? steps[steps.length - 1];
    return (
      <div>
        <div className="flex gap-1" role="img" aria-label={`הושלמו ${doneCount} מתוך ${steps.length} שלבים`}>
          {steps.map((s) => (
            <div key={s.key} className={cn("h-2 flex-1 rounded-full",
              s.state === "done" ? "bg-success" : s.state === "action" ? "bg-warning" : s.state === "active" ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
        <p className="text-sm mt-3">
          <span className="font-semibold">שלב {Math.min(current + 1, steps.length)} מתוך {steps.length}: {cur.label}</span>
          <span className="text-muted-foreground"> · {cur.hint}</span>
        </p>
      </div>
    );
  }
  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const Icon = ICON[s.state];
        return (
          <li key={s.key} className="flex gap-3 pb-5 last:pb-0 relative">
            {i < steps.length - 1 && <span className={cn("absolute right-[15px] top-8 bottom-0 w-0.5", s.state === "done" ? "bg-success/40" : "bg-border")} aria-hidden />}
            <span className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10", DOT[s.state])}>
              <Icon size={15} className={s.state === "active" ? "animate-spin [animation-duration:2.5s]" : ""} aria-hidden />
            </span>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">{i + 1}. {s.label}</p>
                <span className={cn("text-[11px] px-2 py-0.5 rounded-full",
                  s.state === "done" ? "bg-success/10 text-success" : s.state === "action" ? "bg-warning/15 text-warning" : s.state === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                  {STEP_STATE_LABEL[s.state]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{s.hint}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
