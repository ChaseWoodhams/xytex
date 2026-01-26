"use client";

import { useState, useEffect } from "react";
import { X, Search, Building2, MapPin } from "lucide-react";
import type { LocationScrapingResult, Location, Account } from "@/lib/supabase/types";

interface LocationMatchingModalProps {
  result: LocationScrapingResult;
  onClose: () => void;
  onMatch: (locationId?: string, accountId?: string) => Promise<void>;
}

export default function LocationMatchingModal({
  result,
  onClose,
  onMatch,
}: LocationMatchingModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchLocationsAndAccounts();
    } else {
      setLocations([]);
      setAccounts([]);
    }
  }, [searchQuery]);

  const searchLocationsAndAccounts = async () => {
    setIsLoading(true);
    try {
      // Search locations
      const locationsResponse = await fetch(
        `/api/admin/locations?search=${encodeURIComponent(searchQuery)}`
      );
      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json();
        setLocations(locationsData.slice(0, 10) || []);
      }

      // Search accounts
      const accountsResponse = await fetch(
        `/api/admin/accounts?search=${encodeURIComponent(searchQuery)}`
      );
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        setAccounts(accountsData.slice(0, 10) || []);
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!selectedLocationId && !selectedAccountId) {
      alert("Please select a location or account to match");
      return;
    }

    setIsMatching(true);
    try {
      await onMatch(selectedLocationId || undefined, selectedAccountId || undefined);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-navy-200">
          <h2 className="text-xl font-heading font-semibold text-navy-900">
            Match Scraped Result
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-navy-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Scraped Result Info */}
          <div className="bg-navy-50 rounded-lg p-4">
            <h3 className="font-medium text-navy-900 mb-2">Scraped Information</h3>
            <div className="space-y-1 text-sm text-navy-600">
              <p>
                <strong>Business:</strong> {result.business_name || "N/A"}
              </p>
              {result.address_line1 && (
                <p>
                  <strong>Address:</strong> {result.address_line1}
                  {result.city && `, ${result.city}`}
                  {result.state && ` ${result.state}`}
                </p>
              )}
              {result.phone && (
                <p>
                  <strong>Phone:</strong> {result.phone}
                </p>
              )}
              {result.email && (
                <p>
                  <strong>Email:</strong> {result.email}
                </p>
              )}
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              Search Locations or Accounts
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-navy-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, address, or phone..."
                className="w-full pl-10 pr-4 py-2 border border-navy-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              />
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="text-center text-navy-600 py-8">Searching...</div>
          ) : (
            <div className="space-y-4">
              {/* Locations */}
              {locations.length > 0 && (
                <div>
                  <h4 className="font-medium text-navy-900 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Locations ({locations.length})
                  </h4>
                  <div className="space-y-2">
                    {locations.map((location) => (
                      <label
                        key={location.id}
                        className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedLocationId === location.id
                            ? "border-gold-500 bg-gold-50"
                            : "border-navy-200 hover:border-navy-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="location"
                          value={location.id}
                          checked={selectedLocationId === location.id}
                          onChange={(e) => {
                            setSelectedLocationId(e.target.value);
                            setSelectedAccountId(null);
                          }}
                          className="sr-only"
                        />
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-navy-900">{location.name}</p>
                            {location.address_line1 && (
                              <p className="text-sm text-navy-600">
                                {location.address_line1}
                                {location.city && `, ${location.city}`}
                                {location.state && ` ${location.state}`}
                              </p>
                            )}
                            {location.phone && (
                              <p className="text-sm text-navy-600">{location.phone}</p>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Accounts */}
              {accounts.length > 0 && (
                <div>
                  <h4 className="font-medium text-navy-900 mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Accounts ({accounts.length})
                  </h4>
                  <div className="space-y-2">
                    {accounts.map((account) => (
                      <label
                        key={account.id}
                        className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedAccountId === account.id
                            ? "border-gold-500 bg-gold-50"
                            : "border-navy-200 hover:border-navy-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="account"
                          value={account.id}
                          checked={selectedAccountId === account.id}
                          onChange={(e) => {
                            setSelectedAccountId(e.target.value);
                            setSelectedLocationId(null);
                          }}
                          className="sr-only"
                        />
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-navy-900">{account.name}</p>
                            {account.website && (
                              <p className="text-sm text-navy-600">{account.website}</p>
                            )}
                            {account.primary_contact_email && (
                              <p className="text-sm text-navy-600">
                                {account.primary_contact_email}
                              </p>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {!isLoading && searchQuery.length >= 2 && locations.length === 0 && accounts.length === 0 && (
                <div className="text-center text-navy-600 py-8">
                  No matching locations or accounts found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-navy-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-navy-700 border border-navy-300 rounded-lg hover:bg-navy-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleMatch}
            disabled={isMatching || (!selectedLocationId && !selectedAccountId)}
            className="px-4 py-2 bg-navy-800 text-white rounded-lg hover:bg-navy-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMatching ? "Matching..." : "Match"}
          </button>
        </div>
      </div>
    </div>
  );
}
