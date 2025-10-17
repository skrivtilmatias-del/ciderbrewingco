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
      activity_comments: {
        Row: {
          activity_id: string
          comment: string
          created_at: string | null
          id: string
          parent_comment_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_id: string
          comment: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string
          comment?: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_comments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "batch_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "activity_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      api_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          name: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      batch_activities: {
        Row: {
          activity_data: Json
          activity_type: string
          batch_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          activity_data?: Json
          activity_type: string
          batch_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          activity_data?: Json
          activity_type?: string
          batch_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_activities_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
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
          abv: number | null
          apple_mix: string | null
          apple_origin: string | null
          archived: boolean | null
          attachments: string[] | null
          completed_at: string | null
          created_at: string
          current_stage: string
          deleted_by_id: string | null
          expected_completion_date: string | null
          id: string
          location: string | null
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
          updated_by_id: string | null
          user_id: string
          variety: string
          version: number | null
          volume: number
          yeast_type: string | null
        }
        Insert: {
          abv?: number | null
          apple_mix?: string | null
          apple_origin?: string | null
          archived?: boolean | null
          attachments?: string[] | null
          completed_at?: string | null
          created_at?: string
          current_stage: string
          deleted_by_id?: string | null
          expected_completion_date?: string | null
          id?: string
          location?: string | null
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
          updated_by_id?: string | null
          user_id: string
          variety: string
          version?: number | null
          volume: number
          yeast_type?: string | null
        }
        Update: {
          abv?: number | null
          apple_mix?: string | null
          apple_origin?: string | null
          archived?: boolean | null
          attachments?: string[] | null
          completed_at?: string | null
          created_at?: string
          current_stage?: string
          deleted_by_id?: string | null
          expected_completion_date?: string | null
          id?: string
          location?: string | null
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
          updated_by_id?: string | null
          user_id?: string
          variety?: string
          version?: number | null
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
      contracts: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          min_qty: number
          notes: string | null
          price_per_unit: number
          product: string
          start_date: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          min_qty: number
          notes?: string | null
          price_per_unit: number
          product: string
          start_date: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          min_qty?: number
          notes?: string | null
          price_per_unit?: number
          product?: string
          start_date?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          created_at: string
          delivery_date: string
          id: string
          lot_code: string
          notes: string | null
          price_per_kg: number
          product: string
          qty_kg: number
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_date?: string
          id?: string
          lot_code: string
          notes?: string | null
          price_per_kg: number
          product: string
          qty_kg: number
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_date?: string
          id?: string
          lot_code?: string
          notes?: string | null
          price_per_kg?: number
          product?: string
          qty_kg?: number
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      filter_presets: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters: Json
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      press_results: {
        Row: {
          brix: number | null
          created_at: string
          delivery_id: string
          id: string
          juice_l: number
          notes: string | null
          ph: number | null
          pomace_kg: number
          updated_at: string
        }
        Insert: {
          brix?: number | null
          created_at?: string
          delivery_id: string
          id?: string
          juice_l: number
          notes?: string | null
          ph?: number | null
          pomace_kg: number
          updated_at?: string
        }
        Update: {
          brix?: number | null
          created_at?: string
          delivery_id?: string
          id?: string
          juice_l?: number
          notes?: string | null
          ph?: number | null
          pomace_kg?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "press_results_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
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
      qc_incidents: {
        Row: {
          created_at: string
          delivery_id: string
          id: string
          incident_type: string
          notes: string | null
          qty_kg: number
          severity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_id: string
          id?: string
          incident_type: string
          notes?: string | null
          qty_kg?: number
          severity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_id?: string
          id?: string
          incident_type?: string
          notes?: string | null
          qty_kg?: number
          severity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qc_incidents_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          avg_lead_time_days: number | null
          category: string | null
          contact: string | null
          created_at: string
          defect_rate: number | null
          email: string | null
          food_safety_certified: boolean | null
          id: string
          is_preferred: boolean | null
          name: string
          notes: string | null
          on_time_delivery_rate: number | null
          organic_certified: boolean | null
          payment_net_days: number | null
          phone: string | null
          primary_contact_name: string | null
          quality_score: number | null
          rating: number | null
          reliability_rating: number | null
          status: string | null
          tax_id: string | null
          terms: string | null
          total_spend_ytd: number | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          avg_lead_time_days?: number | null
          category?: string | null
          contact?: string | null
          created_at?: string
          defect_rate?: number | null
          email?: string | null
          food_safety_certified?: boolean | null
          id?: string
          is_preferred?: boolean | null
          name: string
          notes?: string | null
          on_time_delivery_rate?: number | null
          organic_certified?: boolean | null
          payment_net_days?: number | null
          phone?: string | null
          primary_contact_name?: string | null
          quality_score?: number | null
          rating?: number | null
          reliability_rating?: number | null
          status?: string | null
          tax_id?: string | null
          terms?: string | null
          total_spend_ytd?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          avg_lead_time_days?: number | null
          category?: string | null
          contact?: string | null
          created_at?: string
          defect_rate?: number | null
          email?: string | null
          food_safety_certified?: boolean | null
          id?: string
          is_preferred?: boolean | null
          name?: string
          notes?: string | null
          on_time_delivery_rate?: number | null
          organic_certified?: boolean | null
          payment_net_days?: number | null
          phone?: string | null
          primary_contact_name?: string | null
          quality_score?: number | null
          rating?: number | null
          reliability_rating?: number | null
          status?: string | null
          tax_id?: string | null
          terms?: string | null
          total_spend_ytd?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
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
      webhook_configs: {
        Row: {
          created_at: string
          endpoint_url: string
          events: string[]
          id: string
          is_active: boolean
          name: string
          secret: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint_url: string
          events?: string[]
          id?: string
          is_active?: boolean
          name: string
          secret: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint_url?: string
          events?: string[]
          id?: string
          is_active?: boolean
          name?: string
          secret?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          attempt_count: number
          created_at: string
          delivered_at: string | null
          event_type: string
          failed_at: string | null
          id: string
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          webhook_config_id: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          delivered_at?: string | null
          event_type: string
          failed_at?: string | null
          id?: string
          next_retry_at?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          webhook_config_id: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          delivered_at?: string | null
          event_type?: string
          failed_at?: string | null
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          webhook_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_config_id_fkey"
            columns: ["webhook_config_id"]
            isOneToOne: false
            referencedRelation: "webhook_configs"
            referencedColumns: ["id"]
          },
        ]
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
