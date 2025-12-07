import { getCorporateAccounts } from "@/lib/supabase/corporate-accounts";
import Link from "next/link";
import { Building2, Plus, Search } from "lucide-react";
import AccountsList from "@/components/admin/AccountsList";

export default async function AccountsPage() {
  const accounts = await getCorporateAccounts();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading font-bold text-navy-900 mb-2">
            Corporate Accounts
          </h1>
          <p className="text-navy-600">
            Manage your corporate clinic accounts and locations
          </p>
        </div>
        <Link href="/admin/accounts/new" className="btn btn-primary">
          <Plus className="w-5 h-5" />
          New Account
        </Link>
      </div>

      <AccountsList initialAccounts={accounts} />
    </div>
  );
}

