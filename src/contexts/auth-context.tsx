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
    let initializationAttempts = 0;
    const maxInitializationAttempts = 3;
    let initializationTimeout: NodeJS.Timeout | null = null;

    // Initialize auth state with better error handling and timeout
    const initializeAuth = async () => {
      if (!isComponentMounted) return;
      
      initializationAttempts += 1;
      console.log(`Auth initialization attempt ${initializationAttempts}/${maxInitializationAttempts}`);
      
      try {
        // Set a hard timeout for the entire initialization process
        const initPromise = AuthService.getCurrentUser();
        const timeoutPromise = new Promise<AuthUser | null>((_, reject) => {
          initializationTimeout = setTimeout(() => {
            reject(new Error('Auth initialization timeout'));
          }, 15000); // 15 second timeout for initialization
        });

        const currentUser = await Promise.race([initPromise, timeoutPromise]);
        
        if (initializationTimeout) {
          clearTimeout(initializationTimeout);
          initializationTimeout = null;
        }

        if (isComponentMounted) {
          setUser(currentUser);
          console.log('Auth initialized successfully:', currentUser?.email || 'No user');
        }
      } catch (error) {
        console.error(`Auth initialization error (attempt ${initializationAttempts}):`, error);
        
        if (initializationTimeout) {
          clearTimeout(initializationTimeout);
          initializationTimeout = null;
        }

        if (isComponentMounted) {
          // If we've exceeded max attempts or it's a critical error, clear auth state
          if (initializationAttempts >= maxInitializationAttempts || 
              (error instanceof Error && error.message.includes('timeout'))) {
            console.log('Max initialization attempts reached or timeout, clearing auth state');
            setUser(null);
            // Clear any stale session data
            try {
              await AuthService.clearSession();
            } catch (clearError) {
              console.error('Error clearing session:', clearError);
            }
          } else {
            // Retry after a short delay
            setTimeout(() => {
              if (isComponentMounted) {
                initializeAuth();
                return; // Don't set loading to false yet
              }
            }, 2000);
            return; // Don't set loading to false yet
          }
        }
      } finally {
        if (isComponentMounted) {
          setIsLoading(false);
        }
      }
    };

    // Start initialization
    initializeAuth();

    // Listen for auth state changes with better error handling
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event: string, session: Session | null) => {
        if (!isComponentMounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Reset loading state when auth state changes
        setIsLoading(true);
        
        try {
          if (session?.user) {
            // Reset initialization attempts on successful auth state change
            initializationAttempts = 0;
            
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
            setUser(null);
          }
        } finally {
          if (isComponentMounted) {
            setIsLoading(false);
          }
        }
      }
    );

    // Cleanup function
    return () => {
      isComponentMounted = false;
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
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