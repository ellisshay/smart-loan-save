import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { CaseStatus } from "@/types/admin";

export interface AdminCase {
  id: string;
  case_number: string;
  case_type: "new" | "refi";
  status: CaseStatus;
  goal: string | null;
  intake_complete: boolean;
  payment_succeeded: boolean;
  created_at: string;
  updated_at: string;
  selected_mix: string | null;
  sla_started_at: string | null;
  sla_due_at: string | null;
  intake_data: Record<string, any>;
  user_id: string;
  // joined from profiles
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  // joined docs count
  docs_uploaded: number;
  docs_total: number;
}

export function useAdminCases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCases = async () => {
    // Check admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) { navigate("/"); return; }

    // Fetch cases with profiles
    const { data: casesData, error } = await supabase
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !casesData) {
      setLoading(false);
      return;
    }

    // Fetch all profiles for these users
    const userIds = [...new Set(casesData.map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, email, phone")
      .in("user_id", userIds);

    const profileMap = new Map(
      (profiles || []).map(p => [p.user_id, p])
    );

    // Fetch doc counts per case
    const caseIds = casesData.map(c => c.id);
    const { data: docs } = await supabase
      .from("case_documents")
      .select("case_id, id")
      .in("case_id", caseIds);

    const docCountMap = new Map<string, number>();
    (docs || []).forEach(d => {
      docCountMap.set(d.case_id, (docCountMap.get(d.case_id) || 0) + 1);
    });

    const enriched: AdminCase[] = casesData.map(c => {
      const profile = profileMap.get(c.user_id);
      const name = profile
        ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "ללא שם"
        : "ללא שם";

      return {
        id: c.id,
        case_number: c.case_number,
        case_type: c.case_type,
        status: c.status as CaseStatus,
        goal: c.goal,
        intake_complete: c.intake_complete,
        payment_succeeded: c.payment_succeeded,
        created_at: c.created_at,
        updated_at: c.updated_at,
        selected_mix: c.selected_mix,
        sla_started_at: c.sla_started_at,
        sla_due_at: c.sla_due_at,
        intake_data: (c.intake_data as Record<string, any>) || {},
        user_id: c.user_id,
        client_name: name,
        client_email: profile?.email || null,
        client_phone: profile?.phone || null,
        docs_uploaded: docCountMap.get(c.id) || 0,
        docs_total: 4, // standard required docs
      };
    });

    setCases(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchCases(); }, []);

  const updateCaseStatus = async (caseId: string, newStatus: CaseStatus) => {
    const { error } = await supabase
      .from("cases")
      .update({ status: newStatus })
      .eq("id", caseId);

    if (!error) {
      setCases(prev => prev.map(c =>
        c.id === caseId ? { ...c, status: newStatus } : c
      ));
    }
    return !error;
  };

  return { cases, loading, updateCaseStatus, refetch: fetchCases };
}
