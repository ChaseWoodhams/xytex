"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import AccountsList from "@/components/admin/AccountsList";
import InviteTeamMember from "@/components/admin/InviteTeamMember";
import RefreshButton from "@/components/admin/RefreshButton";
import AccountUploadHistory from "@/components/admin/AccountUploadHistory";
import type { AccountUpload } from "@/lib/supabase/types";

export default function AccountsTab() {
  const [uploads, setUploads] = useState<AccountUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUploads() {
      try {
        const response = await fetch("/api/admin/account-uploads");
        if (response.ok) {
          const data = await response.json();
          setUploads(data);
        }
      } catch (error) {
        console.error('[AccountsTab] Error loading uploads:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadUploads();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-navy-900 mb-1">
            Accounts
          </h2>
          <p className="text-navy-600">
            Manage your accounts and locations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RefreshButton />
          <InviteTeamMember />
          <Link href="/admin/accounts/new" className="btn btn-primary">
            <Plus className="w-5 h-5" />
            New Account
          </Link>
        </div>
      </div>

      {!isLoading && <AccountUploadHistory uploads={uploads} />}
      <AccountsList />
    </div>
  );
}
