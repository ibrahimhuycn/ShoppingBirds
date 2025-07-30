import { supabase } from './supabase';
import type { Database } from '@/types/database';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  isStoreEmployee: boolean;
  requirePasswordChange: boolean;
  authId?: string; // Supabase auth.users UUID (optional until migration is run)
  lastFetched?: number; // Timestamp for cache validation
  isFallback?: boolean; // Flag to indicate this is a fallback user when database is unavailable
}

export class AuthService {
  private static readonly STORAGE_KEY = 'shoppingbird_auth_user';
  private static currentUserPromise: Promise<AuthUser | null> | null = null;
  private static isRefreshing = false;

  /**
   * Login with email and password using Supabase Auth
   */
  static async login(email: string, password: string): Promise<AuthUser> {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Invalid email or password');
    }

    // Get the corresponding user from public.users table
    if (!authData.user.email) {
      throw new Error('User email not found');
    }

    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', authData.user.email)
      .single();

    // If user profile doesn't exist, create it automatically
    if (userError && userError.code === 'PGRST116') { // No rows returned
      console.log('Creating missing user profile for:', authData.user.email);
      
      const defaultUserData = {
        email: authData.user.email,
        username: authData.user.email.split('@')[0], // Default username from email
        full_name: authData.user.user_metadata?.full_name || '',
        phone: authData.user.user_metadata?.phone || '',
        password_hash: '', // Not needed with Supabase Auth
        is_store_employee: false,
        require_password_change: false,
      };

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert(defaultUserData)
        .select()
        .single();

      if (createError) {
        console.error('Failed to create user profile:', createError);
        throw new Error(`Failed to create user profile: ${createError.message}`);
      }

      userData = newUser;
    } else if (userError) {
      throw new Error(`Database error: ${userError.message}`);
    }

    if (!userData) {
      throw new Error('User profile not found');
    }

    const authUser: AuthUser = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      fullName: userData.full_name,
      phone: userData.phone,
      isStoreEmployee: userData.is_store_employee,
      requirePasswordChange: userData.require_password_change,
      authId: userData.auth_id || authData.user.id,
    };

    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authUser));
    }

    return authUser;
  }

  /**
   * Login with username (fallback for existing users)
   */
  static async loginWithUsername(username: string, password: string): Promise<AuthUser> {
    // First get the email from username
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      throw new Error('Invalid username or password');
    }

    // Use the email to login
    return this.login(userData.email, password);
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<void> {
    // Clear any pending getCurrentUser requests
    this.currentUserPromise = null;
    this.isRefreshing = false;
    
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Clear session data (for error recovery)
   */
  static async clearSession(): Promise<void> {
    // Clear any pending getCurrentUser requests
    this.currentUserPromise = null;
    this.isRefreshing = false;
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
      // Also clear any other session-related data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
    }
  }

  /**
   * Get current user from cache without database calls (for token refresh)
   */
  static getCurrentUserFromCache(): AuthUser | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const authUser = JSON.parse(stored);
        // Return cached data regardless of timestamp for token refresh
        return authUser;
      }
    } catch (error) {
      console.error('Error reading cached user:', error);
    }

    return null;
  }

  /**
   * Get current user from Supabase session with request deduplication and improved error handling
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    // Request deduplication - if a request is already in progress, return the same promise
    if (this.currentUserPromise) {
      console.log('Reusing existing getCurrentUser request');
      return this.currentUserPromise;
    }

    // Create and store the promise for deduplication
    this.currentUserPromise = this._getCurrentUserInternal();
    
    try {
      const result = await this.currentUserPromise;
      return result;
    } finally {
      // Clear the promise after completion (success or failure)
      this.currentUserPromise = null;
    }
  }

  /**
   * Check if we have valid cached auth data that can bypass Supabase session check
   */
  private static hasValidCachedAuth(): { user: AuthUser | null; isValid: boolean } {
    if (typeof window === 'undefined') {
      return { user: null, isValid: false };
    }

    try {
      // Check for both our auth user and Supabase token
      const storedUser = localStorage.getItem(this.STORAGE_KEY);
      const supabaseToken = localStorage.getItem('sb-pgvjxrivrxshxlwiznkn-auth-token');
      
      if (!storedUser || !supabaseToken) {
        return { user: null, isValid: false };
      }

      const authUser = JSON.parse(storedUser);
      const tokenData = JSON.parse(supabaseToken);
      
      // Check if token is still valid (not expired)
      const now = Date.now() / 1000; // Convert to seconds
      const isTokenValid = tokenData?.expires_at ? tokenData.expires_at > now : false;
      
      // Check if our cached user data is recent (within 2 hours)
      const userDataAge = authUser?.lastFetched ? (Date.now() - authUser.lastFetched) : Infinity;
      const isUserDataRecent = userDataAge < 2 * 60 * 60 * 1000; // 2 hours
      
      const isValid = isTokenValid && isUserDataRecent;
      
      console.log('🔍 Cached auth check:', {
        hasStoredUser: !!storedUser,
        hasSupabaseToken: !!supabaseToken,
        isTokenValid,
        userDataAge: Math.floor(userDataAge / 1000),
        isUserDataRecent,
        isValid
      });
      
      return { user: isValid ? authUser : null, isValid };
    } catch (error) {
      console.error('Error checking cached auth:', error);
      return { user: null, isValid: false };
    }
  }

  /**
   * Internal method that does the actual work of getting the current user
   */
  private static async _getCurrentUserInternal(): Promise<AuthUser | null> {
    // First, check if we have valid cached auth data to avoid problematic getSession() calls
    const cachedAuth = this.hasValidCachedAuth();
    if (cachedAuth.isValid && cachedAuth.user) {
      console.log('✅ Using valid cached auth data, skipping Supabase session check');
      return cachedAuth.user;
    }
    
    console.log('🔄 Cached auth not valid, proceeding with Supabase session check');
    
    const maxRetries = 2;
    let retryCount = 0;
    
    // Debug Supabase client state
    console.log('🧪 Debug Supabase client state:', {
      hasSupabase: !!supabase,
      supabaseUrl: supabase?.supabaseUrl,
      isClientSide: typeof window !== 'undefined',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
    });
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`Getting current user (attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        // Check localStorage first for debugging
        if (typeof window !== 'undefined') {
          console.log('🔍 LocalStorage check:', {
            hasAuthUser: !!localStorage.getItem(this.STORAGE_KEY),
            hasSupabaseToken: !!localStorage.getItem('sb-pgvjxrivrxshxlwiznkn-auth-token'),
            allKeys: Object.keys(localStorage).filter(k => k.includes('auth') || k.includes('supabase') || k.includes('sb-')),
            localStorageLength: localStorage.length
          });
        }
        
        // Try a much shorter timeout first to see if getSession() is responsive
        const quickTimeout = 2000; // 2 seconds
        console.log(`🕐 Quick session check with ${quickTimeout}ms timeout...`);
        
        const quickSessionPromise = supabase.auth.getSession();
        const quickTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            console.warn(`⚠️ Quick session check timed out, getSession() appears blocked`);
            reject(new Error('Quick session check timeout'));
          }, quickTimeout);
        });
        
        console.log('🚀 Calling supabase.auth.getSession() (quick check)...');
        const quickStart = Date.now();
        
        try {
          const { data: { session } } = await Promise.race([quickSessionPromise, quickTimeoutPromise]);
          const quickDuration = Date.now() - quickStart;
          
          console.log(`✅ Quick session check completed in ${quickDuration}ms:`, {
            hasSession: !!session,
            hasUser: !!session?.user,
            userEmail: session?.user?.email,
            sessionValid: session?.expires_at ? new Date(session.expires_at * 1000) > new Date() : false,
            expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
          });
          
          // Success! Continue with normal flow
          return await this.processSessionResult(session, retryCount, maxRetries);
        } catch (quickError) {
          // Quick check failed, try fallback strategies
          console.log('🚨 Quick session check failed, trying fallback strategies...');
          
          // Strategy 1: Use cached data if available, even if slightly stale
          if (cachedAuth.user) {
            console.log('💾 Using slightly stale cached data as fallback');
            return cachedAuth.user;
          }
          
          // Strategy 2: Try to reconstruct auth from localStorage tokens directly
          const fallbackUser = await this.reconstructUserFromStorage();
          if (fallbackUser) {
            console.log('⚙️ Successfully reconstructed user from storage');
            return fallbackUser;
          }
          
          // Strategy 3: If this is a retry, give up to prevent infinite hanging
          if (retryCount > 0) {
            console.log('🚨 Multiple attempts failed, clearing potentially corrupted session');
            await this.clearSession();
            return null;
          }
          
          // For first attempt, try one more time with longer timeout
          throw quickError;
        }
        
      } catch (error) {
        console.error(`Error in getCurrentUser (attempt ${retryCount + 1}):`, error);
        
        // If this is not the final retry, wait and try again
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Final attempt failed - use fallback strategies
        console.log('🚨 All attempts failed, using final fallback strategies...');
        
        // Try cached data one more time, even if stale
        if (cachedAuth.user) {
          console.log('💾 Using stale cached data as last resort');
          return cachedAuth.user;
        }
        
        // Try storage reconstruction as final fallback
        const fallbackUser = await this.reconstructUserFromStorage();
        if (fallbackUser) {
          console.log('⚙️ Successfully reconstructed user as final fallback');
          return fallbackUser;
        }
        
        // Clear potentially corrupted session data
        console.log('🧼 Clearing potentially corrupted session data');
        await this.clearSession();
        return null;
      }
    }
    
    return null; // Should never reach here
  }

  /**
   * Try to reconstruct user from localStorage tokens without using getSession()
   */
  private static async reconstructUserFromStorage(): Promise<AuthUser | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      console.log('🔧 Attempting to reconstruct user from localStorage...');
      
      const supabaseToken = localStorage.getItem('sb-pgvjxrivrxshxlwiznkn-auth-token');
      if (!supabaseToken) {
        console.log('❌ No Supabase token found in storage');
        return null;
      }

      const tokenData = JSON.parse(supabaseToken);
      const accessToken = tokenData?.access_token;
      const userEmail = tokenData?.user?.email;
      
      if (!accessToken || !userEmail) {
        console.log('❌ Invalid token data structure');
        return null;
      }

      // Check if token is still valid
      const now = Date.now() / 1000;
      const isTokenValid = tokenData?.expires_at ? tokenData.expires_at > now : false;
      
      if (!isTokenValid) {
        console.log('❌ Token is expired');
        return null;
      }

      console.log('🚀 Token is valid, fetching user from database directly...');
      
      // Fetch user directly from database using the email
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (error || !userData) {
        console.error('❌ Failed to fetch user from database:', error);
        return null;
      }

      const authUser: AuthUser = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        fullName: userData.full_name,
        phone: userData.phone,
        isStoreEmployee: userData.is_store_employee,
        requirePasswordChange: userData.require_password_change,
        authId: userData.auth_id || tokenData.user.id,
        lastFetched: Date.now(),
      };

      // Store in localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authUser));
      
      console.log('✅ Successfully reconstructed user from storage');
      return authUser;
    } catch (error) {
      console.error('❌ Error reconstructing user from storage:', error);
      return null;
    }
  }

  /**
   * Process session result and handle user data fetching
   */
  private static async processSessionResult(session: any, retryCount: number, maxRetries: number): Promise<AuthUser | null> {
    if (!session?.user) {
      // Only clear localStorage if we're sure there's no session
      if (typeof window !== 'undefined' && retryCount === maxRetries) {
        localStorage.removeItem(this.STORAGE_KEY);
      }
      return null;
    }

    // Try to get from localStorage first for performance
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const authUser = JSON.parse(stored);
          // Verify the auth ID matches and data is recent (within 6 hours for better UX)
          const now = Date.now();
          const storedTime = authUser.lastFetched || 0;
          const isRecent = now - storedTime < 6 * 60 * 60 * 1000; // 6 hours
          
          if (authUser.authId === session.user.id && isRecent) {
            console.log('Using cached user data');
            return authUser;
          }
        }
      } catch (error) {
        console.error('Error reading stored user:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(this.STORAGE_KEY);
        }
      }
    }

    // Fetch from database if not in localStorage or ID mismatch
    if (!session.user.email) {
      console.error('No email found in session');
      return this.createFallbackUser(session.user);
    }

    console.log('Fetching user data from database for:', session.user.email);
    
    // Database query with appropriate timeout
    const dbTimeout = retryCount === 0 ? 15000 : 8000;
    const dbQueryPromise = supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();
      
    const dbTimeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), dbTimeout)
    );
    
    let { data: userData, error } = await Promise.race([dbQueryPromise, dbTimeoutPromise]);

    // If user profile doesn't exist, create it automatically
    if (error && error.code === 'PGRST116') { // No rows returned
      console.log('Creating missing user profile for:', session.user.email);
      
      const defaultUserData = {
        email: session.user.email,
        username: session.user.email.split('@')[0], // Default username from email
        full_name: session.user.user_metadata?.full_name || '',
        phone: session.user.user_metadata?.phone || '',
        password_hash: '', // Not needed with Supabase Auth
        is_store_employee: false,
        require_password_change: false,
      };

      const createPromise = supabase
        .from('users')
        .insert(defaultUserData)
        .select()
        .single();
        
      const createTimeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('User creation timeout')), 10000)
      );

      const { data: newUser, error: createError } = await Promise.race([createPromise, createTimeoutPromise]);

      if (createError) {
        console.error('Failed to create user profile:', createError);
        // Return a fallback user to prevent infinite loading
        return this.createFallbackUser(session.user);
      }

      userData = newUser;
    } else if (error) {
      console.error('Database error getting user:', error);
      // Return a fallback user to prevent infinite loading
      return this.createFallbackUser(session.user);
    }

    if (!userData) {
      console.error('No user data found');
      return this.createFallbackUser(session.user);
    }

    const authUser: AuthUser = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      fullName: userData.full_name,
      phone: userData.phone,
      isStoreEmployee: userData.is_store_employee,
      requirePasswordChange: userData.require_password_change,
      authId: userData.auth_id || session.user.id,
      lastFetched: Date.now(), // Add timestamp for cache validation
    };

    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authUser));
    }

    console.log('Successfully loaded user:', authUser.email);
    return authUser;
  }

  /**
   * Create a fallback user object from Supabase session when database is unavailable
   */
  private static createFallbackUser(sessionUser: any): AuthUser {
    return {
      id: 0, // Temporary ID
      username: sessionUser.email?.split('@')[0] || 'user',
      email: sessionUser.email || '',
      fullName: sessionUser.user_metadata?.full_name || '',
      phone: sessionUser.user_metadata?.phone || '',
      isStoreEmployee: false,
      requirePasswordChange: false,
      authId: sessionUser.id,
      lastFetched: Date.now(),
      isFallback: true, // Flag to indicate this is a fallback user
    };
  }

  /**
   * Get current user synchronously from localStorage (for backwards compatibility)
   */
  static getCurrentUserSync(): AuthUser | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading stored user:', error);
      this.logout();
    }

    return null;
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return session !== null;
  }

  /**
   * Create a new user with Supabase Auth
   */
  static async createUser(userData: {
    username: string;
    email: string;
    fullName: string;
    phone: string;
    password: string;
    isStoreEmployee?: boolean;
    requirePasswordChange?: boolean;
  }): Promise<User> {
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user');
    }

    // Create the profile in public.users (this should be done via trigger, but we'll handle it here for now)
    const insertData: UserInsert = {
      username: userData.username,
      email: userData.email,
      full_name: userData.fullName,
      phone: userData.phone,
      password_hash: '', // Not needed anymore, managed by Supabase Auth
      is_store_employee: userData.isStoreEmployee || false,
      require_password_change: userData.requirePasswordChange || false,
    };

    const { data, error } = await supabase
      .from('users')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // Clean up auth user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Username or email already exists');
      }
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Change user password using Supabase Auth
   */
  static async changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(error.message);
    }

    // Update the require_password_change flag in public.users
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      await supabase
        .from('users')
        .update({ 
          require_password_change: false,
          updated_at: new Date().toISOString()
        })
        .eq('email', user.email);
    }
  }

  /**
   * Get all users (for user management)
   */
  static async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('full_name');

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Update user information
   */
  static async updateUser(userId: number, updates: Partial<UserUpdate>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: number): Promise<void> {
    // First get the user's email to find the auth user
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    // Delete from public.users
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw new Error(error.message);
    }

    // Note: Deleting from auth.users requires service role and should be done server-side
    // For now, we just delete from public.users
  }

  /**
   * Reset user password (admin function) - triggers password reset email
   */
  static async resetUserPassword(userEmail: string): Promise<void> {
    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail);

    if (error) {
      throw new Error(error.message);
    }

    // Update the require_password_change flag
    await supabase
      .from('users')
      .update({ 
        require_password_change: true,
        updated_at: new Date().toISOString()
      })
      .eq('email', userEmail);
  }

  /**
   * Listen for auth state changes
   */
  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}