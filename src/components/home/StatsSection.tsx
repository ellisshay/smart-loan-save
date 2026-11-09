import { FileCheck2, Landmark, BadgeCheck, MonitorSmartphone } from "lucide-react";

const facts = [
  { icon: BadgeCheck, value: "₪3,450", label: "מחיר קבוע לתהליך המלא" },
  { icon: Landmark, value: "עד 3 בנקים", label: "מכרז והשוואת הצעות" },
  { icon: FileCheck2, value: "תיק אחד", label: "שאלון ומסמכים במקום אחד" },
  { icon: MonitorSmartphone, value: "אונליין", label: "תהליך EasyMorte מתנהל דיגיטלית, בלי פגישות מיותרות" },
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
