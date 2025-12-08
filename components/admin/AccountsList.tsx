"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Account } from "@/lib/supabase/types";
import { Search, Building2 } from "lucide-react";

interface AccountWithLocationCount extends Account {
  locationCount?: number;
  locationCities?: string[];
  locationStates?: string[];
}

interface AccountsListProps {
  initialAccounts: AccountWithLocationCount[];
}

export default function AccountsList({ initialAccounts }: AccountsListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAccounts = useMemo(() => {
    return initialAccounts.filter((account) => {
      const matchesSearch =
        !searchQuery ||
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.primary_contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.primary_contact_email?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [initialAccounts, searchQuery]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>
      </div>

      {/* Accounts Table */}
      {filteredAccounts.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-navy-300 mx-auto mb-4" />
          <p className="text-navy-600 mb-4">No accounts found</p>
          <Link href="/admin/accounts/new" className="btn btn-primary">
            Create Your First Account
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                  Account Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                  Ship To City
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                  Ship To State
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                  Primary Contact
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr
                  key={account.id}
                  className="border-b border-navy-100 hover:bg-cream-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/accounts/${account.id}`}
                        className="text-navy-900 font-medium hover:text-gold-600"
                      >
                        {account.name}
                      </Link>
                      {account.locationCount !== undefined && account.locationCount > 1 && (
                        <span className="px-2 py-1 text-xs font-semibold bg-navy-100 text-navy-700 rounded-full">
                          {account.locationCount} locations
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-navy-600">
                    {(account.account_type === 'multi_location' || (account.locationCount && account.locationCount > 1))
                      ? account.locationCities?.join(", ") || "—"
                      : account.udf_city || "—"}
                  </td>
                  <td className="py-3 px-4 text-sm text-navy-600">
                    {(account.account_type === 'multi_location' || (account.locationCount && account.locationCount > 1))
                      ? account.locationStates?.join(", ") || "—"
                      : account.udf_state || "—"}
                  </td>
                  <td className="py-3 px-4 text-sm text-navy-600">
                    {account.primary_contact_name || account.primary_contact_email || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/accounts/${account.id}`}
                      className="text-gold-600 hover:text-gold-700 font-medium text-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

