import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configure session management for better token refresh handling
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for SPA to avoid URL-based auth issues
    // Reduce token refresh frequency to minimize disruptions
    refreshTokenMarginSeconds: 300, // Refresh 5 minutes before expiry
  },
  global: {
    headers: {
      'X-Client-Info': 'shoppingbird-pos'
    }
  }
});
