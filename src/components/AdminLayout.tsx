import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  Briefcase,
  LayoutDashboard,
  ChevronRight,
  ChevronLeft,
  LogOut,
} from "lucide-react";

const sidebarLinks = [
  { label: "לוח בקרה", href: "/admin", icon: LayoutDashboard },
  { label: "ניהול תיקים", href: "/admin/cases", icon: Briefcase },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (href: string) =>
    href === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(href);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={`sticky top-0 h-screen bg-card border-l border-border flex flex-col transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-border">
          {!collapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
                <span className="font-display font-black text-accent-foreground text-xs">EM</span>
              </div>
              <span className="font-display font-bold text-foreground">Admin</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          >
            {collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title={collapsed ? link.label : undefined}
            >
              <link.icon size={20} className="shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-border">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={collapsed ? "חזרה לאתר" : undefined}
          >
            <LogOut size={20} className="shrink-0" />
            {!collapsed && <span>חזרה לאתר</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
