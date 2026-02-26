import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Shield, Zap,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

interface MixTrack {
  type: string;
  label: string;
  percentage: number;
  rate: string;
}

interface Mix {
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  tracks: MixTrack[];
  initialPayment: number;
  totalCost: number;
  primeSensitivity: string;
  indexSensitivity: string;
  riskScore: number;
}

const MIXES: Mix[] = [
  {
    name: "שמרני",
    icon: Shield,
    color: "text-primary",
    description: "יציבות מקסימלית, רוב המסלולים בריבית קבועה",
    tracks: [
      { type: "fixed_unlinked", label: "קבועה לא צמודה", percentage: 40, rate: "4.2%" },
      { type: "fixed_linked", label: "קבועה צמודה", percentage: 30, rate: "2.8%" },
      { type: "prime", label: "פריים", percentage: 20, rate: "P+0.9%" },
      { type: "variable_5", label: "משתנה כל 5", percentage: 10, rate: "3.9%" },
    ],
    initialPayment: 4850,
    totalCost: 1420000,
    primeSensitivity: "נמוכה (20%)",
    indexSensitivity: "בינונית (30%)",
    riskScore: 25,
  },
  {
    name: "מאוזן",
    icon: BarChart3,
    color: "text-gold",
    description: "איזון בין יציבות לחיסכון, תמהיל מגוון",
    tracks: [
      { type: "fixed_unlinked", label: "קבועה לא צמודה", percentage: 25, rate: "4.2%" },
      { type: "fixed_linked", label: "קבועה צמודה", percentage: 20, rate: "2.8%" },
      { type: "prime", label: "פריים", percentage: 33, rate: "P+0.7%" },
      { type: "variable_5", label: "משתנה כל 5", percentage: 22, rate: "3.6%" },
    ],
    initialPayment: 4620,
    totalCost: 1350000,
    primeSensitivity: "בינונית (33%)",
    indexSensitivity: "בינונית (20%)",
    riskScore: 50,
  },
  {
    name: "אגרסיבי",
    icon: Zap,
    color: "text-destructive",
    description: "חיסכון מקסימלי, חשיפה גבוהה לשינויים",
    tracks: [
      { type: "prime", label: "פריים", percentage: 50, rate: "P+0.5%" },
      { type: "variable_5", label: "משתנה כל 5", percentage: 30, rate: "3.4%" },
      { type: "fixed_unlinked", label: "קבועה לא צמודה", percentage: 15, rate: "4.2%" },
      { type: "fixed_linked", label: "קבועה צמודה", percentage: 5, rate: "2.8%" },
    ],
    initialPayment: 4250,
    totalCost: 1280000,
    primeSensitivity: "גבוהה (50%)",
    indexSensitivity: "נמוכה (5%)",
    riskScore: 78,
  },
];

export default function MixSelectionPage() {
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (mixName: string) => {
    if (!caseId) return;
    setLoading(true);
    try {
      await supabase
        .from("cases")
        .update({ selected_mix: mixName, status: "SentToBank" as any })
        .eq("id", caseId);

      await supabase.functions.invoke("webhook-handler", {
        body: { event_name: "mix_selected", case_id: caseId, payload: { mix: mixName } },
      });

      toast({ title: `בחרת בתמהיל ${mixName}! 🎯` });
      navigate("/my-cases");
    } catch (error) {
      toast({ title: "שגיאה", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="font-display text-3xl font-black text-foreground mb-2">בחירת תמהיל</h1>
          <p className="text-muted-foreground">3 תמהילים מותאמים אישית — בחר את המתאים ביותר עבורך</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {MIXES.map((mix, i) => (
            <motion.div
              key={mix.name}
              className={`bg-card rounded-2xl border-2 p-6 transition-all cursor-pointer ${
                selected === mix.name
                  ? "border-gold shadow-gold"
                  : "border-border hover:border-gold/30"
              }`}
              onClick={() => setSelected(mix.name)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`${mix.color}`}>
                  <mix.icon size={28} />
                </div>
                <div>
                  <h3 className="font-display text-xl font-black text-foreground">{mix.name}</h3>
                  <p className="text-xs text-muted-foreground">{mix.description}</p>
                </div>
              </div>

              {/* Tracks */}
              <div className="space-y-2 mb-5">
                {mix.tracks.map((track) => (
                  <div key={track.type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gold" />
                      <span className="text-foreground">{track.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{track.percentage}%</span>
                      <span className="font-mono text-xs text-foreground" dir="ltr">{track.rate}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bar visualization */}
              <div className="h-3 rounded-full overflow-hidden flex mb-5">
                {mix.tracks.map((track, j) => (
                  <div
                    key={j}
                    className={`h-full ${
                      j === 0 ? "bg-primary" : j === 1 ? "bg-gold" : j === 2 ? "bg-success" : "bg-muted-foreground"
                    }`}
                    style={{ width: `${track.percentage}%` }}
                  />
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-muted rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block">החזר התחלתי</span>
                  <span className="font-display font-black text-foreground">₪{mix.initialPayment.toLocaleString()}</span>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block">עלות כוללת</span>
                  <span className="font-display font-black text-foreground">₪{mix.totalCost.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">רגישות לפריים</span>
                  <span className="text-foreground">{mix.primeSensitivity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">רגישות למדד</span>
                  <span className="text-foreground">{mix.indexSensitivity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ציון סיכון</span>
                  <span className={`font-bold ${mix.riskScore > 60 ? "text-destructive" : mix.riskScore > 40 ? "text-warning" : "text-success"}`}>
                    {mix.riskScore}/100
                  </span>
                </div>
              </div>

              {selected === mix.name && (
                <motion.div
                  className="mt-4 flex items-center justify-center gap-2 text-gold font-bold text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <CheckCircle2 size={16} />
                  נבחר
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {selected && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="cta"
              size="xl"
              onClick={() => handleSelect(selected)}
              disabled={loading}
            >
              {loading ? "שולח..." : `בחר תמהיל ${selected}`}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
