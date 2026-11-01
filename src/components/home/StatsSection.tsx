import { FileCheck2, Landmark, BadgeCheck, MonitorSmartphone } from "lucide-react";

const facts = [
  { icon: BadgeCheck, value: "\u20aa3,450", label: "\u05de\u05d7\u05d9\u05e8 \u05e7\u05d1\u05d5\u05e2 \u05dc\u05ea\u05d4\u05dc\u05d9\u05da \u05d4\u05de\u05dc\u05d0" },
  { icon: Landmark, value: "\u05e2\u05d3 3 \u05d1\u05e0\u05e7\u05d9\u05dd", label: "\u05de\u05db\u05e8\u05d6 \u05d5\u05d4\u05e9\u05d5\u05d5\u05d0\u05ea \u05d4\u05e6\u05e2\u05d5\u05ea" },
  { icon: FileCheck2, value: "\u05ea\u05d9\u05e7 \u05d0\u05d7\u05d3", label: "\u05e9\u05d0\u05dc\u05d5\u05df \u05d5\u05de\u05e1\u05de\u05db\u05d9\u05dd \u05d1\u05de\u05e7\u05d5\u05dd \u05d0\u05d7\u05d3" },
  { icon: MonitorSmartphone, value: "100% \u05d3\u05d9\u05d2\u05d9\u05d8\u05dc\u05d9", label: "\u05dc\u05dc\u05d0 \u05e4\u05d2\u05d9\u05e9\u05d5\u05ea \u05de\u05d9\u05d5\u05ea\u05e8\u05d5\u05ea" },
];

export default function StatsSection() {
  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(215_50%_8%)] via-[hsl(215_45%_12%)] to-[hsl(215_40%_16%)]" />
      <div className="absolute inset-0 ledger-paper-dark opacity-70" aria-hidden />
      <div className="absolute inset-x-0 top-0 gold-rule opacity-60" aria-hidden />
      <div className="container relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-4xl mx-auto">
          {facts.map((fact) => (
            <div key={fact.label} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gold/15 ring-1 ring-inset ring-gold/25 flex items-center justify-center mx-auto mb-4">
                <fact.icon className="text-gold" size={28} />
              </div>
              <div className="font-ticker text-2xl md:text-3xl font-black text-white mb-1 tabular-nums">{fact.value}</div>
              <div className="text-white/60 text-sm font-medium">{fact.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
