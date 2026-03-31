import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, FileText, Star, CreditCard, MapPin, Home, Wallet, TrendingUp } from "lucide-react";

export default function AdvisorDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["advisor-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Get advisor profile
  const { data: profile } = useQuery({
    queryKey: ["advisor-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("advisor_profiles" as any)
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data as any;
    },
  });

  // Get open leads (marketplace)
  const { data: leads = [] } = useQuery({
    queryKey: ["open-leads"],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("leads" as any)
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  // Get purchased leads
  const { data: purchases = [] } = useQuery({
    queryKey: ["my-purchases", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("lead_purchases" as any)
        .select("*, leads(*)")
        .eq("advisor_id", user!.id)
        .order("purchased_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  // Get my offers
  const { data: myOffers = [] } = useQuery({
    queryKey: ["my-offers", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("offers" as any)
        .select("*, leads(*)")
        .eq("advisor_id", user!.id)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  // Purchase lead mutation
  const purchaseLead = useMutation({
    mutationFn: async (leadId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      if ((profile?.lead_credits || 0) < 1) throw new Error("אין מספיק קרדיטים");

      // Insert purchase
      const { error: purchaseErr } = await supabase
        .from("lead_purchases" as any)
        .insert({ lead_id: leadId, advisor_id: user.id, amount: 200 });
      if (purchaseErr) throw purchaseErr;

      // Deduct credits
      const { error: creditErr } = await supabase
        .from("advisor_profiles" as any)
        .update({ lead_credits: (profile?.lead_credits || 0) - 1 })
        .eq("user_id", user.id);
      if (creditErr) throw creditErr;
    },
    onSuccess: () => {
      toast({ title: "הליד נרכש בהצלחה! 🎉" });
      queryClient.invalidateQueries({ queryKey: ["my-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["advisor-profile"] });
      queryClient.invalidateQueries({ queryKey: ["open-leads"] });
    },
    onError: (err: any) => {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    },
  });

  const offerStatusLabel: Record<string, string> = {
    pending: "ממתין",
    viewed: "נצפה",
    accepted: "נבחר",
    rejected: "נדחה",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black text-foreground">דשבורד יועץ</h1>
          <p className="text-muted-foreground text-sm">ניהול לידים והצעות</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gold/10 text-gold px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
            <CreditCard size={16} />
            {profile?.lead_credits || 0} קרדיטים
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "לידים שנרכשו", value: purchases.length, icon: ShoppingCart },
          { label: "הצעות שהוגשו", value: myOffers.length, icon: FileText },
          { label: "הצעות שנבחרו", value: myOffers.filter((o: any) => o.status === "accepted").length, icon: Star },
          { label: "דירוג", value: profile?.rating || "—", icon: TrendingUp },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl p-4 border border-border shadow-card">
            <stat.icon className="text-gold mb-2" size={20} />
            <div className="text-2xl font-display font-black text-foreground">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="marketplace" dir="rtl">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="marketplace">שוק לידים</TabsTrigger>
          <TabsTrigger value="purchased">לידים שלי</TabsTrigger>
          <TabsTrigger value="offers">הצעות שלי</TabsTrigger>
        </TabsList>

        {/* Marketplace */}
        <TabsContent value="marketplace" className="space-y-4 mt-4">
          {leads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="mx-auto mb-3 text-muted-foreground/50" size={48} />
              <p>אין לידים פתוחים כרגע</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leads.map((lead: any) => (
                <div key={lead.id} className="bg-card rounded-xl p-6 border border-border shadow-card hover:border-gold/20 transition-colors">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-success/10 text-success text-xs font-bold px-2.5 py-1 rounded-full">חדש</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {lead.property_area && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin size={14} /> <span>אזור: {lead.property_area}</span>
                      </div>
                    )}
                    {lead.property_price_range && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Home size={14} /> <span>מחיר: {lead.property_price_range}</span>
                      </div>
                    )}
                    {lead.purpose && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText size={14} /> <span>מטרה: {lead.purpose}</span>
                      </div>
                    )}
                    {lead.income_range && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Wallet size={14} /> <span>הכנסה: {lead.income_range}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="cta"
                    className="w-full mt-4"
                    onClick={() => purchaseLead.mutate(lead.id)}
                    disabled={purchaseLead.isPending || (profile?.lead_credits || 0) < 1}
                  >
                    <ShoppingCart size={16} />
                    רכוש ליד — ₪200
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Purchased leads */}
        <TabsContent value="purchased" className="space-y-4 mt-4">
          {purchases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>עדיין לא רכשת לידים</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {purchases.map((p: any) => (
                <div key={p.id} className="bg-card rounded-xl p-6 border border-border shadow-card">
                  <div className="text-sm space-y-2 mb-4">
                    <p className="text-muted-foreground">אזור: {p.leads?.property_area || "—"}</p>
                    <p className="text-muted-foreground">מטרה: {p.leads?.purpose || "—"}</p>
                    <p className="text-muted-foreground">נרכש: {new Date(p.purchased_at).toLocaleDateString("he-IL")}</p>
                  </div>
                  <Button variant="cta" size="sm" onClick={() => navigate(`/advisor/offer/${p.lead_id}`)}>
                    <FileText size={14} /> הגש הצעה
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My offers */}
        <TabsContent value="offers" className="space-y-4 mt-4">
          {myOffers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>עדיין לא הגשת הצעות</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myOffers.map((offer: any) => (
                <div key={offer.id} className="bg-card rounded-xl p-5 border border-border shadow-card flex items-center justify-between">
                  <div>
                    <div className="font-display font-bold text-foreground">{offer.bank_name}</div>
                    <div className="text-sm text-muted-foreground">
                      ריבית: {offer.interest_rate}% · החזר: ₪{offer.monthly_payment?.toLocaleString()}
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    offer.status === "accepted" ? "bg-success/10 text-success" :
                    offer.status === "rejected" ? "bg-destructive/10 text-destructive" :
                    offer.status === "viewed" ? "bg-warning/10 text-warning" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {offerStatusLabel[offer.status] || offer.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
