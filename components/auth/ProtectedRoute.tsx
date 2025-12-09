"use client";

import { useAuth } from "./AuthProvider";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Don't redirect here - let middleware handle route protection
  // This component just shows/hides content based on auth state
  // Redirects are handled by middleware to prevent refresh issues

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-navy-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Return null instead of redirecting - middleware will handle the redirect
    // This prevents double redirects and refresh issues
    return null;
  }

  return <>{children}</>;
}

