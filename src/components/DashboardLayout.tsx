import { Gavel } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, User, Home as HomeIcon, DollarSign, FileText,
  CreditCard, Shield, Upload, LogOut, ArrowLeft, CreditCard as PayIcon, Gift
} from "lucide-react";
import Layout from "@/components/Layout";
import AuthGuard from "@/components/AuthGuard";
import ExitIntentModal from "@/components/ExitIntentModal";
import AIMortgageChat from "@/components/AIMortgageChat";
import ConsentGate from "@/components/privacy/ConsentGate";

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
  { label: "מכרז המשכנתא שלי", href: "/dashboard/tender", icon: Gavel },
  { label: "הפרטיות שלי", href: "/dashboard/privacy", icon: Shield },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [lastLogin, setLastLogin] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const meta = (user.user_metadata ?? {}) as Record<string, any>;
        supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).maybeSingle()
          .then(({ data }) => {
            const first =
              data?.first_name?.trim() ||
              meta.first_name ||
              (typeof meta.full_name === "string" ? meta.full_name.split(" ")[0] : "") ||
              (user.email ? user.email.split("@")[0] : "");
            setUserName(first || "");
          });
        if (user.last_sign_in_at) {
          setLastLogin(new Date(user.last_sign_in_at).toLocaleString("he-IL", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
          }));
        }
        // Load progress for exit intent
        supabase.from("cases").select("intake_data").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
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
      <Layout>
      <div className="bg-background flex flex-col">
        <div className="border-b border-border bg-card/60">
          <div className="container flex items-center justify-between h-11">
            <span className="text-sm font-medium text-foreground">האזור האישי{userName ? `, שלום ${userName}` : ""}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 text-xs gap-1"><LogOut className="h-3.5 w-3.5" />התנתקות</Button>
          </div>
        </div>
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
          <div className="md:hidden bg-card/80 backdrop-blur-xl border-b border-border overflow-x-auto scrollbar-hide">
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
                תוך 90 שניות מסיימים את השלב הזה
              </div>
            )}
            {location.pathname === "/dashboard/privacy" ? <Outlet /> : <ConsentGate><Outlet /></ConsentGate>}
          </main>
        </div>

        {/* Exit intent modal */}
        <ExitIntentModal progress={progress} enabled={progress > 0 && progress < 85} />
        <AIMortgageChat />
      </div>
      </Layout>
    </AuthGuard>
  );
}
