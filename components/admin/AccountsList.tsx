"use client";

import { useState, useMemo, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Account } from "@/lib/supabase/types";
import { Search, Building2, Trash2 } from "lucide-react";

interface AccountWithLocationCount extends Account {
  locationCount?: number;
  locationCities?: string[];
  locationStates?: string[];
  locationCountries?: string[];
}

interface AccountsListProps {
  initialAccounts: AccountWithLocationCount[];
}

type CountryFilter = 'US' | 'CA' | 'UK' | 'INTL' | 'ALL';

// Helper function to normalize country codes for filtering
function normalizeCountry(country: string | null | undefined): CountryFilter | null {
  if (!country) return null;
  const upperCountry = country.toUpperCase();
  
  // US variations
  if (upperCountry === 'USA' || upperCountry === 'US' || upperCountry === 'UNITED STATES') {
    return 'US';
  }
  
  // Canada variations
  if (upperCountry === 'CA' || upperCountry === 'CAN' || upperCountry === 'CANADA') {
    return 'CA';
  }
  
  // UK variations
  if (upperCountry === 'UK' || upperCountry === 'GB' || upperCountry === 'GBR' || 
      upperCountry === 'UNITED KINGDOM' || upperCountry === 'ENGLAND' || 
      upperCountry === 'SCOTLAND' || upperCountry === 'WALES' || 
      upperCountry === 'NORTHERN IRELAND') {
    return 'UK';
  }
  
  // Everything else is INTL
  return 'INTL';
}

// Check if account has any location matching the filter
function accountMatchesCountryFilter(
  account: AccountWithLocationCount,
  filter: CountryFilter
): boolean {
  if (filter === 'ALL') return true;
  
  let countries = account.locationCountries || [];
  
  // For single-location accounts, also check account's country code
  if (!account.locationCountries || account.locationCountries.length === 0) {
    if (account.udf_country_code) {
      countries = [account.udf_country_code];
    }
  }
  
  return countries.some(country => normalizeCountry(country) === filter);
}

export default function AccountsList({ initialAccounts }: AccountsListProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<CountryFilter>('ALL');
  const [accounts, setAccounts] = useState(initialAccounts);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync accounts state when initialAccounts prop changes (e.g., after navigation)
  useEffect(() => {
    setAccounts(initialAccounts);
  }, [initialAccounts, pathname]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch =
        !searchQuery ||
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.primary_contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.primary_contact_email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCountry = accountMatchesCountryFilter(account, countryFilter);

      return matchesSearch && matchesCountry;
    });
  }, [accounts, searchQuery, countryFilter]);

  const handleDelete = async (accountId: string, accountName: string) => {
    if (!confirm(`Are you sure you want to delete "${accountName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(accountId);
    try {
      const response = await fetch(`/api/admin/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }

      // Remove the account from the local state
      setAccounts(accounts.filter(account => account.id !== accountId));
    } catch (error: any) {
      console.error('Error deleting account:', error);
      alert(`Failed to delete account: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

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
        
        {/* Country Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-navy-700">Filter by:</span>
          <div className="flex gap-2">
            {(['ALL', 'US', 'CA', 'UK', 'INTL'] as CountryFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setCountryFilter(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  countryFilter === filter
                    ? 'bg-gold-600 text-white'
                    : 'bg-navy-100 text-navy-700 hover:bg-navy-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
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
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/accounts/${account.id}`}
                        className="text-gold-600 hover:text-gold-700 font-medium text-sm"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(account.id, account.name)}
                        disabled={deletingId === account.id}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

