
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, type AuthUser } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetchUser = async () => {
    try {
      console.log('Refetching user...');
      setError(null);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      console.log('User refetched:', currentUser ? 'Success' : 'No user');
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to load user data');
      setUser(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initAuth = async () => {
      try {
        console.log('Initializing auth...');
        setError(null);
        
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.log('Auth initialization timeout');
            setError('Authentication is taking too long. Please refresh the page.');
            setLoading(false);
          }
        }, 10000); // 10 second timeout
        
        const currentUser = await getCurrentUser();
        if (mounted) {
          setUser(currentUser);
          console.log('Auth initialized:', currentUser ? 'User found' : 'No user');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setError('Failed to initialize authentication');
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(timeoutId);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
      
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session) {
        // Small delay to ensure Supabase state is fully updated
        setTimeout(async () => {
          if (mounted) {
            await refetchUser();
          }
        }, 100);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setError(null);
      }
      
      if (loading) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    refetchUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
