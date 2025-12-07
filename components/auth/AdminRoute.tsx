"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { canAccessAdmin } from "@/lib/utils/roles";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!userProfile || !canAccessAdmin(userProfile))) {
      router.push("/account");
    }
  }, [userProfile, loading, router]);

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

  if (!userProfile || !canAccessAdmin(userProfile)) {
    return null;
  }

  return <>{children}</>;
}

