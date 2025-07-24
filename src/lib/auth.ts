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
   * Get current user from Supabase session
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return null;
    }

    // Try to get from localStorage first for performance
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const authUser = JSON.parse(stored);
          // Verify the auth ID matches
          if (authUser.authId === session.user.id) {
            return authUser;
          }
        }
      } catch (error) {
        console.error('Error reading stored user:', error);
      }
    }

    // Fetch from database if not in localStorage or ID mismatch
    if (!session.user.email) {
      return null;
    }

    let { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

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

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert(defaultUserData)
        .select()
        .single();

      if (createError) {
        console.error('Failed to create user profile:', createError);
        return null;
      }

      userData = newUser;
    } else if (error) {
      console.error('Database error getting user:', error);
      return null;
    }

    if (!userData) {
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
      authId: userData.auth_id || session.user.id,
    };

    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authUser));
    }

    return authUser;
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