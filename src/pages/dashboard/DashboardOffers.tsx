import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { MessageCircle, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardOffers() {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Get leads for current user
  const { data: leads = [] } = useQuery({
    queryKey: ["my-leads", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("leads" as any)
        .select("*")
        .eq("client_id", user!.id);
      return (data || []) as any[];
    },
  });

  const leadIds = leads.map((l: any) => l.id);

  // Get offers on my leads
  const { data: offers = [] } = useQuery({
    queryKey: ["my-lead-offers", leadIds],
    enabled: leadIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("offers" as any)
        .select("*")
        .in("lead_id", leadIds)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const comparedOffers = offers.filter((o: any) => compareIds.includes(o.id));

  if (offers.length === 0) {
    return (
      <div className="text-center py-16">
        <Clock className="mx-auto mb-4 text-muted-foreground/40" size={56} />
        <h2 className="font-display text-xl font-bold text-foreground mb-2">ממתינים להצעות</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          הפרופיל שלך נשלח ל-5 יועצים מורשים. בדרך כלל ההצעות מגיעות תוך 48 שעות.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-black text-foreground mb-1">הצעות שהתקבלו</h2>
        <p className="text-muted-foreground text-sm">סמן עד 3 הצעות להשוואה</p>
      </div>

      {/* Offer cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer: any, i: number) => (
          <motion.div
            key={offer.id}
            className={`bg-card rounded-2xl p-6 border shadow-card transition-colors ${
              compareIds.includes(offer.id) ? "border-gold ring-2 ring-gold/20" : "border-border hover:border-gold/20"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">{offer.bank_name}</h3>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                offer.status === "accepted" ? "bg-success/10 text-success" :
                offer.status === "viewed" ? "bg-warning/10 text-warning" :
                "bg-muted text-muted-foreground"
              }`}>
                {offer.status === "pending" ? "חדש" : offer.status === "viewed" ? "נצפה" : offer.status === "accepted" ? "נבחר" : offer.status}
              </span>
            </div>

            <div className="text-3xl font-display font-black text-gold mb-1">
              ₪{offer.monthly_payment?.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mb-4">החזר חודשי</div>

            <div className="space-y-2 text-sm border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ריבית</span>
                <span className="font-semibold text-foreground">{offer.interest_rate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">מסלול</span>
                <span className="font-semibold text-foreground">{offer.track_type}</span>
              </div>
              {offer.total_cost && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">עלות כוללת</span>
                  <span className="font-semibold text-foreground">₪{offer.total_cost?.toLocaleString()}</span>
                </div>
              )}
              {offer.advisor_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">עמלת יועץ</span>
                  <span className="font-semibold text-foreground">₪{offer.advisor_fee?.toLocaleString()}</span>
                </div>
              )}
              {offer.validity_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">תוקף</span>
                  <span className="font-semibold text-foreground">{new Date(offer.validity_date).toLocaleDateString("he-IL")}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <Button
                variant={compareIds.includes(offer.id) ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => toggleCompare(offer.id)}
              >
                <Check size={14} />
                {compareIds.includes(offer.id) ? "נבחר" : "השווה"}
              </Button>
              <Button variant="cta" size="sm" className="flex-1" asChild>
                <a href={`https://wa.me/?text=שלום, אשמח לפרטים נוספים על ההצעה מ-${offer.bank_name}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={14} />
                  צור קשר
                </a>
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Comparison table */}
      {comparedOffers.length >= 2 && (
        <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
          <h3 className="font-display text-xl font-bold text-foreground mb-4">השוואת הצעות</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right py-3 pr-4 text-muted-foreground font-medium">פרמטר</th>
                  {comparedOffers.map((o: any) => (
                    <th key={o.id} className="text-center py-3 font-display font-bold text-foreground">{o.bank_name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {([
                  { label: "החזר חודשי", key: "monthly_payment", format: (v: any) => `₪${v?.toLocaleString()}` },
                  { label: "ריבית", key: "interest_rate", format: (v: any) => `${v}%` },
                  { label: "מסלול", key: "track_type", format: (v: any) => v },
                  { label: "עלות כוללת", key: "total_cost", format: (v: any) => v ? `₪${v?.toLocaleString()}` : "—" },
                  { label: "עמלת יועץ", key: "advisor_fee", format: (v: any) => v ? `₪${v?.toLocaleString()}` : "₪0" },
                ] as { label: string; key: string; format: (v: any) => string }[]).map((row) => (
                  <tr key={row.label} className="border-b border-border/50">
                    <td className="py-3 pr-4 text-muted-foreground">{row.label}</td>
                    {comparedOffers.map((o: any) => (
                      <td key={o.id} className="text-center py-3 font-semibold text-foreground">{row.format(o[row.key])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
