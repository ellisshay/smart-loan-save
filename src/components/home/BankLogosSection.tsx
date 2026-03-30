import { motion } from "framer-motion";
import { Landmark } from "lucide-react";

const banks = [
  { name: "בנק לאומי", color: "from-[hsl(210_80%_45%)] to-[hsl(210_70%_35%)]" },
  { name: "בנק הפועלים", color: "from-[hsl(0_75%_50%)] to-[hsl(0_65%_40%)]" },
  { name: "בנק דיסקונט", color: "from-[hsl(25_85%_50%)] to-[hsl(25_75%_40%)]" },
  { name: "בנק מזרחי טפחות", color: "from-[hsl(145_60%_38%)] to-[hsl(145_50%_28%)]" },
  { name: "בנק הבינלאומי", color: "from-[hsl(220_65%_50%)] to-[hsl(220_55%_40%)]" },
  { name: "בנק ירושלים", color: "from-[hsl(35_70%_50%)] to-[hsl(35_60%_40%)]" },
];

export default function BankLogosSection() {
  return (
    <section className="py-12 md:py-16 bg-muted/30 border-b border-border">
      <div className="container">
        <motion.p
          className="text-center text-sm font-medium text-muted-foreground mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          הצעות מכל הבנקים המובילים בישראל
        </motion.p>

        <motion.div
          className="flex flex-wrap items-center justify-center gap-4 md:gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {banks.map((bank, i) => (
            <motion.div
              key={bank.name}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-card border border-border shadow-sm hover:shadow-md hover:border-gold/20 transition-all duration-300"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${bank.color} flex items-center justify-center`}>
                <Landmark size={16} className="text-white" />
              </div>
              <span className="font-display font-bold text-sm text-foreground whitespace-nowrap">
                {bank.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
