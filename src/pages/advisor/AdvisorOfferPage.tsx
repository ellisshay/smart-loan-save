import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdvisorOfferForm from "./AdvisorOfferForm";

export default function AdvisorOfferPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["advisor-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  if (!leadId || !user) return null;

  return (
    <AdvisorOfferForm
      leadId={leadId}
      advisorId={user.id}
      onBack={() => navigate("/advisor")}
      onSuccess={() => navigate("/advisor")}
    />
  );
}
