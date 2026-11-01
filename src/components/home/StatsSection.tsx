import { FileCheck2, Landmark, BadgeCheck, MonitorSmartphone } from "lucide-react";

const facts = [
  { icon: BadgeCheck, value: "₪3,450", label: "מחיר קבוע לתהליך המלא" },
  { icon: Landmark, value: "עד 3 בנקים", label: "מכרז והשוואת הצעות" },
  { icon: FileCheck2, value: "תיק אחד", label: "שאלון ומסמכים במקום אחד" },
  { icon: MonitorSmartphone, value: "אונליין", label: "תהליך EasyMorte מתנהל דיגיטלית, בלי פגישות מיותרות" },
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
