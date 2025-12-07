"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { CorporateAccount, DealStage, AccountStatus } from "@/lib/supabase/types";
import { Search, Building2 } from "lucide-react";

interface AccountsListProps {
  initialAccounts: CorporateAccount[];
}

export default function AccountsList({ initialAccounts }: AccountsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "all">("all");
  const [dealStageFilter, setDealStageFilter] = useState<DealStage | "all">("all");

  const filteredAccounts = useMemo(() => {
    return initialAccounts.filter((account) => {
      const matchesSearch =
        !searchQuery ||
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.primary_contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.primary_contact_email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || account.status === statusFilter;
      const matchesDealStage = dealStageFilter === "all" || account.deal_stage === dealStageFilter;

      return matchesSearch && matchesStatus && matchesDealStage;
    });
  }, [initialAccounts, searchQuery, statusFilter, dealStageFilter]);

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
          <select
            value={dealStageFilter}
            onChange={(e) => setDealStageFilter(e.target.value as DealStage | "all")}
            className="px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          >
            <option value="all">All Stages</option>
            <option value="prospect">Prospect</option>
            <option value="qualified">Qualified</option>
            <option value="negotiation">Negotiation</option>
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
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
                  Account Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                  Industry
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                  Deal Stage
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
                    <Link
                      href={`/admin/accounts/${account.id}`}
                      className="text-navy-900 font-medium hover:text-gold-600"
                    >
                      {account.name}
                    </Link>
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
                  <td className="py-3 px-4">
                    <span className="text-sm text-navy-600 capitalize">
                      {account.deal_stage.replace("_", " ")}
                    </span>
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

