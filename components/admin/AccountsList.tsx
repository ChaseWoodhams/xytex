"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Account } from "@/lib/supabase/types";
import { Search, Building2, Trash2, Edit, X, MapPin, MapPinned } from "lucide-react";
import AccountForm from "./AccountForm";

interface AccountWithLocationCount extends Account {
  locationCount?: number;
  locationCities?: string[];
  locationStates?: string[];
  locationCountries?: string[];
  locationAddresses?: string[];
  locationZipCodes?: string[];
  mostRecentContractDate?: string | null;
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
  
  // For single-location accounts, prioritize account's country code
  // as it's more reliable than location data which might be incorrect
  const isSingleLocation = !account.account_type || 
    account.account_type === 'single_location' || 
    (account.locationCount !== undefined && account.locationCount <= 1);
  
  // If account has a country code, use it first (most reliable)
  if (account.udf_country_code && account.udf_country_code.trim()) {
    const normalizedAccountCountry = normalizeCountry(account.udf_country_code.trim());
    if (normalizedAccountCountry === filter) {
      return true;
    }
    // For single-location accounts, only use account country code
    if (isSingleLocation) {
      return false;
    }
  }
  
  // For multi-location accounts or when account country doesn't match, check location countries
  if (account.locationCountries && account.locationCountries.length > 0) {
    const normalizedLocationCountries = account.locationCountries
      .map(country => country ? normalizeCountry(country.trim()) : null)
      .filter((country): country is CountryFilter => country !== null);
    
    return normalizedLocationCountries.some(country => country === filter);
  }
  
  return false;
}

export default function AccountsList({ initialAccounts }: AccountsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<CountryFilter>('ALL');
  const [accounts, setAccounts] = useState(initialAccounts);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Sync accounts state when initialAccounts prop changes
  useEffect(() => {
    setAccounts(initialAccounts);
  }, [initialAccounts]);

  const handleEditSuccess = () => {
    // Refresh the router to get updated account data
    router.refresh();
    setEditingAccount(null);
  };

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

      // Remove the account from the local state and refresh
      setAccounts(accounts.filter(account => account.id !== accountId));
      router.refresh();
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-navy-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                    Account Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                    Address
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                    City
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                    State
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                    Zip Code
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                    Country
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                    Primary Contact
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                    Most Recent Contract
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => {
                  // Determine address, city, state, zip, country based on account type
                  const isMulti = account.account_type === 'multi_location' || (account.locationCount && account.locationCount > 1);
                  const address = isMulti 
                    ? (account.locationAddresses && account.locationAddresses.length > 0 ? account.locationAddresses[0] : null)
                    : account.udf_address_line1;
                  const city = isMulti 
                    ? (account.locationCities && account.locationCities.length > 0 ? account.locationCities[0] : null)
                    : account.udf_city;
                  const state = isMulti 
                    ? (account.locationStates && account.locationStates.length > 0 ? account.locationStates[0] : null)
                    : account.udf_state;
                  const zip = isMulti 
                    ? (account.locationZipCodes && account.locationZipCodes.length > 0 ? account.locationZipCodes[0] : null)
                    : account.udf_zipcode;
                  const country = account.locationCountries && account.locationCountries.length > 0
                    ? account.locationCountries[0]
                    : account.udf_country_code;

                  return (
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
                          {(() => {
                            const isMulti = account.account_type === 'multi_location' || (account.locationCount !== undefined && account.locationCount > 1);
                            if (isMulti) {
                              return (
                                <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                                  <MapPinned className="w-3 h-3" />
                                  Multi-Location
                                  {account.locationCount !== undefined && account.locationCount > 1 && (
                                    <span className="ml-1">({account.locationCount})</span>
                                  )}
                                </span>
                              );
                            } else {
                              return (
                                <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  Single Location
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-navy-600">
                        {address || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-navy-600">
                        {city || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-navy-600">
                        {state || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-navy-600">
                        {zip || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-navy-600">
                        {country || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-navy-600">
                        {account.primary_contact_name || account.primary_contact_email || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-navy-600">
                        {account.mostRecentContractDate ? (
                          new Date(account.mostRecentContractDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        ) : (
                          "—"
                        )}
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
                            onClick={() => setEditingAccount(account)}
                            className="p-1.5 text-navy-600 hover:text-gold-600 hover:bg-gold-50 rounded transition-colors"
                            title="Quick edit account"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(account.id, account.name)}
                            disabled={deletingId === account.id}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {editingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-white border-b border-navy-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-heading font-semibold text-navy-900">
                Quick Edit Account
              </h2>
              <button
                onClick={() => setEditingAccount(null)}
                className="p-2 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <AccountForm
                account={editingAccount}
                onSuccess={() => {
                  handleEditSuccess();
                  setEditingAccount(null);
                }}
                onCancel={() => setEditingAccount(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

