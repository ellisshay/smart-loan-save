import { FileCheck2, Landmark, Clock, ShieldCheck } from "lucide-react";

/** Pure-CSS 3D composition: a floating digital case file with bank offers orbiting it. */
export default function Hero3D() {
  return (
    <div className="relative h-[460px] w-full perspective-1000" aria-hidden>
      {/* orbit ring */}
      <div className="absolute inset-0 flex items-center justify-center preserve-3d" style={{ transform: "rotateX(72deg)" }}>
        <div className="h-[380px] w-[380px] rounded-full border border-gold/30 animate-spin-3d" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative preserve-3d animate-float-3d">
          {/* back layers = stacked documents */}
          {[2, 1].map((d) => (
            <div
              key={d}
              className="absolute inset-0 rounded-lg border border-gold/25 bg-card/70"
              style={{ transform: `translateZ(-${d * 28}px) translate(${d * 10}px, ${d * 10}px)` }}
            />
          ))}
          {/* main file card */}
          <div className="relative w-72 rounded-lg border border-gold/40 bg-card p-6 shadow-card-hover" style={{ transform: "translateZ(0)" }}>
            <div className="mb-5 flex items-center justify-between">
              <span className="font-display text-lg font-bold text-foreground">התיק שלי</span>
              <FileCheck2 className="text-gold" size={20} />
            </div>
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>השלמת תיק</span>
              <span className="font-ticker text-foreground">100%</span>
            </div>
            <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-full bg-gold-gradient" />
            </div>
            {["שאלון", "מסמכי הכנסה", "פרטי עסקה"].map((t) => (
              <div key={t} className="flex items-center justify-between border-t border-border py-2 text-sm">
                <span className="text-foreground">{t}</span>
                <ShieldCheck size={14} className="text-success" />
              </div>
            ))}
            <div className="mt-4 rounded-md bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground">
              3,450 ₪ · מחיר קבוע
            </div>
          </div>

          {/* floating chips */}
          <div className="absolute -left-28 top-6 flex items-center gap-2 rounded-md border border-gold/30 bg-card px-3 py-2 shadow-card" style={{ transform: "translateZ(60px)" }}>
            <Landmark size={16} className="text-gold" />
            <div>
              <p className="text-[10px] text-muted-foreground">מכרז בנקים</p>
              <p className="font-ticker text-xs text-foreground">5 הצעות</p>
            </div>
          </div>
          <div className="absolute -right-24 bottom-10 flex items-center gap-2 rounded-md border border-gold/30 bg-card px-3 py-2 shadow-card" style={{ transform: "translateZ(90px)" }}>
            <Clock size={16} className="text-gold" />
            <div>
              <p className="text-[10px] text-muted-foreground">בדיקת תיק</p>
              <p className="font-ticker text-xs text-foreground">עד 72 שעות</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
