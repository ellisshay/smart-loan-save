import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  // Pages are prerendered: the first render must match the server HTML, so the saved preference is read after mount.
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem("theme"); } catch { /* storage blocked */ }
    setDark(stored ? stored === "dark" : window.matchMedia?.("(prefers-color-scheme: dark)").matches === true);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return; // never overwrite the saved preference with the initial default
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch { /* storage blocked */ }
  }, [dark, ready]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDark(!dark)}
      aria-label={dark ? "עבור למצב בהיר" : "עבור למצב כהה"}
      className="h-9 w-9 text-muted-foreground hover:text-foreground"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
