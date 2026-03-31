import { motion } from "framer-motion";
import leumiLogo from "@/assets/banks/leumi.png";
import hapoalimLogo from "@/assets/banks/hapoalim.png";
import discountLogo from "@/assets/banks/discount.png";
import mizrahiLogo from "@/assets/banks/mizrahi.png";
import beinleumiLogo from "@/assets/banks/beinleumi.png";

const banks = [
  { name: "בנק הפועלים", logo: hapoalimLogo },
  { name: "בנק לאומי", logo: leumiLogo },
  { name: "בנק דיסקונט", logo: discountLogo },
  { name: "בנק מזרחי טפחות", logo: mizrahiLogo },
  { name: "הבנק הבינלאומי", logo: beinleumiLogo },
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
          className="flex flex-wrap items-center justify-center gap-6 md:gap-10 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {banks.map((bank, i) => (
            <motion.div
              key={bank.name}
              className="flex items-center justify-center h-14 px-4 grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
            >
              <img
                src={bank.logo}
                alt={bank.name}
                loading="lazy"
                className="h-10 md:h-12 w-auto object-contain"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}