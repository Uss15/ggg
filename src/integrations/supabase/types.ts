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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_analysis: {
        Row: {
          analysis_type: string
          confidence: number | null
          entity_id: string
          entity_type: string
          id: string
          performed_at: string
          performed_by: string | null
          result: Json
        }
        Insert: {
          analysis_type: string
          confidence?: number | null
          entity_id: string
          entity_type: string
          id?: string
          performed_at?: string
          performed_by?: string | null
          result: Json
        }
        Update: {
          analysis_type?: string
          confidence?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          performed_at?: string
          performed_by?: string | null
          result?: Json
        }
        Relationships: []
      }
      audit_check_items: {
        Row: {
          actual_location: string | null
          actual_status: string | null
          audit_id: string
          bag_id: string
          checked_at: string | null
          checked_by: string | null
          created_at: string
          discrepancy: boolean | null
          expected_location: string
          expected_status: string
          id: string
          notes: string | null
        }
        Insert: {
          actual_location?: string | null
          actual_status?: string | null
          audit_id: string
          bag_id: string
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          discrepancy?: boolean | null
          expected_location: string
          expected_status: string
          id?: string
          notes?: string | null
        }
        Update: {
          actual_location?: string | null
          actual_status?: string | null
          audit_id?: string
          bag_id?: string
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          discrepancy?: boolean | null
          expected_location?: string
          expected_status?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_check_items_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audit_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_check_items_bag_id_fkey"
            columns: ["bag_id"]
            isOneToOne: false
            referencedRelation: "evidence_bags"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_checks: {
        Row: {
          audit_name: string
          checked_items: number
          completed_at: string | null
          created_at: string
          created_by: string
          discrepancies: number
          id: string
          notes: string | null
          status: string
          total_items: number
        }
        Insert: {
          audit_name: string
          checked_items?: number
          completed_at?: string | null
          created_at?: string
          created_by: string
          discrepancies?: number
          id?: string
          notes?: string | null
          status?: string
          total_items?: number
        }
        Update: {
          audit_name?: string
          checked_items?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string
          discrepancies?: number
          id?: string
          notes?: string | null
          status?: string
          total_items?: number
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      authorized_zones: {
        Row: {
          center_latitude: number
          center_longitude: number
          created_at: string
          id: string
          is_active: boolean
          office_id: string | null
          radius_meters: number
          updated_at: string
          zone_name: string
        }
        Insert: {
          center_latitude: number
          center_longitude: number
          created_at?: string
          id?: string
          is_active?: boolean
          office_id?: string | null
          radius_meters?: number
          updated_at?: string
          zone_name: string
        }
        Update: {
          center_latitude?: number
          center_longitude?: number
          created_at?: string
          id?: string
          is_active?: boolean
          office_id?: string | null
          radius_meters?: number
          updated_at?: string
          zone_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "authorized_zones_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      case_evidence: {
        Row: {
          bag_id: string
          case_id: string
          id: string
          linked_at: string
          linked_by: string | null
          notes: string | null
        }
        Insert: {
          bag_id: string
          case_id: string
          id?: string
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
        }
        Update: {
          bag_id?: string
          case_id?: string
          id?: string
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_evidence_bag_id_fkey"
            columns: ["bag_id"]
            isOneToOne: false
            referencedRelation: "evidence_bags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_evidence_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_evidence_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_evidence_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          case_number: string
          closed_at: string | null
          closed_by: string | null
          closure_notes: string | null
          created_at: string
          description: string | null
          id: string
          is_closed: boolean | null
          lead_officer: string
          location: string
          notes: string | null
          offense_type: string
          office_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          case_number: string
          closed_at?: string | null
          closed_by?: string | null
          closure_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_closed?: boolean | null
          lead_officer: string
          location: string
          notes?: string | null
          offense_type: string
          office_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          case_number?: string
          closed_at?: string | null
          closed_by?: string | null
          closure_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_closed?: boolean | null
          lead_officer?: string
          location?: string
          notes?: string | null
          offense_type?: string
          office_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_lead_officer_fkey"
            columns: ["lead_officer"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_lead_officer_fkey"
            columns: ["lead_officer"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      chain_of_custody_log: {
        Row: {
          action: Database["public"]["Enums"]["action_type"]
          bag_id: string
          created_at: string
          current_hash: string | null
          digital_signature: string | null
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          notes: string | null
          performed_by: string
          previous_hash: string | null
          signature_timestamp: string | null
          timestamp: string
        }
        Insert: {
          action: Database["public"]["Enums"]["action_type"]
          bag_id: string
          created_at?: string
          current_hash?: string | null
          digital_signature?: string | null
          id?: string
          latitude?: number | null
          location: string
          longitude?: number | null
          notes?: string | null
          performed_by: string
          previous_hash?: string | null
          signature_timestamp?: string | null
          timestamp?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["action_type"]
          bag_id?: string
          created_at?: string
          current_hash?: string | null
          digital_signature?: string | null
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          notes?: string | null
          performed_by?: string
          previous_hash?: string | null
          signature_timestamp?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "chain_of_custody_log_bag_id_fkey"
            columns: ["bag_id"]
            isOneToOne: false
            referencedRelation: "evidence_bags"
            referencedColumns: ["id"]
          },
        ]
      }
      disposal_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bag_id: string
          completed_at: string | null
          created_at: string
          disposal_documentation: string | null
          disposal_type: string
          id: string
          notes: string | null
          reason: string
          requested_at: string
          requested_by: string
          status: string
          updated_at: string
          witness1_name: string | null
          witness1_signature: string | null
          witness1_signed_at: string | null
          witness2_name: string | null
          witness2_signature: string | null
          witness2_signed_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bag_id: string
          completed_at?: string | null
          created_at?: string
          disposal_documentation?: string | null
          disposal_type: string
          id?: string
          notes?: string | null
          reason: string
          requested_at?: string
          requested_by: string
          status?: string
          updated_at?: string
          witness1_name?: string | null
          witness1_signature?: string | null
          witness1_signed_at?: string | null
          witness2_name?: string | null
          witness2_signature?: string | null
          witness2_signed_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bag_id?: string
          completed_at?: string | null
          created_at?: string
          disposal_documentation?: string | null
          disposal_type?: string
          id?: string
          notes?: string | null
          reason?: string
          requested_at?: string
          requested_by?: string
          status?: string
          updated_at?: string
          witness1_name?: string | null
          witness1_signature?: string | null
          witness1_signed_at?: string | null
          witness2_name?: string | null
          witness2_signature?: string | null
          witness2_signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disposal_requests_bag_id_fkey"
            columns: ["bag_id"]
            isOneToOne: false
            referencedRelation: "evidence_bags"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_bags: {
        Row: {
          bag_id: string
          created_at: string
          current_status: Database["public"]["Enums"]["evidence_status"]
          date_collected: string
          description: string
          id: string
          initial_collector: string
          latitude: number | null
          location: string
          longitude: number | null
          notes: string | null
          qr_data: string | null
          type: Database["public"]["Enums"]["evidence_type"]
          updated_at: string
        }
        Insert: {
          bag_id: string
          created_at?: string
          current_status?: Database["public"]["Enums"]["evidence_status"]
          date_collected?: string
          description: string
          id?: string
          initial_collector: string
          latitude?: number | null
          location: string
          longitude?: number | null
          notes?: string | null
          qr_data?: string | null
          type: Database["public"]["Enums"]["evidence_type"]
          updated_at?: string
        }
        Update: {
          bag_id?: string
          created_at?: string
          current_status?: Database["public"]["Enums"]["evidence_status"]
          date_collected?: string
          description?: string
          id?: string
          initial_collector?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          notes?: string | null
          qr_data?: string | null
          type?: Database["public"]["Enums"]["evidence_type"]
          updated_at?: string
        }
        Relationships: []
      }
      evidence_photos: {
        Row: {
          bag_id: string
          created_at: string
          file_hash: string | null
          file_size: number | null
          id: string
          notes: string | null
          photo_url: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          bag_id: string
          created_at?: string
          file_hash?: string | null
          file_size?: number | null
          id?: string
          notes?: string | null
          photo_url: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          bag_id?: string
          created_at?: string
          file_hash?: string | null
          file_size?: number | null
          id?: string
          notes?: string | null
          photo_url?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_photos_bag_id_fkey"
            columns: ["bag_id"]
            isOneToOne: false
            referencedRelation: "evidence_bags"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_access_control: {
        Row: {
          access_type: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          ip_address: string
          is_active: boolean
          reason: string | null
        }
        Insert: {
          access_type?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address: string
          is_active?: boolean
          reason?: string | null
        }
        Update: {
          access_type?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean
          reason?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          read: boolean
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          address: string | null
          city: string
          code: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          city: string
          code: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          city?: string
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          badge_number: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          badge_number?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          badge_number?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_changes: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_roles: Json | null
          old_roles: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_roles?: Json | null
          old_roles?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_roles?: Json | null
          old_roles?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          event_status: string
          event_type: string
          id: string
          ip_address: string | null
          latitude: number | null
          location_authorized: boolean | null
          longitude: number | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_status?: string
          event_type: string
          id?: string
          ip_address?: string | null
          latitude?: number | null
          location_authorized?: boolean | null
          longitude?: number | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_status?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          latitude?: number | null
          location_authorized?: boolean | null
          longitude?: number | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tamper_alerts: {
        Row: {
          action: string
          detected_at: string
          detected_by: string | null
          id: string
          new_data: Json | null
          notes: string | null
          old_data: Json | null
          record_id: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          table_name: string
        }
        Insert: {
          action: string
          detected_at?: string
          detected_by?: string | null
          id?: string
          new_data?: Json | null
          notes?: string | null
          old_data?: Json | null
          record_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          table_name: string
        }
        Update: {
          action?: string
          detected_at?: string
          detected_by?: string | null
          id?: string
          new_data?: Json | null
          notes?: string | null
          old_data?: Json | null
          record_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          table_name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          badge_number: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          badge_number?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          badge_number?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_bag: {
        Args: { _bag_id: string; _user_id: string }
        Returns: boolean
      }
      check_ip_access: { Args: { p_ip_address: string }; Returns: boolean }
      create_tamper_alert: {
        Args: {
          p_action: string
          p_new_data?: Json
          p_old_data?: Json
          p_record_id: string
          p_severity?: string
          p_table_name: string
        }
        Returns: undefined
      }
      generate_bag_id: { Args: never; Returns: string }
      generate_case_number: { Args: never; Returns: string }
      generate_custody_hash: {
        Args: {
          p_action: string
          p_bag_id: string
          p_performed_by: string
          p_previous_hash: string
          p_timestamp: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_event_status?: string
          p_event_type: string
          p_ip_address?: string
          p_latitude?: number
          p_location_authorized?: boolean
          p_longitude?: number
          p_metadata?: Json
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      validate_geofence: {
        Args: { p_latitude: number; p_longitude: number }
        Returns: {
          is_authorized: boolean
          office_name: string
          zone_name: string
        }[]
      }
      verify_custody_chain_integrity: {
        Args: { p_bag_id: string }
        Returns: {
          actual_hash: string
          expected_hash: string
          is_valid: boolean
          log_id: string
        }[]
      }
    }
    Enums: {
      action_type:
        | "collected"
        | "packed"
        | "transferred"
        | "received"
        | "analyzed"
        | "archived"
      app_role:
        | "collector"
        | "transport"
        | "lab_tech"
        | "admin"
        | "investigator"
      evidence_status:
        | "collected"
        | "in_transport"
        | "in_lab"
        | "analyzed"
        | "archived"
      evidence_type:
        | "weapon"
        | "clothing"
        | "biological_sample"
        | "documents"
        | "electronics"
        | "other"
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
      action_type: [
        "collected",
        "packed",
        "transferred",
        "received",
        "analyzed",
        "archived",
      ],
      app_role: ["collector", "transport", "lab_tech", "admin", "investigator"],
      evidence_status: [
        "collected",
        "in_transport",
        "in_lab",
        "analyzed",
        "archived",
      ],
      evidence_type: [
        "weapon",
        "clothing",
        "biological_sample",
        "documents",
        "electronics",
        "other",
      ],
    },
  },
} as const
