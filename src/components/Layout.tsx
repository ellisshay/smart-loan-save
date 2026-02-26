import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Calculator, FileText, Phone, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "ראשי", href: "/", icon: Home },
  { label: "מחשבונים", href: "/calculators", icon: Calculator },
  { label: "מחירים", href: "/pricing", icon: FileText },
  { label: "צור קשר", href: "/contact", icon: Phone },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gold-gradient flex items-center justify-center">
              <span className="font-display font-black text-accent-foreground text-sm">EM</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">EasyMorte</span>
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

          <div className="hidden md:flex items-center gap-3">
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
                <div className="pt-2">
                  <Link to="/calculators" onClick={() => setMobileOpen(false)}>
                    <Button variant="cta" className="w-full">בדוק את המשכנתא שלך</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
                  <span className="font-display font-black text-accent-foreground text-xs">EM</span>
                </div>
                <span className="font-display font-bold text-lg">EasyMorte</span>
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
          <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} EasyMorte. כל הזכויות שמורות.
          </div>
        </div>
      </footer>
    </div>
  );
}
