"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Account } from "@/lib/supabase/types";
import { Search, Building2, Trash2, Edit, X, MapPin, MapPinned, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import AccountForm from "./AccountForm";
import AccountCsvUpload from "./AccountCsvUpload";

interface AccountWithMetadata extends Account {
  locationCount: number;
  hasContracts: boolean;
  hasLicenses: boolean;
  mostRecentContractDate: string | null;
  locationCities: string[];
  locationStates: string[];
  locationCountries: string[];
  locationAddresses: string[];
  locationZipCodes: string[];
  documentStatus: 'red' | 'yellow' | 'green';
  pendingContractCount: number;
}

interface AccountsListProps {
  initialAccounts?: AccountWithMetadata[];
}

type CountryFilter = 'US' | 'CA' | 'UK' | 'INTL' | 'ALL';
type AccountTypeFilter = 'ALL' | 'SINGLE_LOCATION' | 'MULTI_LOCATION';
type DocumentStatusSort = 'red' | 'yellow' | 'green' | 'none';

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
  account: AccountWithMetadata,
  filter: CountryFilter
): boolean {
  if (filter === 'ALL') return true;
  
  // For single-location accounts, prioritize account's country code
  const isSingleLocation = !account.account_type || 
    account.account_type === 'single_location' || 
    account.locationCount <= 1;
  
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
  const [accountTypeFilter, setAccountTypeFilter] = useState<AccountTypeFilter>('ALL');
  const [documentStatusSort, setDocumentStatusSort] = useState<DocumentStatusSort>('none');
  const [accounts, setAccounts] = useState<AccountWithMetadata[]>(initialAccounts || []);
  const [loading, setLoading] = useState(!initialAccounts);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  
  // Use a ref to track the latest request to prevent race conditions
  const requestIdRef = useRef(0);

  // Fetch accounts with pagination
  const fetchAccounts = async (pageNum: number, search?: string, country?: CountryFilter, accountType?: AccountTypeFilter, sortByStatus?: DocumentStatusSort) => {
    setLoading(true);
    
    // Increment request ID to track this specific request
    const currentRequestId = ++requestIdRef.current;
    
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: pageSize.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      if (country && country !== 'ALL') {
        params.append('country', country);
      }

      if (accountType && accountType !== 'ALL') {
        params.append('accountType', accountType);
      }

      if (sortByStatus && sortByStatus !== 'none') {
        params.append('sortByStatus', sortByStatus);
      }

      console.log(`[Frontend] Fetching accounts: requestId=${currentRequestId}, filter=${sortByStatus || 'none'}, page=${pageNum}`);

      const response = await fetch(`/api/admin/accounts?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      const data = await response.json();
      const accountsData = data.accounts || [];
      
      // Only update state if this is still the latest request (prevents race conditions)
      if (currentRequestId !== requestIdRef.current) {
        console.log(`[Frontend] Ignoring stale response: requestId=${currentRequestId}, latest=${requestIdRef.current}`);
        return;
      }
      
      // Debug: Log what we received
      const statusCounts = {
        red: accountsData.filter((acc: AccountWithMetadata) => acc.documentStatus === 'red').length,
        yellow: accountsData.filter((acc: AccountWithMetadata) => acc.documentStatus === 'yellow').length,
        green: accountsData.filter((acc: AccountWithMetadata) => acc.documentStatus === 'green').length,
      };
      console.log(`[Frontend] Received ${accountsData.length} accounts: red=${statusCounts.red}, yellow=${statusCounts.yellow}, green=${statusCounts.green}, filter=${sortByStatus || 'none'}, requestId=${currentRequestId}`);
      if (accountsData.length > 0) {
        console.log(`[Frontend] First 3 accounts: ${accountsData.slice(0, 3).map((a: AccountWithMetadata) => `"${a.name}"(${a.documentStatus})`).join(', ')}`);
      }
      
      setAccounts(accountsData);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // Use a ref to track the search debounce timer and previous search value
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevSearchQueryRef = useRef<string>("");

  // Single effect to handle all filter changes with debouncing for search
  useEffect(() => {
    const isSearchChange = prevSearchQueryRef.current !== searchQuery;
    prevSearchQueryRef.current = searchQuery;

    // If search changed, debounce it
    if (isSearchChange) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        if (page === 1) {
          fetchAccounts(1, searchQuery || undefined, countryFilter !== 'ALL' ? countryFilter : undefined, accountTypeFilter, documentStatusSort);
        } else {
          setPage(1); // Reset to first page when search changes
        }
        searchTimeoutRef.current = null;
      }, 300);
    } else {
      // For non-search filter changes, fetch immediately (unless search is being debounced)
      if (searchTimeoutRef.current) {
        return; // Let the debounced search effect handle it
      }
      fetchAccounts(page, searchQuery || undefined, countryFilter !== 'ALL' ? countryFilter : undefined, accountTypeFilter, documentStatusSort);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [page, countryFilter, accountTypeFilter, documentStatusSort, searchQuery]);

  const handleEditSuccess = () => {
    fetchAccounts(page, searchQuery || undefined, countryFilter !== 'ALL' ? countryFilter : undefined, accountTypeFilter, documentStatusSort);
    setEditingAccount(null);
  };

  // Accounts are already filtered by the API, so use them directly
  const filteredAccounts = accounts;

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

      // Refresh the current page
      fetchAccounts(page, searchQuery || undefined, countryFilter !== 'ALL' ? countryFilter : undefined, accountTypeFilter, documentStatusSort);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      alert(`Failed to delete account: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Search, Filters, and Actions */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>
          <button
            onClick={() => setShowCsvUpload(true)}
            className="btn btn-outline flex items-center gap-2 whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-navy-700">Country:</span>
            <div className="flex gap-2">
              {(['ALL', 'US', 'CA', 'UK', 'INTL'] as CountryFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setCountryFilter(filter);
                    setPage(1);
                  }}
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

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-navy-700">Sort by Status:</span>
            <div className="flex gap-2">
              {(['none', 'red', 'yellow', 'green'] as DocumentStatusSort[]).map((sort) => (
                <button
                  key={sort}
                  onClick={() => {
                    setDocumentStatusSort(sort);
                    setPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    documentStatusSort === sort
                      ? 'bg-gold-600 text-white'
                      : 'bg-navy-100 text-navy-700 hover:bg-navy-200'
                  }`}
                >
                  {sort === 'none' ? 'None' : (
                    <>
                      <span className={`w-3 h-3 rounded-full ${
                        sort === 'red' ? 'bg-red-500' :
                        sort === 'yellow' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}></span>
                      {sort.charAt(0).toUpperCase() + sort.slice(1)}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-navy-700">Account Type:</span>
            <div className="flex gap-2">
              {(['ALL', 'SINGLE_LOCATION', 'MULTI_LOCATION'] as AccountTypeFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setAccountTypeFilter(filter);
                    setPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    accountTypeFilter === filter
                      ? 'bg-gold-600 text-white'
                      : 'bg-navy-100 text-navy-700 hover:bg-navy-200'
                  }`}
                >
                  {filter === 'SINGLE_LOCATION' ? 'Single Location' : filter === 'MULTI_LOCATION' ? 'Multi Location' : 'All'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600"></div>
          <p className="mt-4 text-navy-600">Loading accounts...</p>
        </div>
      )}

      {/* Accounts Table */}
      {!loading && filteredAccounts.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-navy-300 mx-auto mb-4" />
          <p className="text-navy-600 mb-4">No accounts found</p>
          <Link href="/admin/accounts/new" className="btn btn-primary">
            Create Your First Account
          </Link>
        </div>
      ) : !loading ? (
        <>
          <div className="table-container">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-navy-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                    Account Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                    Most Recent Contract
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-navy-700">
                    Contract Status
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => {
                  // Determine address, city, state, zip, country based on account type
                  const isMulti = account.account_type === 'multi_location' || account.locationCount > 1;
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
                          {/* Document Status Indicator */}
                          <div
                            className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              account.documentStatus === 'red'
                                ? 'bg-red-500'
                                : account.documentStatus === 'yellow'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            title={
                              account.documentStatus === 'red'
                                ? 'No contracts or licenses uploaded'
                                : account.documentStatus === 'yellow'
                                ? 'Some documents uploaded, but not all locations have both contract and license'
                                : 'All locations have both contract and license uploaded'
                            }
                          />
                          <Link
                            href={`/admin/accounts/${account.id}`}
                            className="text-navy-900 font-medium hover:text-gold-600"
                          >
                            {account.name}
                          </Link>
                          {(() => {
                            const isMulti = account.account_type === 'multi_location' || account.locationCount > 1;
                            if (isMulti) {
                              return (
                                <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                                  <MapPinned className="w-3 h-3" />
                                  Multi-Location
                                  {account.locationCount > 1 && (
                                    <span className="ml-1">({account.locationCount})</span>
                                  )}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
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
                      <td className="py-3 px-4 text-sm">
                        {account.pendingContractCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            {isMulti ? (
                              `${account.pendingContractCount} of ${account.locationCount} Pending`
                            ) : (
                              'Contract Pending'
                            )}
                          </span>
                        ) : (
                          <span className="text-navy-400">—</span>
                        )}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-navy-600">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} accounts
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm font-medium text-navy-700 bg-white border border-navy-200 rounded-lg hover:bg-navy-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          page === pageNum
                            ? 'bg-gold-600 text-white'
                            : 'bg-white text-navy-700 border border-navy-200 hover:bg-navy-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 text-sm font-medium text-navy-700 bg-white border border-navy-200 rounded-lg hover:bg-navy-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}

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

      {/* CSV Upload Modal */}
      {showCsvUpload && (
        <AccountCsvUpload
          onClose={() => setShowCsvUpload(false)}
          onSuccess={() => {
            setShowCsvUpload(false);
            fetchAccounts(page, searchQuery || undefined, countryFilter !== 'ALL' ? countryFilter : undefined, accountTypeFilter, documentStatusSort);
          }}
        />
      )}
    </div>
  );
}
