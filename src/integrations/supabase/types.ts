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
      batch_bom: {
        Row: {
          batch_id: string | null
          blend_id: string | null
          created_at: string
          id: string
          ingredients: Json
          labor: Json
          overheads: Json
          packaging: Json
          sell_price_150cl: number | null
          sell_price_75cl: number | null
          updated_at: string
          user_id: string
          wastage_percent: number
        }
        Insert: {
          batch_id?: string | null
          blend_id?: string | null
          created_at?: string
          id?: string
          ingredients?: Json
          labor?: Json
          overheads?: Json
          packaging?: Json
          sell_price_150cl?: number | null
          sell_price_75cl?: number | null
          updated_at?: string
          user_id: string
          wastage_percent?: number
        }
        Update: {
          batch_id?: string | null
          blend_id?: string | null
          created_at?: string
          id?: string
          ingredients?: Json
          labor?: Json
          overheads?: Json
          packaging?: Json
          sell_price_150cl?: number | null
          sell_price_75cl?: number | null
          updated_at?: string
          user_id?: string
          wastage_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "batch_bom_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: true
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_bom_blend_id_fkey"
            columns: ["blend_id"]
            isOneToOne: true
            referencedRelation: "blend_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_history: {
        Row: {
          batch_id: string
          created_at: string
          id: string
          notes: string | null
          stage: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          id?: string
          notes?: string | null
          stage: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_history_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_logs: {
        Row: {
          attachments: string[] | null
          batch_id: string
          content: string | null
          created_at: string
          fg: number | null
          id: string
          og: number | null
          ph: number | null
          role: string | null
          stage: string
          ta_gpl: number | null
          tags: string[] | null
          temp_c: number | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          batch_id: string
          content?: string | null
          created_at?: string
          fg?: number | null
          id?: string
          og?: number | null
          ph?: number | null
          role?: string | null
          stage: string
          ta_gpl?: number | null
          tags?: string[] | null
          temp_c?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: string[] | null
          batch_id?: string
          content?: string | null
          created_at?: string
          fg?: number | null
          id?: string
          og?: number | null
          ph?: number | null
          role?: string | null
          stage?: string
          ta_gpl?: number | null
          tags?: string[] | null
          temp_c?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_logs_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          apple_mix: string | null
          apple_origin: string | null
          attachments: string[] | null
          completed_at: string | null
          created_at: string
          current_stage: string
          id: string
          name: string
          notes: string | null
          progress: number
          started_at: string
          style: string | null
          target_end_ph: number | null
          target_fg: number | null
          target_og: number | null
          target_ph: number | null
          target_ta: number | null
          target_temp_c: number | null
          updated_at: string
          user_id: string
          variety: string
          volume: number
          yeast_type: string | null
        }
        Insert: {
          apple_mix?: string | null
          apple_origin?: string | null
          attachments?: string[] | null
          completed_at?: string | null
          created_at?: string
          current_stage: string
          id?: string
          name: string
          notes?: string | null
          progress?: number
          started_at?: string
          style?: string | null
          target_end_ph?: number | null
          target_fg?: number | null
          target_og?: number | null
          target_ph?: number | null
          target_ta?: number | null
          target_temp_c?: number | null
          updated_at?: string
          user_id: string
          variety: string
          volume: number
          yeast_type?: string | null
        }
        Update: {
          apple_mix?: string | null
          apple_origin?: string | null
          attachments?: string[] | null
          completed_at?: string | null
          created_at?: string
          current_stage?: string
          id?: string
          name?: string
          notes?: string | null
          progress?: number
          started_at?: string
          style?: string | null
          target_end_ph?: number | null
          target_fg?: number | null
          target_og?: number | null
          target_ph?: number | null
          target_ta?: number | null
          target_temp_c?: number | null
          updated_at?: string
          user_id?: string
          variety?: string
          volume?: number
          yeast_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blend_batches: {
        Row: {
          attachments: string[] | null
          bottles_150cl: number | null
          bottles_75cl: number | null
          created_at: string
          id: string
          name: string
          notes: string | null
          storage_location: string | null
          total_volume: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          bottles_150cl?: number | null
          bottles_75cl?: number | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          storage_location?: string | null
          total_volume: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: string[] | null
          bottles_150cl?: number | null
          bottles_75cl?: number | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          storage_location?: string | null
          total_volume?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blend_components: {
        Row: {
          blend_batch_id: string
          created_at: string
          id: string
          percentage: number | null
          source_batch_id: string
          spillage: number | null
          volume_liters: number | null
        }
        Insert: {
          blend_batch_id: string
          created_at?: string
          id?: string
          percentage?: number | null
          source_batch_id: string
          spillage?: number | null
          volume_liters?: number | null
        }
        Update: {
          blend_batch_id?: string
          created_at?: string
          id?: string
          percentage?: number | null
          source_batch_id?: string
          spillage?: number | null
          volume_liters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blend_components_blend_batch_id_fkey"
            columns: ["blend_batch_id"]
            isOneToOne: false
            referencedRelation: "blend_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blend_components_source_batch_id_fkey"
            columns: ["source_batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      floor_plan_layouts: {
        Row: {
          created_at: string
          equipment_data: Json
          id: string
          name: string
          notes: string | null
          scenario_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          equipment_data?: Json
          id?: string
          name: string
          notes?: string | null
          scenario_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          equipment_data?: Json
          id?: string
          name?: string
          notes?: string | null
          scenario_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_lots: {
        Row: {
          blend_batch_id: string
          bottling_date: string
          created_at: string
          current_quantity_150cl: number
          current_quantity_75cl: number
          id: string
          initial_quantity_150cl: number
          initial_quantity_75cl: number
          location: string
          lot_number: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blend_batch_id: string
          bottling_date?: string
          created_at?: string
          current_quantity_150cl?: number
          current_quantity_75cl?: number
          id?: string
          initial_quantity_150cl?: number
          initial_quantity_75cl?: number
          location: string
          lot_number: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blend_batch_id?: string
          bottling_date?: string
          created_at?: string
          current_quantity_150cl?: number
          current_quantity_75cl?: number
          id?: string
          initial_quantity_150cl?: number
          initial_quantity_75cl?: number
          location?: string
          lot_number?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_lots_blend_batch_id_fkey"
            columns: ["blend_batch_id"]
            isOneToOne: false
            referencedRelation: "blend_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          from_location: string | null
          id: string
          lot_id: string
          movement_type: string
          notes: string | null
          quantity_150cl: number
          quantity_75cl: number
          reason: string | null
          to_location: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          from_location?: string | null
          id?: string
          lot_id: string
          movement_type: string
          notes?: string | null
          quantity_150cl?: number
          quantity_75cl?: number
          reason?: string | null
          to_location?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          from_location?: string | null
          id?: string
          lot_id?: string
          movement_type?: string
          notes?: string | null
          quantity_150cl?: number
          quantity_75cl?: number
          reason?: string | null
          to_location?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_thresholds: {
        Row: {
          alert_enabled: boolean
          blend_batch_id: string | null
          created_at: string
          id: string
          location: string | null
          min_quantity_150cl: number
          min_quantity_75cl: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_enabled?: boolean
          blend_batch_id?: string | null
          created_at?: string
          id?: string
          location?: string | null
          min_quantity_150cl?: number
          min_quantity_75cl?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_enabled?: boolean
          blend_batch_id?: string | null
          created_at?: string
          id?: string
          location?: string | null
          min_quantity_150cl?: number
          min_quantity_75cl?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_thresholds_blend_batch_id_fkey"
            columns: ["blend_batch_id"]
            isOneToOne: false
            referencedRelation: "blend_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      tasting_analysis: {
        Row: {
          attachments: string[] | null
          blend_batch_id: string | null
          colour: string | null
          competitor_brand: string | null
          created_at: string
          id: string
          notes: string | null
          overall_score: number | null
          palate: string | null
          taste: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          blend_batch_id?: string | null
          colour?: string | null
          competitor_brand?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          overall_score?: number | null
          palate?: string | null
          taste?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: string[] | null
          blend_batch_id?: string | null
          colour?: string | null
          competitor_brand?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          overall_score?: number | null
          palate?: string | null
          taste?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasting_analysis_blend_batch_id_fkey"
            columns: ["blend_batch_id"]
            isOneToOne: false
            referencedRelation: "blend_batches"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "production" | "taster"
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
      app_role: ["production", "taster"],
    },
  },
} as const
