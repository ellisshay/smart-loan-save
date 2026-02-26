import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container max-w-4xl">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4">
            צור קשר
          </h1>
          <p className="text-lg text-muted-foreground">יש שאלות? נשמח לעזור.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                <Phone className="text-gold" size={20} />
              </div>
              <div>
                <div className="font-semibold text-foreground">טלפון</div>
                <div className="text-sm text-muted-foreground" dir="ltr">03-1234567</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                <Mail className="text-gold" size={20} />
              </div>
              <div>
                <div className="font-semibold text-foreground">אימייל</div>
                <div className="text-sm text-muted-foreground">info@easymortgage.co.il</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                <MapPin className="text-gold" size={20} />
              </div>
              <div>
                <div className="font-semibold text-foreground">כתובת</div>
                <div className="text-sm text-muted-foreground">תל אביב, ישראל</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {sent ? (
              <div className="bg-success/10 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-display font-bold text-xl text-foreground mb-2">ההודעה נשלחה!</h3>
                <p className="text-muted-foreground text-sm">ניצור איתך קשר בהקדם.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 bg-card rounded-2xl p-6 shadow-card">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">שם מלא</label>
                  <input required className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">טלפון</label>
                  <input required type="tel" className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">אימייל</label>
                  <input required type="email" className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">הודעה</label>
                  <textarea required rows={4} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                <Button variant="cta" size="lg" className="w-full" type="submit">
                  שלח הודעה
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
