export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      advisor_profiles: {
        Row: {
          company: string | null
          created_at: string | null
          lead_credits: number | null
          license_number: string
          rating: number | null
          subscription_tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          lead_credits?: number | null
          license_number: string
          rating?: number | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          lead_credits?: number | null
          license_number?: string
          rating?: number | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      case_documents: {
        Row: {
          case_id: string
          doc_type: string
          file_name: string
          file_path: string
          id: string
          is_required: boolean
          uploaded_at: string
        }
        Insert: {
          case_id: string
          doc_type: string
          file_name: string
          file_path: string
          id?: string
          is_required?: boolean
          uploaded_at?: string
        }
        Update: {
          case_id?: string
          doc_type?: string
          file_name?: string
          file_path?: string
          id?: string
          is_required?: boolean
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_events: {
        Row: {
          case_id: string
          created_at: string
          event_name: string
          id: string
          payload: Json
        }
        Insert: {
          case_id: string
          created_at?: string
          event_name: string
          id?: string
          payload?: Json
        }
        Update: {
          case_id?: string
          created_at?: string
          event_name?: string
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "case_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_tracks: {
        Row: {
          case_id: string
          created_at: string
          exit_date: string | null
          exit_penalty: number | null
          id: string
          interest_rate: number | null
          is_indexed: boolean | null
          principal_balance: number | null
          remaining_months: number | null
          remaining_years: number | null
          track_type: string
        }
        Insert: {
          case_id: string
          created_at?: string
          exit_date?: string | null
          exit_penalty?: number | null
          id?: string
          interest_rate?: number | null
          is_indexed?: boolean | null
          principal_balance?: number | null
          remaining_months?: number | null
          remaining_years?: number | null
          track_type: string
        }
        Update: {
          case_id?: string
          created_at?: string
          exit_date?: string | null
          exit_penalty?: number | null
          id?: string
          interest_rate?: number | null
          is_indexed?: boolean | null
          principal_balance?: number | null
          remaining_months?: number | null
          remaining_years?: number | null
          track_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_tracks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          case_number: string
          case_type: Database["public"]["Enums"]["case_type"]
          created_at: string
          current_step: number
          goal: string | null
          id: string
          intake_complete: boolean
          intake_data: Json
          payment_succeeded: boolean
          selected_mix: string | null
          sla_due_at: string | null
          sla_started_at: string | null
          status: Database["public"]["Enums"]["case_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          case_number?: string
          case_type?: Database["public"]["Enums"]["case_type"]
          created_at?: string
          current_step?: number
          goal?: string | null
          id?: string
          intake_complete?: boolean
          intake_data?: Json
          payment_succeeded?: boolean
          selected_mix?: string | null
          sla_due_at?: string | null
          sla_started_at?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          case_number?: string
          case_type?: Database["public"]["Enums"]["case_type"]
          created_at?: string
          current_step?: number
          goal?: string | null
          id?: string
          intake_complete?: boolean
          intake_data?: Json
          payment_succeeded?: boolean
          selected_mix?: string | null
          sla_due_at?: string | null
          sla_started_at?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_purchases: {
        Row: {
          advisor_id: string
          amount: number
          id: string
          lead_id: string
          purchased_at: string | null
        }
        Insert: {
          advisor_id: string
          amount?: number
          id?: string
          lead_id: string
          purchased_at?: string | null
        }
        Update: {
          advisor_id?: string
          amount?: number
          id?: string
          lead_id?: string
          purchased_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_purchases_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          case_id: string | null
          client_id: string
          created_at: string | null
          equity_range: string | null
          id: string
          income_range: string | null
          property_area: string | null
          property_price_range: string | null
          purpose: string | null
          status: string
        }
        Insert: {
          case_id?: string | null
          client_id: string
          created_at?: string | null
          equity_range?: string | null
          id?: string
          income_range?: string | null
          property_area?: string | null
          property_price_range?: string | null
          purpose?: string | null
          status?: string
        }
        Update: {
          case_id?: string | null
          client_id?: string
          created_at?: string | null
          equity_range?: string | null
          id?: string
          income_range?: string | null
          property_area?: string | null
          property_price_range?: string | null
          purpose?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          advisor_fee: number | null
          advisor_id: string
          bank_name: string
          created_at: string | null
          id: string
          interest_rate: number
          lead_id: string
          loan_period: number | null
          monthly_payment: number
          notes: string | null
          status: string
          total_cost: number | null
          track_type: string
          validity_date: string | null
        }
        Insert: {
          advisor_fee?: number | null
          advisor_id: string
          bank_name: string
          created_at?: string | null
          id?: string
          interest_rate: number
          lead_id: string
          loan_period?: number | null
          monthly_payment: number
          notes?: string | null
          status?: string
          total_cost?: number | null
          track_type: string
          validity_date?: string | null
        }
        Update: {
          advisor_fee?: number | null
          advisor_id?: string
          bank_name?: string
          created_at?: string | null
          id?: string
          interest_rate?: number
          lead_id?: string
          loan_period?: number | null
          monthly_payment?: number
          notes?: string | null
          status?: string
          total_cost?: number | null
          track_type?: string
          validity_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_purchased_lead: {
        Args: { _advisor_id: string; _lead_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "advisor"
      case_status:
        | "Draft"
        | "WaitingForPayment"
        | "PaymentSucceeded"
        | "WaitingForDocs"
        | "InAnalysis"
        | "ReportGenerated"
        | "CustomerReview"
        | "SentToBank"
        | "BankOfferReceived"
        | "Negotiation"
        | "ClosedWon"
        | "ClosedLost"
      case_type: "new" | "refi"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "advisor"],
      case_status: [
        "Draft",
        "WaitingForPayment",
        "PaymentSucceeded",
        "WaitingForDocs",
        "InAnalysis",
        "ReportGenerated",
        "CustomerReview",
        "SentToBank",
        "BankOfferReceived",
        "Negotiation",
        "ClosedWon",
        "ClosedLost",
      ],
      case_type: ["new", "refi"],
    },
  },
} as const
