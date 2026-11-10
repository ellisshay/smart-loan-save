import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** What actually happened. "saved" and "emailed" are separate: never claim an email that was not sent. */
type Status = "idle" | "sending" | "sent" | "saved_only" | "invalid" | "rate_limited" | "error";

const newRequestId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16));

export default function ContactPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "", website: "" });
  // One id per form: a double click or a retry after an error never creates a second message or email.
  const requestId = useRef(newRequestId());
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    const { data, error } = await supabase.functions.invoke("contact-message", {
      body: { ...form, request_id: requestId.current },
    });
    let result = data as { saved?: boolean; emailed?: boolean; error?: string } | null;
    if (error) {
      // Non-2xx responses carry the server's reason in the response body.
      const ctx = (error as { context?: Response }).context;
      result = ctx && typeof ctx.json === "function" ? await ctx.json().catch(() => null) : null;
    }
    if (result?.saved && result.emailed) setStatus("sent");
    else if (result?.saved) setStatus("saved_only");
    else if (result?.error === "invalid") setStatus("invalid");
    else if (result?.error === "rate_limited") setStatus("rate_limited");
    else setStatus("error");
  };

  const done = status === "sent" || status === "saved_only";
  const fieldClass = "w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";

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
                <div className="text-sm text-muted-foreground" dir="ltr">055-996-1997</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                <Mail className="text-gold" size={20} />
              </div>
              <div>
                <div className="font-semibold text-foreground">אימייל</div>
                <div className="text-sm text-muted-foreground">info@easymorte.co.il</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                <MapPin className="text-gold" size={20} />
              </div>
              <div>
                <div className="font-semibold text-foreground">כתובת</div>
                <div className="text-sm text-muted-foreground">טרומפלדור 11, כפר סבא</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {done ? (
              <div role="status" className="bg-success/10 rounded-2xl p-8 text-center">
                <h3 className="font-display font-bold text-xl text-foreground mb-2">
                  {status === "sent" ? "ההודעה התקבלה ונשלחה לצוות" : "ההודעה נשמרה אצלנו"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {status === "sent"
                    ? "ניצור איתך קשר בהקדם."
                    : "ההודעה שמורה וניצור איתך קשר. אם זה דחוף, אפשר להתקשר ל-055-996-1997."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative space-y-4 bg-card rounded-2xl p-6 shadow-card">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-foreground mb-2">שם מלא</label>
                  <input id="contact-name" name="name" required minLength={2} maxLength={120} autoComplete="name" value={form.name} onChange={set("name")} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-foreground mb-2">טלפון</label>
                  <input id="contact-phone" name="phone" required type="tel" dir="ltr" pattern="[0-9+()\-\s]{9,20}" maxLength={20} autoComplete="tel" value={form.phone} onChange={set("phone")} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-foreground mb-2">אימייל</label>
                  <input id="contact-email" name="email" required type="email" dir="ltr" maxLength={160} autoComplete="email" value={form.email} onChange={set("email")} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-foreground mb-2">הודעה</label>
                  <textarea id="contact-message" name="message" required minLength={2} maxLength={4000} rows={4} value={form.message} onChange={set("message")} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                {/* Honeypot: hidden from people, filled by bots. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label>אתר<input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} /></label>
                </div>
                {status === "invalid" && <p role="alert" className="text-sm text-destructive">נא לבדוק את השדות: שם, טלפון (לפחות 9 ספרות), אימייל והודעה.</p>}
                {status === "rate_limited" && <p role="alert" className="text-sm text-destructive">נשלחו יותר מדי פניות בזמן קצר. נסו שוב בעוד שעה או התקשרו ל-055-996-1997.</p>}
                {status === "error" && <p role="alert" className="text-sm text-destructive">ההודעה לא נשלחה ולא נשמרה. נסו שוב, או התקשרו ל-055-996-1997.</p>}
                <Button variant="cta" size="lg" className="w-full" type="submit" disabled={status === "sending"}>
                  {status === "sending" ? "שולח…" : "שלח הודעה"}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
