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

  const fetchUserProfile = async (authUser: SupabaseAuthUser | null, retryCount = 0) => {
    if (!authUser) {
      setUserProfile(null);
      return;
    }

    const MAX_RETRIES = 2;
    const TIMEOUT_MS = 8000; // Increased to 8 seconds

    try {
      const supabase = createClient();
      
      // Verify auth session is valid before querying
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.warn('No valid session for profile fetch:', sessionError?.message);
        setUserProfile(null);
        return;
      }

      // Add timeout to prevent hanging - use a simpler approach
      const profileQuery = supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      try {
        // Create a timeout that will throw if the query takes too long
        let timeoutId: NodeJS.Timeout;
        const timeoutError = new Error('Profile fetch timeout');
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(timeoutError), TIMEOUT_MS);
        });

        // Race the query against the timeout
        const queryPromise = Promise.resolve(profileQuery);
        const result = await Promise.race([
          queryPromise.then((r) => {
            clearTimeout(timeoutId);
            return r;
          }),
          timeoutPromise,
        ]) as Awaited<ReturnType<typeof profileQuery>>;

        if (result.error) {
          // If it's a "not found" error and we haven't retried, try once more
          if (result.error.code === 'PGRST116' && retryCount < MAX_RETRIES) {
            console.warn(`User profile not found, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            // Wait a bit before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchUserProfile(authUser, retryCount + 1);
          }
          console.error('Error fetching user profile:', {
            message: result.error.message,
            code: result.error.code,
            details: result.error.details,
            hint: result.error.hint
          });
          setUserProfile(null);
        } else if (result.data) {
          setUserProfile(result.data);
        } else {
          // No error but no data - profile might not exist yet
          console.warn('User profile query returned no data for user:', authUser.id);
          setUserProfile(null);
        }
      } catch (raceError) {
        if (timeoutId) clearTimeout(timeoutId);
        // Handle timeout or other race errors
        if (raceError instanceof Error) {
          // Retry on timeout if we haven't exceeded max retries
          if (raceError.message === 'Profile fetch timeout' && retryCount < MAX_RETRIES) {
            console.warn(`Profile fetch timeout, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchUserProfile(authUser, retryCount + 1);
          }
          console.error('Error fetching user profile:', raceError.message);
        } else {
          console.error('Error fetching user profile:', raceError);
        }
        setUserProfile(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error fetching user profile:', errorMessage || error);
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

      // Periodic session refresh check (every 5 minutes to reduce load)
      const refreshInterval = setInterval(async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error refreshing session:', error);
            // If we have a user but session check fails, try to refresh
            if (user) {
              try {
                const { data: { session: retrySession } } = await supabase.auth.refreshSession();
                if (retrySession) {
                  setUser(retrySession.user);
                  fetchUserProfile(retrySession.user).catch(console.error);
                } else {
                  setUser(null);
                  setUserProfile(null);
                }
              } catch (refreshError) {
                console.error('Error refreshing session:', refreshError);
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
              fetchUserProfile(session.user).catch(console.error);
            } else if (user && session.user?.id !== user.id) {
              // User changed
              setUser(session.user);
              fetchUserProfile(session.user).catch(console.error);
            } else if (user && !userProfile) {
              // Only refresh profile if we don't have one (don't spam queries)
              fetchUserProfile(session.user).catch(console.error);
            }
          } else if (user) {
            // Session expired but we still have user state - try to refresh
            try {
              const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
              if (refreshedSession) {
                setUser(refreshedSession.user);
                fetchUserProfile(refreshedSession.user).catch(console.error);
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
      }, 5 * 60 * 1000); // 5 minutes - reduced frequency to avoid timeout issues

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

