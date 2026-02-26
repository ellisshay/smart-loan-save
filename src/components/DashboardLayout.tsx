import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, User, Home as HomeIcon, DollarSign, FileText,
  CreditCard, Shield, Upload, LogOut, ArrowRight, ChevronLeft
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";

const sideLinks = [
  { label: "סקירה כללית", href: "/dashboard", icon: LayoutDashboard },
  { label: "פרטים אישיים", href: "/dashboard/personal", icon: User },
  { label: "נכס ועסקה", href: "/dashboard/property", icon: HomeIcon },
  { label: "הכנסות", href: "/dashboard/income", icon: DollarSign },
  { label: "התחייבויות", href: "/dashboard/liabilities", icon: CreditCard },
  { label: "משכנתא מבוקשת", href: "/dashboard/mortgage", icon: FileText },
  { label: "הצהרות", href: "/dashboard/declarations", icon: Shield },
  { label: "מסמכים", href: "/dashboard/documents", icon: Upload },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).single()
          .then(({ data }) => {
            if (data) setUserName([data.first_name, data.last_name].filter(Boolean).join(" "));
          });
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
          <div className="container flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gold-gradient flex items-center justify-center">
                <span className="font-display font-black text-accent-foreground text-sm">EM</span>
              </div>
              <span className="font-display font-bold text-xl text-foreground">EasyMorte</span>
            </Link>
            <div className="flex items-center gap-3">
              {userName && (
                <span className="text-sm text-muted-foreground hidden sm:block">שלום, {userName}</span>
              )}
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowRight className="h-4 w-4" />
                  לאתר
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          {/* Sidebar — desktop */}
          <aside className="hidden md:flex flex-col w-56 border-l border-border bg-card/50 py-6 px-3 gap-1">
            {sideLinks.map((link) => {
              const active = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <link.icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </aside>

          {/* Mobile nav bar */}
          <div className="md:hidden sticky top-16 z-40 bg-card/80 backdrop-blur-xl border-b border-border overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 p-2">
              {sideLinks.map((link) => {
                const active = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <link.icon size={14} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <main className="flex-1 py-8 px-4 md:px-8 max-w-4xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
