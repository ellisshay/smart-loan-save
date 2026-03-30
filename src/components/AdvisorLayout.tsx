import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, FileText, User, LogOut, LayoutDashboard } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { label: "דשבורד", href: "/advisor", icon: LayoutDashboard },
];

export default function AdvisorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-l border-border flex flex-col shrink-0">
        <div className="p-5 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
              <span className="font-display font-black text-accent-foreground text-xs">EM</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground">EasyMorte</span>
          </Link>
          <p className="text-xs text-gold font-semibold mt-1">פאנל יועץ</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center">
              <User size={14} className="text-gold" />
            </div>
            <div className="text-sm truncate">
              <div className="font-medium text-foreground truncate">{user?.email}</div>
              <div className="text-xs text-muted-foreground">יועץ</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2">
            <ThemeToggle />
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted w-full"
            >
              <LogOut size={16} /> התנתק
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
