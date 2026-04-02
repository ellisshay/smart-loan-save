import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, User, Home as HomeIcon, DollarSign, FileText,
  CreditCard, Shield, Upload, LogOut, ArrowRight, CreditCard as PayIcon, Gift
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import ExitIntentModal from "@/components/ExitIntentModal";
import AIMortgageChat from "@/components/AIMortgageChat";

const sideLinks = [
  { label: "סקירה כללית", href: "/dashboard", icon: LayoutDashboard },
  { label: "פרטים אישיים", href: "/dashboard/personal", icon: User },
  { label: "נכס ועסקה", href: "/dashboard/property", icon: HomeIcon },
  { label: "הכנסות", href: "/dashboard/income", icon: DollarSign },
  { label: "התחייבויות", href: "/dashboard/liabilities", icon: CreditCard },
  { label: "משכנתא מבוקשת", href: "/dashboard/mortgage", icon: FileText },
  { label: "הצהרות", href: "/dashboard/declarations", icon: Shield },
  { label: "מסמכים", href: "/dashboard/documents", icon: Upload },
  { label: "תשלום", href: "/dashboard/payment", icon: PayIcon },
  { label: "הצעות", href: "/dashboard/offers", icon: Gift },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).single()
          .then(({ data }) => {
            if (data) setUserName([data.first_name, data.last_name].filter(Boolean).join(" "));
          });
        // Load progress for exit intent
        supabase.from("cases").select("intake_data").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single()
          .then(({ data }) => {
            if (data) {
              const intakeData = (data.intake_data as Record<string, any>) || {};
              const keys = ["personal", "property", "income", "liabilities", "mortgage_request", "declarations", "documents"];
              const done = keys.filter(k => intakeData[k] && Object.keys(intakeData[k]).length > 0).length;
              setProgress(Math.round((done / keys.length) * 100));
            }
          });
      }
    });
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isDashboardStep = location.pathname !== "/dashboard" && location.pathname.startsWith("/dashboard/");

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
          <div className="container flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--gold-gradient)] flex items-center justify-center">
                <span className="font-display font-black text-accent-foreground text-xs">EM</span>
              </div>
              <span className="font-display font-bold text-lg text-foreground">EasyMorte</span>
            </Link>
            <div className="flex items-center gap-2">
              {userName && <span className="text-xs text-muted-foreground hidden sm:block">שלום, {userName}</span>}
              <Link to="/"><Button variant="outline" size="sm" className="text-xs h-8"><ArrowRight className="h-3 w-3" />לאתר</Button></Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8"><LogOut className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          {/* Sidebar */}
          <aside className="hidden md:flex flex-col w-52 border-l border-border bg-card/50 py-4 px-2 gap-0.5">
            {sideLinks.map((link) => {
              const active = location.pathname === link.href;
              return (
                <Link key={link.href} to={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}>
                  <link.icon size={14} />
                  {link.label}
                </Link>
              );
            })}
          </aside>

          {/* Mobile nav */}
          <div className="md:hidden sticky top-14 z-40 bg-card/80 backdrop-blur-xl border-b border-border overflow-x-auto scrollbar-hide">
            <div className="flex gap-0.5 p-1.5">
              {sideLinks.map((link) => {
                const active = location.pathname === link.href;
                return (
                  <Link key={link.href} to={link.href}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors ${
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}>
                    <link.icon size={12} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <main className="flex-1 py-6 px-4 md:px-8 max-w-4xl mx-auto w-full">
            {/* Micro-commitment banner on step pages */}
            {isDashboardStep && location.pathname !== "/dashboard/payment" && (
              <div className="mb-4 text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/30 rounded-lg px-3 py-2">
                ⏱ תוך 90 שניות מסיימים את השלב הזה
              </div>
            )}
            <Outlet />
          </main>
        </div>

        {/* Exit intent modal */}
        <ExitIntentModal progress={progress} enabled={progress > 0 && progress < 85} />
        <AIMortgageChat />
      </div>
    </AuthGuard>
  );
}
