export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: number
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      units: {
        Row: {
          id: number
          unit: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          unit: string
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          unit?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: number
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      price_lists: {
        Row: {
          id: number
          item_id: number
          barcode: string
          store_id: number
          retail_price: number
          unit_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          item_id: number
          barcode: string
          store_id: number
          retail_price: number
          unit_id: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          item_id?: number
          barcode?: string
          store_id?: number
          retail_price?: number
          unit_id?: number
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: number
          full_name: string
          is_store_employee: boolean
          username: string
          email: string
          phone: string
          password_hash: string
          require_password_change: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          full_name: string
          is_store_employee?: boolean
          username: string
          email: string
          phone: string
          password_hash: string
          require_password_change?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          full_name?: string
          is_store_employee?: boolean
          username?: string
          email?: string
          phone?: string
          password_hash?: string
          require_password_change?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: number
          store_id: number
          number: string
          adjust_amount: number
          total: number
          user_id: number
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          store_id: number
          number: string
          adjust_amount: number
          total: number
          user_id: number
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          store_id?: number
          number?: string
          adjust_amount?: number
          total?: number
          user_id?: number
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      invoice_details: {
        Row: {
          id: number
          invoice_id: number
          item_id: number
          price: number
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          invoice_id: number
          item_id: number
          price: number
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          invoice_id?: number
          item_id?: number
          price?: number
          quantity?: number
          created_at?: string
          updated_at?: string
        }
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
