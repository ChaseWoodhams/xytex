"use client";

import { useState } from "react";
import { Search, Merge, Loader2, Building2, MapPin, AlertTriangle, CheckCircle2, Eye, X, FileText, Clock, StickyNote, Phone, Mail } from "lucide-react";
import type { Account, Location, Agreement, Activity, Note } from "@/lib/supabase/types";
import { showToast } from "@/components/shared/toast";

interface AccountWithLocation extends Account {
  locations?: Array<{
    name: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
  }>;
}

interface SimilarityGroup {
  name: string;
  accounts: AccountWithLocation[];
  similarityScore: number;
}

export default function AccountMergeTool() {
  const [searching, setSearching] = useState(false);
  const [groups, setGroups] = useState<SimilarityGroup[]>([]);
  const [merging, setMerging] = useState<string | null>(null);
  const [mergeResult, setMergeResult] = useState<{ success: boolean; message: string } | null>(null);
  const [minSimilarity, setMinSimilarity] = useState(0.7);
  const [selectedAccounts, setSelectedAccounts] = useState<Map<number, Set<string>>>(new Map());
  const [viewingAccount, setViewingAccount] = useState<string | null>(null);
  const [matchMode, setMatchMode] = useState<'name' | 'address' | 'both'>('name');
  const [accountDetails, setAccountDetails] = useState<{
    account: Account;
    locations: Location[];
    agreements: Agreement[];
    activities: Activity[];
    notes: Note[];
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const findSimilarAccounts = async () => {
    setSearching(true);
    setGroups([]);
    setSelectedAccounts(new Map());
    setMergeResult(null);

    try {
      const response = await fetch(`/api/admin/data-tools/find-similar-accounts?mode=${matchMode}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to find similar accounts (${response.status})`);
      }

      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error: any) {
      console.error('Error finding similar accounts:', error);
      showToast(error.message || 'Failed to find similar accounts', 'error');
    } finally {
      setSearching(false);
    }
  };

  const toggleAccount = (groupIndex: number, accountId: string) => {
    const newSelected = new Map(selectedAccounts);
    const groupSelected = newSelected.get(groupIndex) || new Set<string>();
    
    if (groupSelected.has(accountId)) {
      groupSelected.delete(accountId);
    } else {
      groupSelected.add(accountId);
    }
    
    if (groupSelected.size === 0) {
      newSelected.delete(groupIndex);
    } else {
      newSelected.set(groupIndex, groupSelected);
    }
    
    setSelectedAccounts(newSelected);
  };

  const toggleAllInGroup = (groupIndex: number, accountIds: string[]) => {
    const newSelected = new Map(selectedAccounts);
    const groupSelected = newSelected.get(groupIndex) || new Set<string>();
    const allSelected = accountIds.every(id => groupSelected.has(id));
    
    if (allSelected) {
      // Deselect all
      newSelected.delete(groupIndex);
    } else {
      // Select all
      newSelected.set(groupIndex, new Set(accountIds));
    }
    
    setSelectedAccounts(newSelected);
  };

  const handleMergeGroup = async (groupIndex: number) => {
    const group = groups[groupIndex];
    const groupSelected = selectedAccounts.get(groupIndex) || new Set<string>();
    const accountIdsToMerge = Array.from(groupSelected);
    
    if (accountIdsToMerge.length < 2) {
      showToast('Please select at least 2 accounts to merge', 'error');
      return;
    }

    setMerging(`group-${groupIndex}`);
    setMergeResult(null);

    try {
      const response = await fetch('/api/admin/data-tools/merge-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountIds: accountIdsToMerge,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to merge accounts');
      }

      const result = await response.json();
      setMergeResult({
        success: true,
        message: `Successfully merged ${accountIdsToMerge.length} accounts into 1 multi-location account with ${result.locationCount} locations.`,
      });

      // Refresh the groups
      setTimeout(() => {
        findSimilarAccounts();
      }, 1000);
    } catch (error: any) {
      console.error('Error merging accounts:', error);
      setMergeResult({
        success: false,
        message: `Failed to merge accounts: ${error.message}`,
      });
    } finally {
      setMerging(null);
    }
  };

  // Filter groups by minimum similarity
  const filteredGroups = groups.filter(group => group.similarityScore >= minSimilarity);

  const handleViewAccount = async (accountId: string) => {
    setViewingAccount(accountId);
    setLoadingDetails(true);
    setAccountDetails(null);

    try {
      const response = await fetch(`/api/admin/accounts/${accountId}/details`);
      if (!response.ok) {
        throw new Error('Failed to fetch account details');
      }
      const data = await response.json();
      setAccountDetails({
        account: data.account,
        locations: data.locations || [],
        agreements: data.agreements || [],
        activities: data.activities || [],
        notes: data.notes || [],
      });
    } catch (error: any) {
      console.error('Error fetching account details:', error);
      alert(`Error: ${error.message}`);
      setViewingAccount(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <>
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-navy-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-semibold text-navy-900 flex items-center gap-2">
              <Merge className="w-5 h-5" />
              Account Merge Tool
            </h2>
            <p className="text-sm text-navy-600 mt-1">
              Find single-location accounts with similar names and merge them into multi-location accounts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex border border-navy-200 rounded-lg overflow-hidden">
              {(['name', 'address', 'both'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMatchMode(m)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    matchMode === m
                      ? 'bg-gold-600 text-white'
                      : 'bg-white text-navy-600 hover:bg-navy-50'
                  }`}
                >
                  {m === 'name' ? 'By Name' : m === 'address' ? 'By Address' : 'Both'}
                </button>
              ))}
            </div>
            <button
              onClick={findSimilarAccounts}
              disabled={searching}
              className="btn btn-primary flex items-center gap-2"
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Find Similar Accounts
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {groups.length === 0 && !searching && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-navy-300 mx-auto mb-4" />
            <p className="text-navy-600">
              Click &quot;Find Similar Accounts&quot; to search for single-location accounts with similar names
            </p>
          </div>
        )}

        {searching && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-navy-400 animate-spin mx-auto mb-4" />
            <p className="text-navy-600">Searching for similar accounts...</p>
          </div>
        )}

        {groups.length > 0 && (
          <>
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-navy-600">
                  Found {groups.length} groups ({filteredGroups.length} above {Math.round(minSimilarity * 100)}% similarity)
                </p>
              </div>
              
              {/* Similarity filter */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-navy-700">
                  Minimum Similarity:
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={minSimilarity}
                  onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-semibold text-navy-900 w-12 text-right">
                  {Math.round(minSimilarity * 100)}%
                </span>
              </div>
            </div>

            {mergeResult && (
              <div
                className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
                  mergeResult.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {mergeResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <p
                  className={
                    mergeResult.success ? "text-green-800" : "text-red-800"
                  }
                >
                  {mergeResult.message}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {filteredGroups.map((group, groupIndex) => {
                const isMerging = merging === `group-${groupIndex}`;
                const originalIndex = groups.findIndex(g => g === group);
                const groupSelected = selectedAccounts.get(originalIndex) || new Set<string>();
                const allAccountIds = group.accounts.map(acc => acc.id);
                const selectedCount = groupSelected.size;
                const allSelected = selectedCount === group.accounts.length && group.accounts.length > 0;

                return (
                  <div
                    key={originalIndex}
                    className="border-2 rounded-lg overflow-hidden border-navy-200"
                  >
                    <div className="p-4 bg-cream-50 border-b border-navy-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() => toggleAllInGroup(originalIndex, allAccountIds)}
                            className="w-4 h-4 text-gold-600 rounded"
                          />
                          <div>
                            <h3 className="font-semibold text-navy-900 text-left">
                              {group.name}
                            </h3>
                            <p className="text-sm text-navy-600 text-left">
                              {group.accounts.length} accounts • Match Probability:{" "}
                              <span className="font-semibold text-gold-600">
                                {Math.round(group.similarityScore * 100)}%
                              </span>
                              {selectedCount > 0 && (
                                <span className="ml-2 text-navy-700">
                                  ({selectedCount} selected)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleMergeGroup(originalIndex)}
                          disabled={isMerging || selectedCount < 2}
                          className="btn btn-primary flex items-center gap-2"
                        >
                          {isMerging ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Merging...
                            </>
                          ) : (
                            <>
                              <Merge className="w-4 h-4" />
                              Merge {selectedCount || group.accounts.length} Account{selectedCount !== 1 ? 's' : ''}
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-white">
                      {group.accounts.map((account) => {
                        const isSelected = groupSelected.has(account.id);
                        // Debug: log account data to help diagnose
                        if (process.env.NODE_ENV === 'development') {
                        }
                        return (
                          <div
                            key={account.id}
                            className={`px-4 py-3 border-b border-navy-100 last:border-b-0 ${
                              isSelected ? 'bg-gold-50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleAccount(originalIndex, account.id)}
                                className="w-4 h-4 text-gold-600 rounded mt-1"
                              />
                              <Building2 className="w-4 h-4 text-navy-400 flex-shrink-0 mt-1" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-navy-900">
                                    {account.name}
                                  </span>
                                  <span className="px-2 py-0.5 text-xs font-semibold bg-navy-100 text-navy-700 rounded-full">
                                    {account.account_type === "single_location"
                                      ? "Single"
                                      : "Multi"}
                                  </span>
                                  {account.sage_code && (
                                    <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-gold-100 text-gold-800 rounded-full">
                                      SAGE: {account.sage_code}
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewAccount(account.id);
                                    }}
                                    className="ml-auto px-2 py-1 text-xs text-navy-600 hover:text-navy-900 hover:bg-navy-100 rounded flex items-center gap-1 transition-colors"
                                    title="View account details"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View Details
                                  </button>
                                </div>
                                {account.locations && account.locations.length > 0 ? (
                                  <div className="mt-2 space-y-2">
                                    {account.locations.map((location, locIndex) => {
                                      const addressParts = [
                                        location.address_line1,
                                        location.address_line2,
                                        location.city,
                                        location.state,
                                        location.zip_code,
                                      ].filter(Boolean);
                                      
                                      const hasAddress = addressParts.length > 0;
                                      const locationName = location.name;
                                      
                                      if (!hasAddress && !locationName) return null;
                                      
                                      return (
                                        <div key={locIndex} className="flex items-start gap-2 text-sm text-navy-600">
                                          <MapPin className="w-3 h-3 text-navy-400 flex-shrink-0 mt-0.5" />
                                          <div className="flex-1">
                                            {locationName && (
                                              <div className="font-medium text-navy-700 mb-0.5">
                                                {locationName}
                                              </div>
                                            )}
                                            {hasAddress && (
                                              <div>{addressParts.join(', ')}</div>
                                            )}
                                            {!hasAddress && locationName && (
                                              <div className="text-navy-500 italic">No address on file</div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : account.locations === undefined ? (
                                  <div className="mt-1 text-xs text-navy-500 italic">Loading locations...</div>
                                ) : (
                                  <div className="mt-1 text-xs text-navy-500 italic">No locations found</div>
                                )}
                                {account.primary_contact_email && (
                                  <p className="text-xs text-navy-500 mt-1">
                                    {account.primary_contact_email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>

      {/* Account Details Modal */}
      {viewingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-navy-200 flex items-center justify-between">
              <h3 className="text-xl font-heading font-semibold text-navy-900">
                Account Details
              </h3>
              <button
                onClick={() => {
                  setViewingAccount(null);
                  setAccountDetails(null);
                }}
                className="p-2 hover:bg-navy-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-navy-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-navy-400 animate-spin" />
                </div>
              ) : accountDetails ? (
                <div className="space-y-6">
                  {/* Account Info */}
                  <div>
                    <h4 className="text-lg font-semibold text-navy-900 mb-3 flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Account Information
                    </h4>
                    <div className="bg-cream-50 rounded-lg p-4 space-y-2">
                      <div>
                        <span className="font-medium text-navy-700">Name:</span>{" "}
                        <span className="text-navy-900">{accountDetails?.account?.name || 'N/A'}</span>
                      </div>
                      {accountDetails?.account?.website && (
                        <div>
                          <span className="font-medium text-navy-700">Website:</span>{" "}
                          <a
                            href={accountDetails?.account?.website || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {accountDetails?.account?.website}
                          </a>
                        </div>
                      )}
                      {accountDetails?.account?.industry && (
                        <div>
                          <span className="font-medium text-navy-700">Industry:</span>{" "}
                          <span className="text-navy-900">{accountDetails?.account?.industry}</span>
                        </div>
                      )}
                      {accountDetails?.account?.primary_contact_name && (
                        <div>
                          <span className="font-medium text-navy-700">Primary Contact:</span>{" "}
                          <span className="text-navy-900">{accountDetails?.account?.primary_contact_name}</span>
                        </div>
                      )}
                      {accountDetails?.account?.primary_contact_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-navy-400" />
                          <span className="text-navy-900">{accountDetails?.account?.primary_contact_email}</span>
                        </div>
                      )}
                      {accountDetails?.account?.primary_contact_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-navy-400" />
                          <span className="text-navy-900">{accountDetails?.account?.primary_contact_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Locations */}
                  <div>
                    <h4 className="text-lg font-semibold text-navy-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Locations ({accountDetails?.locations?.length || 0})
                    </h4>
                    <div className="space-y-3">
                      {accountDetails?.locations?.map((location) => (
                        <div key={location.id} className="bg-cream-50 rounded-lg p-4">
                          <div className="font-medium text-navy-900 mb-2">{location.name}</div>
                          {location.address_line1 && (
                            <div className="text-sm text-navy-600">
                              {location.address_line1}
                              {location.address_line2 && `, ${location.address_line2}`}
                              {location.city && `, ${location.city}`}
                              {location.state && `, ${location.state}`}
                              {location.zip_code && ` ${location.zip_code}`}
                            </div>
                          )}
                          {location.phone && (
                            <div className="text-sm text-navy-600 flex items-center gap-2 mt-1">
                              <Phone className="w-3 h-3" />
                              {location.phone}
                            </div>
                          )}
                          {location.email && (
                            <div className="text-sm text-navy-600 flex items-center gap-2 mt-1">
                              <Mail className="w-3 h-3" />
                              {location.email}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Agreements */}
                  {(accountDetails?.agreements?.length || 0) > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-navy-900 mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Agreements ({accountDetails?.agreements?.length || 0})
                      </h4>
                      <div className="space-y-2">
                        {accountDetails?.agreements?.slice(0, 5).map((agreement) => (
                          <div key={agreement.id} className="bg-cream-50 rounded-lg p-3">
                            <div className="font-medium text-navy-900">{agreement.title}</div>
                            <div className="text-sm text-navy-600">
                              {agreement.agreement_type} • {agreement.status}
                            </div>
                          </div>
                        ))}
                        {(accountDetails?.agreements?.length || 0) > 5 && (
                          <div className="text-sm text-navy-600 text-center py-2">
                            +{(accountDetails?.agreements?.length || 0) - 5} more agreements
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Activities */}
                  {(accountDetails?.activities?.length || 0) > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-navy-900 mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Recent Activities ({accountDetails?.activities?.length || 0})
                      </h4>
                      <div className="space-y-2">
                        {accountDetails?.activities?.slice(0, 5).map((activity) => (
                          <div key={activity.id} className="bg-cream-50 rounded-lg p-3">
                            <div className="font-medium text-navy-900">{activity.subject}</div>
                            <div className="text-sm text-navy-600">
                              {activity.activity_type} • {new Date(activity.activity_date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                        {(accountDetails?.activities?.length || 0) > 5 && (
                          <div className="text-sm text-navy-600 text-center py-2">
                            +{(accountDetails?.activities?.length || 0) - 5} more activities
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {(accountDetails?.notes?.length || 0) > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-navy-900 mb-3 flex items-center gap-2">
                        <StickyNote className="w-5 h-5" />
                        Notes ({accountDetails?.notes?.length || 0})
                      </h4>
                      <div className="space-y-2">
                        {accountDetails?.notes?.slice(0, 3).map((note) => (
                          <div key={note.id} className="bg-cream-50 rounded-lg p-3">
                            {note.title && (
                              <div className="font-medium text-navy-900 mb-1">{note.title}</div>
                            )}
                            <div className="text-sm text-navy-600">{note.content}</div>
                          </div>
                        ))}
                        {(accountDetails?.notes?.length || 0) > 3 && (
                          <div className="text-sm text-navy-600 text-center py-2">
                            +{(accountDetails?.notes?.length || 0) - 3} more notes
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-navy-600">
                  Failed to load account details
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}


