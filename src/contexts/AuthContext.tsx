/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { SchoolProfile } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: SchoolProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  const MAX_RETRIES = 2;
  const RETRY_DELAY = 1000;

  const fetchProfile = async (userId: string, attempt = 1): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Retry on network errors or 5xx server errors
        const shouldRetry = attempt <= MAX_RETRIES && (
          error.message?.includes('network') ||
          error.message?.includes('timeout') ||
          error.code?.startsWith('5')
        );
        
        if (shouldRetry) {
          console.log(`Profile fetch failed (attempt ${attempt}/${MAX_RETRIES + 1}), retrying...`);
          await new Promise(r => setTimeout(r, RETRY_DELAY * attempt));
          return fetchProfile(userId, attempt + 1);
        }
        
        console.error('Error fetching profile:', error.message);
      } else {
        setProfile(data as SchoolProfile);
      }
    } catch (err) {
      if (attempt <= MAX_RETRIES) {
        console.log(`Profile fetch error (attempt ${attempt}/${MAX_RETRIES + 1}), retrying...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY * attempt));
        return fetchProfile(userId, attempt + 1);
      }
      console.error('Unexpected error fetching profile', err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        userIdRef.current = session.user.id;
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        if (userIdRef.current !== session.user.id) {
          setLoading(true);
          userIdRef.current = session.user.id;
        }
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        userIdRef.current = null;
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
  }), [session, user, profile, loading, signOut, refreshProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
