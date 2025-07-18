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
      items: {
        Row: {
          created_at: string | null
          description: string
          id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      price_lists: {
        Row: {
          barcode: string
          created_at: string | null
          id: number
          item_id: number
          retail_price: number
          store_id: number
          unit_id: number
          updated_at: string | null
        }
        Insert: {
          barcode: string
          created_at?: string | null
          id?: number
          item_id: number
          retail_price: number
          store_id: number
          unit_id: number
          updated_at?: string | null
        }
        Update: {
          barcode?: string
          created_at?: string | null
          id?: number
          item_id?: number
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
      [_ in never]: never
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
