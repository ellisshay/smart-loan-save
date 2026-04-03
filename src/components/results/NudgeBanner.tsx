import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NudgeBanner() {
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const savedScore = localStorage.getItem("easymort_score");
    const regTime = localStorage.getItem("easymort_reg_time");
    const dismissed = sessionStorage.getItem("nudge_dismissed");
    const paid = localStorage.getItem("easymort_paid");

    if (savedScore && regTime && !dismissed && !paid) {
      const elapsed = Date.now() - new Date(regTime).getTime();
      // Show nudge after 2 hours
      if (elapsed > 2 * 60 * 60 * 1000) {
        setScore(Number(savedScore));
        setVisible(true);
      }
    }
  }, []);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        exit={{ y: -80 }}
        dir="rtl"
      >
        <div className="container flex items-center justify-between py-3 px-4 gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>הציון שלך ({score}) שמרנו לך – אבל ריביות השוק משתנות.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="secondary"
              className="text-xs gap-1"
              onClick={() => navigate("/results")}
            >
              המשך לשלב הבא <ArrowLeft className="h-3 w-3" />
            </Button>
            <button
              onClick={() => {
                setVisible(false);
                sessionStorage.setItem("nudge_dismissed", "1");
              }}
              className="p-1 hover:bg-primary-foreground/10 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
