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
      
      // Add timeout to prevent hanging (10 seconds - increased for slower connections)
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      const { data, error } = result as any;

      if (error) {
        // Only log errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching user profile:', JSON.stringify(error, null, 2));
        }
        // Don't set to null immediately - might be a temporary issue
        // Set a minimal profile based on auth user
        setUserProfile({
          id: authUser.id,
          email: authUser.email || '',
          full_name: null,
          phone: null,
          subscription_status: 'free_trial',
          trial_started_at: null,
          trial_expires_at: null,
          role: 'customer',
          created_at: authUser.created_at,
          updated_at: authUser.updated_at || authUser.created_at,
        } as User);
      } else if (data) {
        setUserProfile(data);
      } else {
        // No data returned but no error - create minimal profile
        setUserProfile({
          id: authUser.id,
          email: authUser.email || '',
          full_name: null,
          phone: null,
          subscription_status: 'free_trial',
          trial_started_at: null,
          trial_expires_at: null,
          role: 'customer',
          created_at: authUser.created_at,
          updated_at: authUser.updated_at || authUser.created_at,
        } as User);
      }
    } catch (error: any) {
      // Only log timeout/errors in development, or if it's not a timeout
      if (process.env.NODE_ENV === 'development' || error?.message !== 'Profile fetch timeout') {
        console.error('Error fetching user profile:', error);
      }
      // Create minimal profile from auth user so app doesn't break
      if (authUser) {
        setUserProfile({
          id: authUser.id,
          email: authUser.email || '',
          full_name: null,
          phone: null,
          subscription_status: 'free_trial',
          trial_started_at: null,
          trial_expires_at: null,
          role: 'customer',
          created_at: authUser.created_at,
          updated_at: authUser.updated_at || authUser.created_at,
        } as User);
      } else {
        setUserProfile(null);
      }
    }
  };

  useEffect(() => {
    // Skip auth if Supabase is not configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      try {
        const supabase = createClient();

        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session fetch timeout')), 10000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        await fetchUserProfile(session?.user ?? null);
        
        if (!mounted) return;
        setLoading(false);

        // Listen for auth changes
        const {
          data: { subscription: sub },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!mounted) return;
          setUser(session?.user ?? null);
          await fetchUserProfile(session?.user ?? null);
          if (!mounted) return;
          setLoading(false);
        });
        
        subscription = sub;
      } catch (error) {
        console.error('Error initializing Supabase client:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
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

