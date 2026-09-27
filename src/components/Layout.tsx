import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Calculator, FileText, Phone, Home, Info, Lightbulb, BookOpen, Briefcase, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import FloatingApplyButton from "@/components/FloatingApplyButton";
import AccessibilityWidget from "@/components/AccessibilityWidget";
import ThemeToggle from "@/components/ThemeToggle";
import MarketTicker from "@/components/MarketTicker";
import PublicChatWidget from "@/components/PublicChatWidget";
import speedMarketLogo from "@/assets/credits/speedmarket.png";
import aboutDigitalLogo from "@/assets/credits/aboutdigital.png";

const navLinks = [
  { label: "ראשי", href: "/", icon: Home },
  { label: "אודות", href: "/about", icon: Info },
  { label: "איך זה עובד", href: "/how-it-works", icon: Lightbulb },
  { label: "מחשבונים", href: "/calculators", icon: Calculator },
  { label: "משכנתאפדיה", href: "/knowledge", icon: BookOpen },
  { label: "מחירים", href: "/pricing", icon: FileText },
  { label: "ליועצים", href: "/for-advisors", icon: Briefcase },
  { label: "צור קשר", href: "/contact", icon: Phone },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const raw = window.localStorage.getItem(
          `sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`
        );
        const token = raw ? JSON.parse(raw)?.access_token : null;
        if (!token) { if (active) setIsAdmin(false); return; }
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/is_admin`,
          {
            method: "POST",
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: "{}",
          }
        );
        const result = res.ok ? await res.json() : false;
        if (active) setIsAdmin(result === true);
      } catch {
        if (active) setIsAdmin(false);
      }
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip to content - accessibility */}
      <a href="#main-content" className="skip-to-content">דלג לתוכן הראשי</a>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border" role="banner">
        <MarketTicker />
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Home size={18} className="text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">EASY MORTE</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="gap-1.5 border-primary/40 text-primary">
                  <ShieldCheck size={15} />
                  אזור מנהל
                </Button>
              </Link>
            )}
            <Link to="/my-cases">
              <Button variant="outline" size="sm">האזור שלי</Button>
            </Link>
            <Link to="/calculators">
              <Button variant="cta" size="default">בדוק את המשכנתא שלך</Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted text-foreground"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-card border-b border-border"
            >
              <div className="container py-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === link.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <link.icon size={18} />
                    {link.label}
                  </Link>
                ))}
                <div className="pt-2 space-y-2">
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-primary/10 text-primary">
                      <ShieldCheck size={18} />
                      אזור מנהל
                    </Link>
                  )}
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Link to="/calculators" onClick={() => setMobileOpen(false)} className="flex-1">
                      <Button variant="cta" className="w-full">בדוק את המשכנתא שלך</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main */}
      <main id="main-content" className="flex-1" role="main">{children}</main>
      <FloatingApplyButton />

      {/* Floating widgets */}
      <FloatingWhatsApp />
      <AccessibilityWidget />

      {/* Footer */}
      <footer className="bg-navy text-primary-foreground" role="contentinfo">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
                  <span className="font-display font-black text-accent-foreground text-xs">EM</span>
                </div>
                <span className="font-display font-bold text-lg">EASY MORTE</span>
              </div>
              <p className="text-sm text-primary-foreground/70 leading-relaxed">
                חוסכים לישראלים אלפי שקלים במשכנתא. ניתוח מקצועי, תמהילים חכמים, תוצאות מיידיות.
              </p>
            </div>
            <div>
              <h4 className="font-display font-bold mb-3">מחשבונים</h4>
              <div className="space-y-2 text-sm text-primary-foreground/70">
                <Link to="/calculators/waste" className="block hover:text-primary-foreground transition-colors">מדד בזבוז משכנתא</Link>
                <Link to="/calculators/refinance" className="block hover:text-primary-foreground transition-colors">סימולטור מיחזור</Link>
                <Link to="/calculators/mix" className="block hover:text-primary-foreground transition-colors">השוואת תמהילים</Link>
              </div>
            </div>
            <div>
              <h4 className="font-display font-bold mb-3">החברה</h4>
              <div className="space-y-2 text-sm text-primary-foreground/70">
                <Link to="/pricing" className="block hover:text-primary-foreground transition-colors">מחירים</Link>
                <Link to="/contact" className="block hover:text-primary-foreground transition-colors">צור קשר</Link>
              </div>
            </div>
            <div>
              <h4 className="font-display font-bold mb-3">משפטי</h4>
              <div className="space-y-2 text-sm text-primary-foreground/70">
                <Link to="/legal/terms" className="block hover:text-primary-foreground transition-colors">תנאי שימוש</Link>
                <Link to="/legal/privacy" className="block hover:text-primary-foreground transition-colors">מדיניות פרטיות</Link>
                <Link to="/legal/accessibility" className="block hover:text-primary-foreground transition-colors">נגישות</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-primary-foreground/10 mt-8 pt-6 space-y-3 text-center">
            <p className="text-xs text-primary-foreground/50">
              © {new Date().getFullYear()} EASY MORTE. כל הזכויות שמורות.
            </p>
            <div className="flex flex-col items-center gap-2.5 pt-1">
              <a
                href="https://www.speedmarket.co.il"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-300"
              >
                <span className="inline-flex items-center justify-center h-6 px-1.5 rounded-md bg-black/40 group-hover:bg-black/60 transition-colors duration-300">
                  <img
                    src={speedMarketLogo}
                    alt="ספיד מרקט"
                    style={{ mixBlendMode: "screen" }}
                    className="h-4 w-auto transition-all duration-300"
                  />
                </span>
                <span className="group-hover:tracking-wide transition-all duration-300">האתר נבנה על ידי ספיד מרקט</span>
              </a>
              <a
                href="https://www.aboutdigital.co.il"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-300"
              >
                <span className="inline-flex items-center justify-center h-6 px-1.5 rounded-md bg-black/40 group-hover:bg-black/60 transition-colors duration-300">
                  <img
                    src={aboutDigitalLogo}
                    alt="About Digital"
                    style={{ mixBlendMode: "screen" }}
                    className="h-4 w-auto transition-all duration-300"
                  />
                </span>
                <span className="group-hover:tracking-wide transition-all duration-300">האתר מקודם בגוגל ומנועי החיפוש על ידי About Digital</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
      <PublicChatWidget />
    </div>
  );
}
