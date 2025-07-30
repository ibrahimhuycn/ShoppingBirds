"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AuthService, AuthUser } from '@/lib/auth';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithUsername: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isComponentMounted = true;
    let isInitializing = false;

    // Initialize auth state with improved error handling
    const initializeAuth = async () => {
      if (!isComponentMounted || isInitializing) return;
      
      isInitializing = true;
      console.log('Auth initialization starting...');
      
      try {
        const currentUser = await AuthService.getCurrentUser();

        if (isComponentMounted) {
          setUser(currentUser);
          console.log('Auth initialized successfully:', currentUser?.email || 'No user');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);

        if (isComponentMounted) {
          // Don't clear session data unless we're certain it's invalid
          // The improved AuthService will handle fallbacks appropriately
          setUser(null);
        }
      } finally {
        if (isComponentMounted) {
          setIsLoading(false);
          isInitializing = false;
        }
      }
    };

    // Start initialization
    initializeAuth();

    // Listen for auth state changes with improved error handling
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event: string, session: Session | null) => {
        if (!isComponentMounted || isInitializing) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Handle different auth events appropriately
        if (event === 'TOKEN_REFRESHED') {
          // For token refresh, silently update user data without showing loading
          if (session?.user && isComponentMounted) {
            try {
              // Use cached data only to avoid database calls during token refresh
              const cached = AuthService.getCurrentUserFromCache();
              if (cached && cached.authId === session.user.id) {
                // Update cache timestamp to keep it fresh
                const updatedUser = {
                  ...cached,
                  lastFetched: Date.now()
                };
                setUser(updatedUser);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('shoppingbird_auth_user', JSON.stringify(updatedUser));
                }
                console.log('Token refreshed, cache updated silently');
              }
            } catch (error) {
              console.error('Error during token refresh user update:', error);
              // Don't fail on token refresh errors, keep current user state
            }
          }
          return; // Exit early, don't change loading state
        }
        
        // Prevent multiple simultaneous auth state changes from interfering
        if (isInitializing) {
          console.log('Skipping auth state change - initialization in progress');
          return;
        }
        
        // For other auth events, show loading only when necessary and current user is null
        const shouldShowLoading = (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED');
        if (shouldShowLoading) {
          setIsLoading(true);
        }
        
        try {
          if (session?.user) {
            const currentUser = await AuthService.getCurrentUser();
            if (isComponentMounted) {
              setUser(currentUser);
            }
          } else {
            if (isComponentMounted) {
              setUser(null);
              // Clear localStorage when signed out
              if (typeof window !== 'undefined') {
                localStorage.removeItem('shoppingbird_auth_user');
              }
            }
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          if (isComponentMounted) {
            // Don't immediately set user to null, let the auth service handle fallbacks
            const cached = AuthService.getCurrentUserFromCache();
            if (!cached) {
              setUser(null);
            }
          }
        } finally {
          // Only set loading to false if we set it to true
          if (isComponentMounted && shouldShowLoading) {
            setIsLoading(false);
          }
        }
      }
    );

    // Cleanup function
    return () => {
      isComponentMounted = false;
      isInitializing = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const authUser = await AuthService.login(email, password);
      setUser(authUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithUsername = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const authUser = await AuthService.loginWithUsername(username, password);
      setUser(authUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear the user state even if logout fails
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    loginWithUsername,
    logout,
    isLoading,
    isAuthenticated: user !== null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}