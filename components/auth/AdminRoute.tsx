"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { canAccessAdmin } from "@/lib/utils/roles";
import Link from "next/link";
import { Home, LogOut } from "lucide-react";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading, signOut } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Add timeout fallback - if loading takes more than 10 seconds, show error
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('AdminRoute: Loading timeout reached');
        setTimeoutReached(true);
      }, 10000);

      return () => clearTimeout(timeout);
    } else {
      setTimeoutReached(false);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && (!userProfile || !canAccessAdmin(userProfile))) {
      router.push("/");
    }
  }, [userProfile, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-navy-600">Loading admin content...</p>
        </div>
      </div>
    );
  }

  // Show error state if timeout reached or if we have a user but no profile after loading
  if (timeoutReached || (loading && timeoutReached) || (!loading && user && !userProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-heading font-bold text-navy-900 mb-4">
            {timeoutReached ? 'Loading Timeout' : 'Profile Error'}
          </h1>
          <p className="text-navy-600 mb-6">
            {timeoutReached 
              ? 'The page is taking longer than expected to load. Please try refreshing or signing out.'
              : 'Unable to load your user profile. Please try refreshing the page.'}
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
            >
              Refresh Page
            </button>
            <button onClick={handleSignOut} className="btn btn-secondary">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
            <Link href="/" className="btn btn-secondary">
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile || !canAccessAdmin(userProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-heading font-bold text-navy-900 mb-4">
            Access Denied
          </h1>
          <p className="text-navy-600 mb-6">
            You don't have permission to access the admin area.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/" className="btn btn-primary">
              <Home className="w-4 h-4" />
              Go Home
            </Link>
            <button onClick={handleSignOut} className="btn btn-secondary">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

