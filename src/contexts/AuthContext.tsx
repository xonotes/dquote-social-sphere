
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, type AuthUser } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
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

  const refetchUser = async () => {
    try {
      console.log('Refetching user...');
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      console.log('User refetched:', currentUser ? 'Success' : 'No user');
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('Initializing auth...');
        const currentUser = await getCurrentUser();
        if (mounted) {
          setUser(currentUser);
          console.log('Auth initialized:', currentUser ? 'User found' : 'No user');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
      
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session) {
        setTimeout(async () => {
          if (mounted) {
            await refetchUser();
          }
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      
      if (loading) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    refetchUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
