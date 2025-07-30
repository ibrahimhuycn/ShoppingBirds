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
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Clear session data (for error recovery)
   */
  static async clearSession(): Promise<void> {
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
   * Get current user from Supabase session with timeout and fallback mechanisms
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // Add timeout to session check with reasonable timeout for network conditions
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout')), 8000)
      );
      
      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
      
      if (!session?.user) {
        // Clear any stale localStorage data
        if (typeof window !== 'undefined') {
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
            // Verify the auth ID matches and data is recent (within 4 hours)
            const now = Date.now();
            const storedTime = authUser.lastFetched || 0;
            const isRecent = now - storedTime < 4 * 60 * 60 * 1000; // 4 hours
            
            if (authUser.authId === session.user.id && isRecent) {
              console.log('Using cached user data');
              return authUser;
            }
          }
        } catch (error) {
          console.error('Error reading stored user:', error);
          localStorage.removeItem(this.STORAGE_KEY);
        }
      }

      // Fetch from database if not in localStorage or ID mismatch
      if (!session.user.email) {
        console.error('No email found in session');
        return null;
      }

      console.log('Fetching user data from database for:', session.user.email);
      
      // Add timeout to database query with reasonable timeout for network conditions
      const dbQueryPromise = supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();
        
      const dbTimeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 8000)
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
          setTimeout(() => reject(new Error('User creation timeout')), 8000)
        );

        const { data: newUser, error: createError } = await Promise.race([createPromise, createTimeoutPromise]);

        if (createError) {
          console.error('Failed to create user profile:', createError);
          // Return a minimal user object to prevent infinite loading
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
      
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      
      // Try to get a basic fallback from session if available
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          return this.createFallbackUser(session.user);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
      
      // Clear localStorage and return null to force re-login
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEY);
      }
      return null;
    }
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