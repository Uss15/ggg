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
      cases: {
        Row: {
          case_number: string
          closed_at: string | null
          created_at: string
          description: string | null
          id: string
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
          created_at?: string
          description?: string | null
          id?: string
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
          created_at?: string
          description?: string | null
          id?: string
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
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          notes: string | null
          performed_by: string
          timestamp: string
        }
        Insert: {
          action: Database["public"]["Enums"]["action_type"]
          bag_id: string
          created_at?: string
          id?: string
          latitude?: number | null
          location: string
          longitude?: number | null
          notes?: string | null
          performed_by: string
          timestamp?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["action_type"]
          bag_id?: string
          created_at?: string
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          notes?: string | null
          performed_by?: string
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
          id: string
          notes: string | null
          photo_url: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          bag_id: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_url: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          bag_id?: string
          created_at?: string
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
      generate_bag_id: { Args: never; Returns: string }
      generate_case_number: { Args: never; Returns: string }
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
    }
    Enums: {
      action_type:
        | "collected"
        | "packed"
        | "transferred"
        | "received"
        | "analyzed"
        | "archived"
      app_role: "collector" | "transport" | "lab_tech" | "admin"
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
      app_role: ["collector", "transport", "lab_tech", "admin"],
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
