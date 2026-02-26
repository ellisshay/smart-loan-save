import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";

interface Props {
  progress: number;
  enabled?: boolean;
}

export default function ExitIntentModal({ progress, enabled = true }: Props) {
  const [open, setOpen] = useState(false);
  const shownRef = useRef(false);
  const location = useLocation();

  const handleExitIntent = useCallback(() => {
    if (shownRef.current || !enabled || progress >= 85) return;
    shownRef.current = true;
    setOpen(true);
  }, [enabled, progress]);

  useEffect(() => {
    // Reset on route change
    shownRef.current = false;
  }, [location.pathname]);

  useEffect(() => {
    if (!enabled || progress >= 85) return;

    // Mouse leave (desktop)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) handleExitIntent();
    };

    // Visibility change (tab switch)
    const handleVisibility = () => {
      if (document.hidden) handleExitIntent();
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [handleExitIntent, enabled, progress]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center">
              <AlertTriangle size={28} className="text-warning" />
            </div>
          </div>
          <DialogTitle className="font-display text-xl">
            רגע, התיק שלך הושלם רק ב-{progress}%
          </DialogTitle>
          <DialogDescription className="text-sm mt-2">
            כדי לקבל תמהיל תוך 48 שעות צריך להגיע ל-85%
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button variant="cta" size="lg" onClick={() => setOpen(false)}>
            המשך השלמה
            <ArrowLeft size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-muted-foreground">
            אשמור להמשך
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
