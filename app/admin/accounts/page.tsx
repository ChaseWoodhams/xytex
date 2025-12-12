import { getAccountUploads } from "@/lib/supabase/account-uploads";
import Link from "next/link";
import { Plus } from "lucide-react";
import AccountsList from "@/components/admin/AccountsList";
import InviteTeamMember from "@/components/admin/InviteTeamMember";
import RefreshButton from "@/components/admin/RefreshButton";
import AccountUploadHistory from "@/components/admin/AccountUploadHistory";

// Force dynamic rendering to ensure fresh data on every request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AccountsPage() {
  let uploads: Awaited<ReturnType<typeof getAccountUploads>> = [];
  
  try {
    uploads = await getAccountUploads();
  } catch (error) {
    console.error('[AccountsPage] Error loading uploads:', error);
    uploads = [];
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading font-bold text-navy-900 mb-2">
            Accounts
          </h1>
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

      <AccountUploadHistory uploads={uploads} />
      <AccountsList />
    </div>
  );
}

