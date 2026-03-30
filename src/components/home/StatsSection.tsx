import { motion } from "framer-motion";
import { Users, TrendingDown, Clock, Award } from "lucide-react";
import { useCountUp } from "./useCountUp";

const stats = [
  { icon: Users, value: 4200, suffix: "+", label: "לקוחות מרוצים", prefix: "" },
  { icon: TrendingDown, value: 847, suffix: "K", label: "חיסכון ממוצע ₪", prefix: "₪" },
  { icon: Clock, value: 48, suffix: "h", label: "זמן ממוצע לקבלת הצעות", prefix: "" },
  { icon: Award, value: 120, suffix: "+", label: "יועצים מורשים", prefix: "" },
];

function StatCard({ stat, index }: { stat: typeof stats[0]; index: number }) {
  const { count, ref } = useCountUp(stat.value, 2200);

  return (
    <motion.div
      ref={ref}
      className="text-center"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12 }}
    >
      <div className="w-16 h-16 rounded-2xl bg-gold/15 flex items-center justify-center mx-auto mb-4">
        <stat.icon className="text-gold" size={28} />
      </div>
      <div className="font-display text-4xl md:text-5xl font-black text-white mb-1">
        {stat.prefix}{count.toLocaleString()}{stat.suffix}
      </div>
      <div className="text-white/50 text-sm font-medium">{stat.label}</div>
    </motion.div>
  );
}

export default function StatsSection() {
  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(215_50%_8%)] via-[hsl(215_45%_12%)] to-[hsl(215_40%_16%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[150px]" />

      <div className="container relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
