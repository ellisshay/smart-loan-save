import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Hand } from "lucide-react";
import type { NextAction } from "@/lib/mortgage/nextAction";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { withCase } from "./primitives";

/** "השלב הבא שלך": current status, what it means, one clear CTA. */
export default function NextActionCard({ next, caseId, statusLabel }: { next: NextAction; caseId?: string | null; statusLabel?: string }) {
  const Icon = next.tone === "action" ? Hand : next.tone === "done" ? CheckCircle2 : Clock;
  return (
    <section
      className={cn("rounded-2xl p-5 sm:p-6 border",
        next.tone === "action" ? "bg-navy text-white border-navy" : "bg-card border-border")}
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          next.tone === "action" ? "bg-white/10" : next.tone === "done" ? "bg-success/10 text-success" : "bg-primary/10 text-primary")}>
          <Icon size={20} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          {statusLabel && <p className={cn("text-xs mb-1", next.tone === "action" ? "text-white/70" : "text-muted-foreground")}>סטטוס התיק: {statusLabel}</p>}
          <h2 className="font-display text-xl font-bold leading-tight">{next.title}</h2>
          <p className={cn("text-sm mt-1.5 leading-relaxed", next.tone === "action" ? "text-white/85" : "text-muted-foreground")}>{next.body}</p>
        </div>
      </div>
      {next.cta && (
        <Button asChild size="lg" variant={next.tone === "action" ? "cta" : "outline"} className="w-full sm:w-auto mt-4 min-h-12">
          <Link to={withCase(next.cta.href, caseId)}>{next.cta.label}<ArrowLeft size={16} className="mr-1" /></Link>
        </Button>
      )}
    </section>
  );
}
