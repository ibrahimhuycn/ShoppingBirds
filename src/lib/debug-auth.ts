/**
 * Emergency auth recovery utilities
 * These functions can be called from browser console if users get stuck
 */

declare global {
  interface Window {
    shoppingBirdDebug: {
      clearAuth: () => Promise<void>;
      checkAuth: () => Promise<void>;
      getStoredData: () => void;
    };
  }
}

export const initializeDebugUtils = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.shoppingBirdDebug = {
      /**
       * Emergency function to clear all authentication data
       * Can be called from browser console: window.shoppingBirdDebug.clearAuth()
       */
      clearAuth: async () => {
        console.log('🚨 Emergency auth clear initiated...');
        
        // Clear localStorage
        localStorage.removeItem('shoppingbird_auth_user');
        localStorage.removeItem('supabase.auth.token');
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear Supabase session
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          await supabase.auth.signOut();
          console.log('✅ Supabase session cleared');
        } catch (error) {
          console.error('❌ Error clearing Supabase session:', error);
        }
        
        console.log('✅ All auth data cleared. Reload the page to continue.');
        
        // Auto-reload after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      },

      /**
       * Check current authentication state
       * Can be called from browser console: window.shoppingBirdDebug.checkAuth()
       */
      checkAuth: async () => {
        console.log('🔍 Checking authentication state...');
        
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ Session check error:', error);
          } else if (session) {
            console.log('✅ Active session found:', {
              user: session.user.email,
              expiresAt: new Date(session.expires_at! * 1000).toLocaleString()
            });
          } else {
            console.log('❌ No active session');
          }
        } catch (error) {
          console.error('❌ Error checking auth:', error);
        }
      },

      /**
       * Show stored authentication data
       * Can be called from browser console: window.shoppingBirdDebug.getStoredData()
       */
      getStoredData: () => {
        console.log('📋 Stored authentication data:');
        
        const storedUser = localStorage.getItem('shoppingbird_auth_user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log('Local user data:', {
              email: userData.email,
              username: userData.username,
              lastFetched: userData.lastFetched ? new Date(userData.lastFetched).toLocaleString() : 'Not set',
              isFallback: userData.isFallback || false
            });
          } catch (error) {
            console.error('❌ Error parsing stored user data:', error);
          }
        } else {
          console.log('❌ No local user data found');
        }
        
        const supabaseToken = localStorage.getItem('supabase.auth.token');
        console.log('Supabase token present:', !!supabaseToken);
        
        console.log('SessionStorage keys:', Object.keys(sessionStorage));
      }
    };

    console.log('🛠️ ShoppingBird debug utilities loaded. Available commands:');
    console.log('  - window.shoppingBirdDebug.clearAuth() - Clear all auth data');
    console.log('  - window.shoppingBirdDebug.checkAuth() - Check current auth state');
    console.log('  - window.shoppingBirdDebug.getStoredData() - Show stored data');
  }
};