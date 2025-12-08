"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { User } from "@/lib/supabase/types";

interface AuthContextType {
  user: SupabaseAuthUser | null;
  userProfile: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (authUser: SupabaseAuthUser | null) => {
    if (!authUser) {
      setUserProfile(null);
      return;
    }

    try {
      const supabase = createClient();
      // Add timeout to prevent hanging
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );

      const { data, error } = await Promise.race([
        profilePromise,
        timeoutPromise,
      ]) as any;

      if (error) {
        console.error('Error fetching user profile:', error);
        setUserProfile(null);
      } else {
        setUserProfile(data);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      // Don't block auth if profile fetch fails - user can still be authenticated
      setUserProfile(null);
    }
  };

  useEffect(() => {
    // Skip auth if Supabase is not configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured - auth disabled');
      setLoading(false);
      return;
    }

    // Timeout fallback - ensure loading doesn't get stuck
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    try {
      const supabase = createClient();

      // Get initial session - with retry logic
      const getInitialSession = async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error getting session:', error);
            setLoading(false);
            clearTimeout(loadingTimeout);
            // Retry once after a short delay
            setTimeout(async () => {
              try {
                const { data: { session: retrySession } } = await supabase.auth.getSession();
                setUser(retrySession?.user ?? null);
                if (retrySession?.user) {
                  fetchUserProfile(retrySession.user).catch(console.error);
                }
              } catch (retryErr) {
                console.error('Retry session error:', retryErr);
              }
            }, 500);
            return;
          }
          setUser(session?.user ?? null);
          // Don't wait for profile - set loading false immediately, fetch profile in background
          setLoading(false);
          clearTimeout(loadingTimeout);
          if (session?.user) {
            fetchUserProfile(session.user).catch(console.error);
          }
        } catch (err) {
          console.error('Error in getInitialSession:', err);
          setLoading(false);
          clearTimeout(loadingTimeout);
        }
      };
      
      getInitialSession();

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        // Handle different auth events
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setUser(session?.user ?? null);
          setLoading(false);
          // Fetch profile in background, don't block
          if (session?.user) {
            fetchUserProfile(session.user).catch(console.error);
          }
        } else {
          setUser(session?.user ?? null);
          setLoading(false);
          // Fetch profile in background, don't block
          if (session?.user) {
            fetchUserProfile(session.user).catch(console.error);
          }
        }
      });

      // Periodic session refresh check (every 2 minutes to catch expiring sessions)
      const refreshInterval = setInterval(async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error refreshing session:', error);
            // If we have a user but session check fails, try to refresh
            if (user) {
              const { data: { session: retrySession } } = await supabase.auth.refreshSession();
              if (retrySession) {
                setUser(retrySession.user);
                await fetchUserProfile(retrySession.user);
              } else {
                setUser(null);
                setUserProfile(null);
              }
            }
            return;
          }
          if (session) {
            // Update user if session exists but user state is null (recovery)
            if (!user && session.user) {
              console.log('Recovering user session');
              setUser(session.user);
              await fetchUserProfile(session.user);
            } else if (user && session.user?.id !== user.id) {
              // User changed
              setUser(session.user);
              await fetchUserProfile(session.user);
            } else if (user) {
              // Just refresh profile
              await fetchUserProfile(session.user);
            }
          } else if (user) {
            // Session expired but we still have user state - try to refresh
            try {
              const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
              if (refreshedSession) {
                setUser(refreshedSession.user);
                await fetchUserProfile(refreshedSession.user);
              } else {
                setUser(null);
                setUserProfile(null);
              }
            } catch {
              // Refresh failed, clear user
              setUser(null);
              setUserProfile(null);
            }
          }
        } catch (error) {
          console.error('Error in periodic session check:', error);
        }
      }, 2 * 60 * 1000); // 2 minutes - more frequent to catch issues sooner

      return () => {
        subscription.unsubscribe();
        clearInterval(refreshInterval);
        clearTimeout(loadingTimeout);
      };
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      setLoading(false);
      clearTimeout(loadingTimeout);
    }
  }, []);

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

