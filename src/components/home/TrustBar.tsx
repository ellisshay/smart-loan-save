import { motion } from "framer-motion";
import { Shield, Lock, BadgeCheck, Landmark } from "lucide-react";

const badges = [
  { icon: Shield, label: "מוסדר ע\"י רשות שוק ההון" },
  { icon: Lock, label: "הצפנת SSL 256-bit" },
  { icon: BadgeCheck, label: "יועצים מורשים בלבד" },
  { icon: Landmark, label: "עמידה בתקני פרטיות" },
];

export default function TrustBar() {
  return (
    <section className="py-10 bg-muted/40 border-y border-border">
      <div className="container">
        <motion.div
          className="flex flex-wrap items-center justify-center gap-8 md:gap-14"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {badges.map((badge) => (
            <div key={badge.label} className="flex items-center gap-2.5 text-muted-foreground">
              <badge.icon size={20} className="text-gold" />
              <span className="text-sm font-medium">{badge.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
