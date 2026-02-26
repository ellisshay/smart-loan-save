import { useState, useEffect, useCallback } from "react";
import { Accessibility, X, Type, Moon, Contrast, MousePointer, Link2, ZoomIn, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

interface A11ySettings {
  fontSize: number; // 0 = normal, 1 = large, 2 = xlarge
  highContrast: boolean;
  darkMode: boolean;
  highlightLinks: boolean;
  bigCursor: boolean;
  readableFont: boolean;
}

const defaultSettings: A11ySettings = {
  fontSize: 0,
  highContrast: false,
  darkMode: false,
  highlightLinks: false,
  bigCursor: false,
  readableFont: false,
};

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(() => {
    try {
      const saved = localStorage.getItem("a11y-settings");
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const applySettings = useCallback((s: A11ySettings) => {
    const root = document.documentElement;
    const body = document.body;

    // Font size
    const sizes = ["100%", "115%", "130%"];
    root.style.fontSize = sizes[s.fontSize];

    // High contrast
    if (s.highContrast) {
      body.classList.add("a11y-high-contrast");
    } else {
      body.classList.remove("a11y-high-contrast");
    }

    // Dark mode
    if (s.darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Highlight links
    if (s.highlightLinks) {
      body.classList.add("a11y-highlight-links");
    } else {
      body.classList.remove("a11y-highlight-links");
    }

    // Big cursor
    if (s.bigCursor) {
      body.classList.add("a11y-big-cursor");
    } else {
      body.classList.remove("a11y-big-cursor");
    }

    // Readable font
    if (s.readableFont) {
      body.classList.add("a11y-readable-font");
    } else {
      body.classList.remove("a11y-readable-font");
    }
  }, []);

  useEffect(() => {
    applySettings(settings);
    localStorage.setItem("a11y-settings", JSON.stringify(settings));
  }, [settings, applySettings]);

  const toggle = (key: keyof A11ySettings) => {
    setSettings((prev) => {
      if (key === "fontSize") {
        return { ...prev, fontSize: (prev.fontSize + 1) % 3 };
      }
      return { ...prev, [key]: !prev[key] };
    });
  };

  const reset = () => {
    setSettings(defaultSettings);
  };

  const buttons = [
    { key: "fontSize" as const, label: "הגדלת טקסט", icon: Type, active: settings.fontSize > 0, desc: ["רגיל", "גדול", "גדול מאוד"][settings.fontSize] },
    { key: "highContrast" as const, label: "ניגודיות גבוהה", icon: Contrast, active: settings.highContrast },
    { key: "darkMode" as const, label: "מצב כהה", icon: Moon, active: settings.darkMode },
    { key: "highlightLinks" as const, label: "הדגשת קישורים", icon: Link2, active: settings.highlightLinks },
    { key: "bigCursor" as const, label: "סמן גדול", icon: MousePointer, active: settings.bigCursor },
    { key: "readableFont" as const, label: "גופן קריא", icon: ZoomIn, active: settings.readableFont },
  ];

  return (
    <>
      {/* Floating accessibility button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="פתח תפריט נגישות"
        className="fixed bottom-24 left-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 hover:shadow-xl"
      >
        <Accessibility size={28} />
      </button>

      {/* Accessibility panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 md:bottom-auto md:left-6 md:right-auto md:top-1/2 md:-translate-y-1/2 md:w-80 z-50 bg-card rounded-t-2xl md:rounded-2xl shadow-2xl border border-border max-h-[80vh] overflow-y-auto"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                    <Accessibility size={20} className="text-primary" />
                    הגדרות נגישות
                  </h2>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="סגור תפריט נגישות"
                    className="p-1 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-2">
                  {buttons.map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => toggle(btn.key)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-right transition-colors ${
                        btn.active
                          ? "bg-primary/10 border border-primary/20 text-primary"
                          : "bg-muted/50 border border-transparent text-foreground hover:bg-muted"
                      }`}
                    >
                      <btn.icon size={20} />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{btn.label}</div>
                        {btn.desc && (
                          <div className="text-xs text-muted-foreground">{btn.desc}</div>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          btn.active ? "border-primary bg-primary" : "border-muted-foreground/30"
                        }`}
                      >
                        {btn.active && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={reset}
                  className="w-full mt-4 flex items-center justify-center gap-2 p-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
                >
                  <RotateCcw size={16} />
                  איפוס הגדרות
                </button>

                <div className="mt-4 pt-4 border-t border-border">
                  <Link
                    to="/legal/accessibility"
                    onClick={() => setOpen(false)}
                    className="text-sm text-primary hover:underline"
                  >
                    הצהרת נגישות מלאה →
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
