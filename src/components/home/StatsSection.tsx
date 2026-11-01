import { FileCheck2, Landmark, BadgeCheck, MonitorSmartphone } from "lucide-react";

const facts = [
  { icon: BadgeCheck, value: "\u20aa3,450", label: "\u05de\u05d7\u05d9\u05e8 \u05e7\u05d1\u05d5\u05e2 \u05dc\u05ea\u05d4\u05dc\u05d9\u05da \u05d4\u05de\u05dc\u05d0" },
  { icon: Landmark, value: "\u05e2\u05d3 3 \u05d1\u05e0\u05e7\u05d9\u05dd", label: "\u05de\u05db\u05e8\u05d6 \u05d5\u05d4\u05e9\u05d5\u05d5\u05d0\u05ea \u05d4\u05e6\u05e2\u05d5\u05ea" },
  { icon: FileCheck2, value: "\u05ea\u05d9\u05e7 \u05d0\u05d7\u05d3", label: "\u05e9\u05d0\u05dc\u05d5\u05df \u05d5\u05de\u05e1\u05de\u05db\u05d9\u05dd \u05d1\u05de\u05e7\u05d5\u05dd \u05d0\u05d7\u05d3" },
  { icon: MonitorSmartphone, value: "100% \u05d3\u05d9\u05d2\u05d9\u05d8\u05dc\u05d9", label: "\u05dc\u05dc\u05d0 \u05e4\u05d2\u05d9\u05e9\u05d5\u05ea \u05de\u05d9\u05d5\u05ea\u05e8\u05d5\u05ea" },
];

export default function StatsSection() {
  return (
    <section className="py-7 md:py-10 bg-card border-y border-border" aria-label="השירות במספרים">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-7 max-w-6xl mx-auto">
          {facts.map((fact) => (
            <div key={fact.label} className="text-center px-3 border-s border-border first:border-s-0 [&:nth-child(3)]:border-s-0 md:[&:nth-child(3)]:border-s">
              <div className="flex items-center justify-center gap-2 mb-2">
                <fact.icon className="text-primary shrink-0" size={18} strokeWidth={1.5} aria-hidden />
                <div className="font-display text-xl md:text-2xl font-bold text-foreground tabular-nums">{fact.value}</div>
              </div>
              <div className="text-muted-foreground text-sm">{fact.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
