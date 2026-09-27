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
    PostgrestVersion: "14.5"
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
      audit_log: {
        Row: {
          action: string
          case_id: string | null
          created_at: string
          id: string
          metadata: Json
          object_id: string | null
          object_type: string | null
          role: string | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          action: string
          case_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          object_id?: string | null
          object_type?: string | null
          role?: string | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          action?: string
          case_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          object_id?: string | null
          object_type?: string | null
          role?: string | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      banks: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort?: number
        }
        Relationships: []
      }
      case_documents: {
        Row: {
          ai_extracted_data: Json | null
          case_id: string
          doc_type: string
          file_name: string
          file_path: string
          id: string
          is_required: boolean
          uploaded_at: string
        }
        Insert: {
          ai_extracted_data?: Json | null
          case_id: string
          doc_type: string
          file_name: string
          file_path: string
          id?: string
          is_required?: boolean
          uploaded_at?: string
        }
        Update: {
          ai_extracted_data?: Json | null
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
          ai_analysis: Json | null
          assigned_advisor_id: string | null
          case_number: string
          case_type: Database["public"]["Enums"]["case_type"]
          created_at: string
          current_step: number
          emails_sent: Json
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
          ai_analysis?: Json | null
          assigned_advisor_id?: string | null
          case_number?: string
          case_type?: Database["public"]["Enums"]["case_type"]
          created_at?: string
          current_step?: number
          emails_sent?: Json
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
          ai_analysis?: Json | null
          assigned_advisor_id?: string | null
          case_number?: string
          case_type?: Database["public"]["Enums"]["case_type"]
          created_at?: string
          current_step?: number
          emails_sent?: Json
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
      chat_messages: {
        Row: {
          case_id: string | null
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          case_id?: string | null
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          case_id?: string | null
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          case_id: string | null
          consent_type: string
          consent_version: string
          consented_at: string
          id: string
          revoked_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          case_id?: string | null
          consent_type: string
          consent_version: string
          consented_at?: string
          id?: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          case_id?: string | null
          consent_type?: string
          consent_version?: string
          consented_at?: string
          id?: string
          revoked_at?: string | null
          user_agent?: string | null
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
      market_rates: {
        Row: {
          cpi: number
          cpi_annual: number | null
          fixed_linked: number
          fixed_not_linked: number
          id: string
          kalatz: number | null
          kalatz_long: number | null
          katz: number | null
          next_committee: string | null
          prime: number
          prime_minus: number | null
          source: string | null
          updated_at: string | null
          updated_by: string | null
          variable_1: number
          variable_2_linked: number | null
          variable_5: number
          variable_5_kalatz: number | null
          variable_5_linked: number | null
          zakaut: number | null
        }
        Insert: {
          cpi?: number
          cpi_annual?: number | null
          fixed_linked?: number
          fixed_not_linked?: number
          id?: string
          kalatz?: number | null
          kalatz_long?: number | null
          katz?: number | null
          next_committee?: string | null
          prime?: number
          prime_minus?: number | null
          source?: string | null
          updated_at?: string | null
          updated_by?: string | null
          variable_1?: number
          variable_2_linked?: number | null
          variable_5?: number
          variable_5_kalatz?: number | null
          variable_5_linked?: number | null
          zakaut?: number | null
        }
        Update: {
          cpi?: number
          cpi_annual?: number | null
          fixed_linked?: number
          fixed_not_linked?: number
          id?: string
          kalatz?: number | null
          kalatz_long?: number | null
          katz?: number | null
          next_committee?: string | null
          prime?: number
          prime_minus?: number | null
          source?: string | null
          updated_at?: string | null
          updated_by?: string | null
          variable_1?: number
          variable_2_linked?: number | null
          variable_5?: number
          variable_5_kalatz?: number | null
          variable_5_linked?: number | null
          zakaut?: number | null
        }
        Relationships: []
      }
      market_rates_history: {
        Row: {
          captured_on: string
          created_at: string
          data: Json
          id: string
          source: string | null
        }
        Insert: {
          captured_on?: string
          created_at?: string
          data?: Json
          id?: string
          source?: string | null
        }
        Update: {
          captured_on?: string
          created_at?: string
          data?: Json
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      mortgage_profiles: {
        Row: {
          age_range: string | null
          borrower_count: number | null
          case_id: string | null
          case_type: string | null
          created_at: string
          dti: number | null
          id: string
          income_range: string | null
          loan_amount: number | null
          ltv: number | null
          offered_rate: number | null
          property_area: string | null
          property_value: number | null
          selected_mix: string | null
          source: string
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          borrower_count?: number | null
          case_id?: string | null
          case_type?: string | null
          created_at?: string
          dti?: number | null
          id?: string
          income_range?: string | null
          loan_amount?: number | null
          ltv?: number | null
          offered_rate?: number | null
          property_area?: string | null
          property_value?: number | null
          selected_mix?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          borrower_count?: number | null
          case_id?: string | null
          case_type?: string | null
          created_at?: string
          dti?: number | null
          id?: string
          income_range?: string | null
          loan_amount?: number | null
          ltv?: number | null
          offered_rate?: number | null
          property_area?: string | null
          property_value?: number | null
          selected_mix?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      nudge_log: {
        Row: {
          channel: string
          error_message: string | null
          id: string
          nudge_type: string
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          channel?: string
          error_message?: string | null
          id?: string
          nudge_type: string
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          channel?: string
          error_message?: string | null
          id?: string
          nudge_type?: string
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
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
      privacy_requests: {
        Row: {
          created_at: string
          details: string | null
          id: string
          legal_hold: boolean
          request_type: string
          resolution_notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          legal_hold?: boolean
          request_type: string
          resolution_notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          legal_hold?: boolean
          request_type?: string
          resolution_notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      quiz_sessions: {
        Row: {
          completed: boolean | null
          created_at: string
          current_step: number | null
          id: string
          purpose: string | null
          quiz_data: Json
          score_estimate: number | null
          session_token: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          current_step?: number | null
          id?: string
          purpose?: string | null
          quiz_data?: Json
          score_estimate?: number | null
          session_token?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          current_step?: number | null
          id?: string
          purpose?: string | null
          quiz_data?: Json
          score_estimate?: number | null
          session_token?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tender_banks: {
        Row: {
          approval_valid_until: string | null
          approved_amount: number | null
          approved_ltv: number | null
          bank_id: string | null
          banker_contact: string | null
          created_at: string
          id: string
          internal_notes: string | null
          slot: number
          status: string
          submitted_at: string | null
          tender_id: string
          updated_at: string
        }
        Insert: {
          approval_valid_until?: string | null
          approved_amount?: number | null
          approved_ltv?: number | null
          bank_id?: string | null
          banker_contact?: string | null
          created_at?: string
          id?: string
          internal_notes?: string | null
          slot: number
          status?: string
          submitted_at?: string | null
          tender_id: string
          updated_at?: string
        }
        Update: {
          approval_valid_until?: string | null
          approved_amount?: number | null
          approved_ltv?: number | null
          bank_id?: string | null
          banker_contact?: string | null
          created_at?: string
          id?: string
          internal_notes?: string | null
          slot?: number
          status?: string
          submitted_at?: string | null
          tender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_banks_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_banks_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_checklist: {
        Row: {
          done: boolean
          done_at: string | null
          done_by: string | null
          id: string
          sort: number
          step_key: string
          tender_id: string
        }
        Insert: {
          done?: boolean
          done_at?: string | null
          done_by?: string | null
          id?: string
          sort: number
          step_key: string
          tender_id: string
        }
        Update: {
          done?: boolean
          done_at?: string | null
          done_by?: string | null
          id?: string
          sort?: number
          step_key?: string
          tender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_checklist_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_client_actions: {
        Row: {
          action: string
          created_at: string
          id: string
          message: string | null
          offer_id: string | null
          tender_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          message?: string | null
          offer_id?: string | null
          tender_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          message?: string | null
          offer_id?: string | null
          tender_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_client_actions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "tender_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_client_actions_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_offers: {
        Row: {
          advisor_explanation: string | null
          client_visible: boolean
          created_at: string
          created_by: string | null
          extra_costs: string | null
          first_payment: number | null
          id: string
          kind: string
          offer_date: string | null
          tender_bank_id: string
          total_amount: number | null
          tracks: Json
          valid_until: string | null
          version: number
        }
        Insert: {
          advisor_explanation?: string | null
          client_visible?: boolean
          created_at?: string
          created_by?: string | null
          extra_costs?: string | null
          first_payment?: number | null
          id?: string
          kind?: string
          offer_date?: string | null
          tender_bank_id: string
          total_amount?: number | null
          tracks?: Json
          valid_until?: string | null
          version: number
        }
        Update: {
          advisor_explanation?: string | null
          client_visible?: boolean
          created_at?: string
          created_by?: string | null
          extra_costs?: string | null
          first_payment?: number | null
          id?: string
          kind?: string
          offer_date?: string | null
          tender_bank_id?: string
          total_amount?: number | null
          tracks?: Json
          valid_until?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tender_offers_tender_bank_id_fkey"
            columns: ["tender_bank_id"]
            isOneToOne: false
            referencedRelation: "tender_banks"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          advisor_summary: string | null
          case_id: string
          created_at: string
          id: string
          opened_at: string
          selected_offer_id: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          advisor_summary?: string | null
          case_id: string
          created_at?: string
          id?: string
          opened_at?: string
          selected_offer_id?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          advisor_summary?: string | null
          case_id?: string
          created_at?: string
          id?: string
          opened_at?: string
          selected_offer_id?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenders_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
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
      validation_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label: string
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      vendors: {
        Row: {
          created_at: string
          data_categories: string | null
          dpa_signed: boolean
          id: string
          last_reviewed: string | null
          purpose: string | null
          region: string | null
          retention: string | null
          security_notes: string | null
          service: string | null
          subprocessors: string | null
          vendor_name: string
        }
        Insert: {
          created_at?: string
          data_categories?: string | null
          dpa_signed?: boolean
          id?: string
          last_reviewed?: string | null
          purpose?: string | null
          region?: string | null
          retention?: string | null
          security_notes?: string | null
          service?: string | null
          subprocessors?: string | null
          vendor_name: string
        }
        Update: {
          created_at?: string
          data_categories?: string | null
          dpa_signed?: boolean
          id?: string
          last_reviewed?: string | null
          purpose?: string | null
          region?: string | null
          retention?: string | null
          security_notes?: string | null
          service?: string | null
          subprocessors?: string | null
          vendor_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_case: { Args: { _case_id: string }; Returns: boolean }
      client_tender_action: {
        Args: { _action: string; _message?: string; _offer_id: string }
        Returns: undefined
      }
      get_client_tender: { Args: { _case_id: string }; Returns: Json }
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
      is_privacy_viewer: { Args: never; Returns: boolean }
      log_audit: {
        Args: {
          _action: string
          _case_id?: string
          _metadata?: Json
          _object_id?: string
          _object_type?: string
          _success?: boolean
        }
        Returns: undefined
      }
      open_tender: { Args: { _case_id: string }; Returns: string }
      quiz_create_session: {
        Args: never
        Returns: {
          id: string
          session_token: string
        }[]
      }
      quiz_get_session: {
        Args: { _token: string }
        Returns: {
          current_step: number
          quiz_data: Json
        }[]
      }
      quiz_update_session: {
        Args: {
          _completed?: boolean
          _current_step: number
          _purpose: string
          _quiz_data: Json
          _score: number
          _token: string
        }
        Returns: undefined
      }
      submit_case_safe: {
        Args: { _case_id: string; _goal?: string }
        Returns: undefined
      }
      update_case_safe: {
        Args: {
          _case_id: string
          _case_type?: Database["public"]["Enums"]["case_type"]
          _current_step?: number
          _goal?: string
          _intake_data?: Json
          _selected_mix?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "advisor"
        | "operations"
        | "mortgage_advisor"
        | "supervisor"
        | "privacy_auditor"
        | "customer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "advisor",
        "operations",
        "mortgage_advisor",
        "supervisor",
        "privacy_auditor",
        "customer",
      ],
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
