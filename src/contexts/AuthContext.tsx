import { supabase } from '@/services/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggingIn: boolean;
  ageVerified: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  setAgeVerified: (verified: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [ageVerified, setAgeVerifiedState] = useState(() =>
    localStorage.getItem('kamana_age_verified') === 'true'
  );

  const setAgeVerified = useCallback((verified: boolean) => {
    setAgeVerifiedState(verified);
    localStorage.setItem('kamana_age_verified', verified ? 'true' : 'false');
  }, []);

  const mapSupabaseUser = useCallback((supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.full_name ||
        supabaseUser.email?.split('@')[0] ||
        'User',
      email: supabaseUser.email || '',
      isLoggedIn: true
    };
  }, []);

  useEffect(() => {
    if (!supabase) {
      // Local mode - no Supabase
      if (ageVerified) {
        setUser({
          id: 'local-user',
          name: 'स्थानिक कलाकार',
          email: 'local@kamana.app',
          isLoggedIn: true
        });
      }
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const initAuth = async () => {
      try {
        if (supabase === null) {
          console.warn('Supabase client is not initialized.');
          if (mounted) setIsLoading(false);
          return;
        }
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session) {
            window.location.hash = "#/studio/new";
          }

          if (session?.user) {
            setUser(mapSupabaseUser(session.user));
          } else if (event === "SIGNED_OUT") {
            setUser(null);
          }
        });

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          if (mounted) setIsLoading(false);
          return;
        }

        if (session?.user && mounted) {
          setUser(mapSupabaseUser(session.user));
          setAgeVerified(true); // TODO: Verify age from user metadata if available
          // TODO: Implement age verification logic based on user metadata
          // TODO: For now, we assume age is verified if user exists
          // TODO: use social logins that provide age info
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);

        if (!mounted) return;

        if (session?.user) {
          setUser(mapSupabaseUser(session.user));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ageVerified, mapSupabaseUser]);

  const signIn = useCallback(async () => {
    if (!supabase) {
      // Local mode
      setUser({
        id: 'local-user',
        name: 'स्थानिक कलाकार',
        email: 'local@kamana.app',
        isLoggedIn: true
      });
      setAgeVerified(true);
      return;
    }

    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
    } catch (err) {
      console.error('Sign in exception:', err);
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  }, [setAgeVerified]);

  const signOut = useCallback(async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }

    setUser(null);
    setAgeVerified(false);
  }, [setAgeVerified]);

  const value: AuthContextType = {
    user,
    isLoading,
    isLoggingIn,
    ageVerified,
    signIn,
    signOut,
    setAgeVerified
  };

  return <AuthContext.Provider value={value}> {children} </AuthContext.Provider>;
};