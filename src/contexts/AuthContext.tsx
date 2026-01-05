import { supabase } from '../services/supabaseClient';
// Using any for SupabaseUser as 'User' export might be missing in some versions of the library
type SupabaseUser = any;
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
  isDevelopmentBypass: boolean;
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

  const isDevelopmentBypass = !supabase;

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

  // Development Bypass Logic
  const initMockAuth = useCallback(() => {
    const savedUser = localStorage.getItem('kamana_mock_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else if (ageVerified) {
        const mockUser = {
            id: 'local-user',
            name: 'स्थानिक कलाकार',
            email: 'local@kamana.app',
            isLoggedIn: true
        };
        setUser(mockUser);
        localStorage.setItem('kamana_mock_user', JSON.stringify(mockUser));
    }
    setIsLoading(false);
  }, [ageVerified]);

  // Production Supabase Auth Logic
  const initSupabaseAuth = useCallback(async (mounted: boolean) => {
    try {
      if (!supabase) return;

      // Fix: Cast to any to bypass missing getSession definition in some library versions
      const authResponse = await (supabase.auth as any).getSession();
      const session = authResponse.data?.session;
      const error = authResponse.error;
      
      if (error) {
        console.error('Session error:', error);
        if (mounted) setIsLoading(false);
        return;
      }

      if (session?.user && mounted) {
        setUser(mapSupabaseUser(session.user));
        setAgeVerified(true);
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      if (mounted) setIsLoading(false);
    }
  }, [mapSupabaseUser, setAgeVerified]);

  useEffect(() => {
    let mounted = true;

    if (isDevelopmentBypass) {
      initMockAuth();
    } else {
      initSupabaseAuth(mounted);

      // Fix: Cast to any to bypass missing onAuthStateChange definition in some library versions
      const { data } = (supabase!.auth as any).onAuthStateChange(
        async (event: string, session: any) => {
          if (!mounted) return;
          if (session?.user) {
            setUser(mapSupabaseUser(session.user));
            // Removed forced hash navigation on every SIGNED_IN event to prevent resets during session refresh
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        }
      );

      const subscription = (data as any)?.subscription;

      return () => {
        mounted = false;
        if (subscription) subscription.unsubscribe();
      };
    }
  }, [isDevelopmentBypass, initMockAuth, initSupabaseAuth, mapSupabaseUser]);

  const signIn = useCallback(async () => {
    setIsLoggingIn(true);
    try {
      if (isDevelopmentBypass) {
        await new Promise(r => setTimeout(r, 1000));
        const mockUser = {
          id: 'local-user',
          name: 'स्थानिक कलाकार',
          email: 'local@kamana.app',
          isLoggedIn: true
        };
        setUser(mockUser);
        localStorage.setItem('kamana_mock_user', JSON.stringify(mockUser));
        setAgeVerified(true);
        window.location.hash = "#/studio/new";
      } else {
        // Fix: Cast to any to bypass missing signInWithOAuth definition in some library versions
        const { error } = await (supabase!.auth as any).signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: `${window.location.origin}${window.location.pathname}`,
            skipBrowserRedirect: false
          }
        });
        if (error) throw error;
      }
    } catch (err) {
      console.error('Sign in exception:', err);
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  }, [isDevelopmentBypass, setAgeVerified]);

  const signOut = useCallback(async () => {
    if (isDevelopmentBypass) {
      localStorage.removeItem('kamana_mock_user');
    } else {
      try {
        // Fix: Cast to any to bypass missing signOut definition in some library versions
        await (supabase!.auth as any).signOut();
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    setUser(null);
    setAgeVerified(false);
    window.location.hash = "#/login";
  }, [isDevelopmentBypass, setAgeVerified]);

  const value: AuthContextType = {
    user,
    isLoading,
    isLoggingIn,
    ageVerified,
    signIn,
    signOut,
    setAgeVerified,
    isDevelopmentBypass
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
