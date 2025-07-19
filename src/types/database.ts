export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      invoice_details: {
        Row: {
          created_at: string | null
          id: number
          invoice_id: number
          item_id: number
          price: number
          quantity: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          invoice_id: number
          item_id: number
          price: number
          quantity: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          invoice_id?: number
          item_id?: number
          price?: number
          quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_details_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_details_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          adjust_amount: number
          created_at: string | null
          date: string
          id: number
          number: string
          store_id: number
          total: number
          updated_at: string | null
          user_id: number
        }
        Insert: {
          adjust_amount?: number
          created_at?: string | null
          date: string
          id?: number
          number: string
          store_id: number
          total: number
          updated_at?: string | null
          user_id: number
        }
        Update: {
          adjust_amount?: number
          created_at?: string | null
          date?: string
          id?: number
          number?: string
          store_id?: number
          total?: number
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      item_tags: {
        Row: {
          created_at: string | null
          id: number
          item_id: number
          tag_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          item_id: number
          tag_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          item_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "item_tags_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          asin: string | null
          brand: string | null
          category: string | null
          created_at: string | null
          currency: string | null
          description: string
          dimension: string | null
          ean: string | null
          full_description: string | null
          gtin: string | null
          highest_recorded_price: number | null
          id: number
          images: string[] | null
          lowest_recorded_price: number | null
          model: string | null
          title: string | null
          upc: string | null
          updated_at: string | null
          weight: string | null
        }
        Insert: {
          asin?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description: string
          dimension?: string | null
          ean?: string | null
          full_description?: string | null
          gtin?: string | null
          highest_recorded_price?: number | null
          id?: number
          images?: string[] | null
          lowest_recorded_price?: number | null
          model?: string | null
          title?: string | null
          upc?: string | null
          updated_at?: string | null
          weight?: string | null
        }
        Update: {
          asin?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string
          dimension?: string | null
          ean?: string | null
          full_description?: string | null
          gtin?: string | null
          highest_recorded_price?: number | null
          id?: number
          images?: string[] | null
          lowest_recorded_price?: number | null
          model?: string | null
          title?: string | null
          upc?: string | null
          updated_at?: string | null
          weight?: string | null
        }
        Relationships: []
      }
      price_change_history: {
        Row: {
          barcode: string
          change_reason: string | null
          change_type: string
          changed_by: number | null
          created_at: string | null
          effective_date: string
          id: number
          item_id: number
          new_currency: string
          new_price: number
          old_currency: string | null
          old_price: number | null
          previous_effective_date: string | null
          price_list_id: number | null
          store_id: number
          unit_id: number | null
        }
        Insert: {
          barcode: string
          change_reason?: string | null
          change_type: string
          changed_by?: number | null
          created_at?: string | null
          effective_date?: string
          id?: number
          item_id: number
          new_currency?: string
          new_price: number
          old_currency?: string | null
          old_price?: number | null
          previous_effective_date?: string | null
          price_list_id?: number | null
          store_id: number
          unit_id?: number | null
        }
        Update: {
          barcode?: string
          change_reason?: string | null
          change_type?: string
          changed_by?: number | null
          created_at?: string | null
          effective_date?: string
          id?: number
          item_id?: number
          new_currency?: string
          new_price?: number
          old_currency?: string | null
          old_price?: number | null
          previous_effective_date?: string | null
          price_list_id?: number | null
          store_id?: number
          unit_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "price_change_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_change_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_change_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_change_history_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          created_at: string | null
          currency: string | null
          date_recorded: string
          id: number
          item_id: number
          price: number
          source: string | null
          store_id: number
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          date_recorded?: string
          id?: number
          item_id: number
          price: number
          source?: string | null
          store_id: number
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          date_recorded?: string
          id?: number
          item_id?: number
          price?: number
          source?: string | null
          store_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          barcode: string
          created_at: string | null
          currency: string | null
          id: number
          is_active: boolean | null
          item_id: number
          price_effective_date: string | null
          retail_price: number
          store_id: number
          unit_id: number
          updated_at: string | null
        }
        Insert: {
          barcode: string
          created_at?: string | null
          currency?: string | null
          id?: number
          is_active?: boolean | null
          item_id: number
          price_effective_date?: string | null
          retail_price: number
          store_id: number
          unit_id: number
          updated_at?: string | null
        }
        Update: {
          barcode?: string
          created_at?: string | null
          currency?: string | null
          id?: number
          is_active?: boolean | null
          item_id?: number
          price_effective_date?: string | null
          retail_price?: number
          store_id?: number
          unit_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_lists_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_lists_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_lists_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: number
          name: string
          tag_type: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: number
          name: string
          tag_type?: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: number
          name?: string
          tag_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          created_at: string | null
          description: string
          id: number
          unit: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: number
          unit: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: number
          unit?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: number
          is_store_employee: boolean
          password_hash: string
          phone: string
          require_password_change: boolean
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: number
          is_store_employee?: boolean
          password_hash: string
          phone: string
          require_password_change?: boolean
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: number
          is_store_employee?: boolean
          password_hash?: string
          phone?: string
          require_password_change?: boolean
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      price_trend_analysis: {
        Row: {
          barcode: string | null
          brand: string | null
          category: string | null
          change_reason: string | null
          change_timestamp: string | null
          change_type: string | null
          effective_date: string | null
          item_description: string | null
          item_id: number | null
          new_currency: string | null
          new_price: number | null
          old_currency: string | null
          old_price: number | null
          price_change_amount: number | null
          price_change_percentage: number | null
          store_id: number | null
          store_name: string | null
          unit: string | null
          unit_description: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_change_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_change_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
