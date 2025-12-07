import { createClient } from "@/lib/supabase/server";
import { getCorporateAccounts } from "@/lib/supabase/corporate-accounts";
import { Building2, TrendingUp, Users, Calendar } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const accounts = await getCorporateAccounts();

  // Calculate stats
  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((a) => a.status === "active").length;
  const prospects = accounts.filter((a) => a.deal_stage === "prospect").length;
  const closedWon = accounts.filter((a) => a.deal_stage === "closed_won").length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-navy-900 mb-2">
          Dashboard
        </h1>
        <p className="text-navy-600">Welcome to the Business Development CRM</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-navy-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-navy-600" />
            </div>
          </div>
          <h3 className="text-3xl font-heading font-bold text-navy-900 mb-1">
            {totalAccounts}
          </h3>
          <p className="text-sm text-navy-600">Total Accounts</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-gold-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-gold-600" />
            </div>
          </div>
          <h3 className="text-3xl font-heading font-bold text-navy-900 mb-1">
            {activeAccounts}
          </h3>
          <p className="text-sm text-navy-600">Active Accounts</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-3xl font-heading font-bold text-navy-900 mb-1">
            {prospects}
          </h3>
          <p className="text-sm text-navy-600">Prospects</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-3xl font-heading font-bold text-navy-900 mb-1">
            {closedWon}
          </h3>
          <p className="text-sm text-navy-600">Closed Won</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
          Quick Actions
        </h2>
        <div className="flex gap-4">
          <Link
            href="/admin/accounts/new"
            className="btn btn-primary"
          >
            Create New Account
          </Link>
          <Link
            href="/admin/accounts"
            className="btn btn-secondary"
          >
            View All Accounts
          </Link>
        </div>
      </div>

      {/* Recent Accounts */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
          Recent Accounts
        </h2>
        {accounts.length === 0 ? (
          <p className="text-navy-600">No accounts yet. Create your first account to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                    Account Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                    Deal Stage
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.slice(0, 5).map((account) => (
                  <tr key={account.id} className="border-b border-navy-100 hover:bg-cream-50">
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/accounts/${account.id}`}
                        className="text-navy-900 font-medium hover:text-gold-600"
                      >
                        {account.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          account.status === "active"
                            ? "bg-green-100 text-green-800"
                            : account.status === "inactive"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {account.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-navy-600 capitalize">
                        {account.deal_stage.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-navy-600">
                      {new Date(account.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

