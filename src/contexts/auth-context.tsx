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
  const initializationAttempts = useRef(0);
  const maxInitializationAttempts = 3;
  const initializationTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isComponentMounted = true;

    // Initialize auth state with better error handling and timeout
    const initializeAuth = async () => {
      if (!isComponentMounted) return;
      
      initializationAttempts.current += 1;
      console.log(`Auth initialization attempt ${initializationAttempts.current}/${maxInitializationAttempts}`);
      
      try {
        // Set a hard timeout for the entire initialization process
        const initPromise = AuthService.getCurrentUser();
        const timeoutPromise = new Promise<AuthUser | null>((_, reject) => {
          initializationTimeout.current = setTimeout(() => {
            reject(new Error('Auth initialization timeout'));
          }, 10000); // 10 second timeout
        });

        const currentUser = await Promise.race([initPromise, timeoutPromise]);
        
        if (initializationTimeout.current) {
          clearTimeout(initializationTimeout.current);
          initializationTimeout.current = null;
        }

        if (isComponentMounted) {
          setUser(currentUser);
          console.log('Auth initialized successfully:', currentUser?.email || 'No user');
        }
      } catch (error) {
        console.error(`Auth initialization error (attempt ${initializationAttempts.current}):`, error);
        
        if (initializationTimeout.current) {
          clearTimeout(initializationTimeout.current);
          initializationTimeout.current = null;
        }

        if (isComponentMounted) {
          // If we've exceeded max attempts or it's a critical error, clear auth state
          if (initializationAttempts.current >= maxInitializationAttempts || 
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
        
        try {
          if (session?.user) {
            // Reset initialization attempts on successful auth state change
            initializationAttempts.current = 0;
            
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
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current);
      }
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const authUser = await AuthService.login(email, password);
      setUser(authUser);
      // Reset initialization attempts on successful login
      initializationAttempts.current = 0;
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
      // Reset initialization attempts on successful login
      initializationAttempts.current = 0;
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
      // Reset initialization attempts
      initializationAttempts.current = 0;
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