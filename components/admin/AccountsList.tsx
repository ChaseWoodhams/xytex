"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { CorporateAccount, AccountStatus } from "@/lib/supabase/types";
import type { LocationAgreementHealth } from "@/lib/supabase/agreements";
import { Search, Building2, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

interface AccountsListProps {
  initialAccounts: CorporateAccount[];
  locationCounts: Record<string, number>;
  agreementHealth: Record<string, LocationAgreementHealth>;
}

export default function AccountsList({ initialAccounts, locationCounts, agreementHealth }: AccountsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "all">("all");

  const filteredAccounts = useMemo(() => {
    return initialAccounts.filter((account) => {
      const matchesSearch =
        !searchQuery ||
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.primary_contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.primary_contact_email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || account.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [initialAccounts, searchQuery, statusFilter]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
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
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AccountStatus | "all")}
            className="px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
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
                  Code
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                  Account Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                  Industry
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                  Primary Contact
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                  Location Health
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
                    <span className="font-mono text-sm font-semibold text-gold-600">
                      {account.code || "—"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/accounts/${account.id}`}
                      className="text-navy-900 font-medium hover:text-gold-600 transition-colors"
                    >
                      {account.name}
                    </Link>
                    {locationCounts[account.id] !== undefined && locationCounts[account.id] > 0 && (
                      <div className="mt-1">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-navy-100 text-navy-700 rounded-full"
                          title={`${locationCounts[account.id]} location${locationCounts[account.id] !== 1 ? 's' : ''}`}
                        >
                          <MapPin className="w-3 h-3" />
                          {locationCounts[account.id]}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-navy-600">
                    {account.industry || "—"}
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
                  <td className="py-3 px-4 text-sm text-navy-600">
                    {account.primary_contact_name || account.primary_contact_email || "—"}
                  </td>
                  <td className="py-3 px-4">
                    {(() => {
                      const health = agreementHealth[account.id];
                      const locationCount = locationCounts[account.id] || 0;
                      
                      if (locationCount === 0) {
                        return <span className="text-sm text-navy-400">No locations</span>;
                      }
                      
                      if (!health || health.total === 0) {
                        return <span className="text-sm text-navy-400">No location data</span>;
                      }
                      
                      // Determine overall health indicator
                      const hasIssues = health.red > 0 || health.yellow > 0;
                      const allGood = health.green === health.total && health.total > 0;
                      
                      return (
                        <div className="flex items-center gap-3">
                          {/* Overall status indicator */}
                          <div className="flex items-center gap-1">
                            {allGood ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : hasIssues ? (
                              <AlertCircle className="w-4 h-4 text-yellow-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-xs font-medium text-navy-700">
                              {health.total} location{health.total !== 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          {/* Status breakdown */}
                          <div className="flex items-center gap-1.5">
                            {health.green > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                                {health.green}
                              </span>
                            )}
                            {health.yellow > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-600" />
                                {health.yellow}
                              </span>
                            )}
                            {health.red > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                {health.red}
                              </span>
                            )}
                            {health.none > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                {health.none}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
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

