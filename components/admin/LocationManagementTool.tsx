"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  MapPin, 
  Building2, 
  Plus, 
  Minus, 
  Merge, 
  Loader2, 
  Search, 
  AlertTriangle, 
  CheckCircle2,
  X
} from "lucide-react";
import type { Account, Location } from "@/lib/supabase/types";

interface LocationWithAccount extends Location {
  account_name: string;
  account_type: string;
}

export default function LocationManagementTool() {
  const [activeTab, setActiveTab] = useState<"add" | "remove" | "merge">("add");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [locations, setLocations] = useState<LocationWithAccount[]>([]);
  const [multiLocationAccounts, setMultiLocationAccounts] = useState<Account[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedTargetAccount, setSelectedTargetAccount] = useState<string | null>(null);
  const [selectedLocationToRemove, setSelectedLocationToRemove] = useState<string | null>(null);
  const [selectedLocation1, setSelectedLocation1] = useState<string | null>(null);
  const [selectedLocation2, setSelectedLocation2] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const searchSingleLocations = async () => {
    if (!searchQuery.trim()) {
      alert("Please enter a search query");
      return;
    }

    setSearching(true);
    setLocations([]);
    setResult(null);

    try {
      const response = await fetch(
        `/api/admin/data-tools/search-single-locations?q=${encodeURIComponent(searchQuery)}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to search locations");
      }

      const data = await response.json();
      setLocations(data.locations || []);
    } catch (error: any) {
      console.error("Error searching locations:", error);
      setResult({
        success: false,
        message: `Error: ${error.message}`,
      });
    } finally {
      setSearching(false);
    }
  };

  const loadMultiLocationAccounts = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/admin/data-tools/multi-location-accounts"
      );
      
      if (!response.ok) {
        throw new Error("Failed to load multi-location accounts");
      }

      const data = await response.json();
      setMultiLocationAccounts(data.accounts || []);
    } catch (error: any) {
      console.error("Error loading multi-location accounts:", error);
      setResult({
        success: false,
        message: `Error: ${error.message}`,
      });
    }
  }, []);

  const handleAddToMultiLocation = async () => {
    if (!selectedLocation || !selectedTargetAccount) {
      alert("Please select both a location and a target multi-location account");
      return;
    }

    if (!confirm(`Are you sure you want to move this location to the selected multi-location account?`)) {
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/data-tools/add-location-to-multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: selectedLocation,
          targetAccountId: selectedTargetAccount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add location");
      }

      const data = await response.json();
      setResult({
        success: true,
        message: `Successfully moved location to multi-location account. ${data.locationCount} locations now in account.`,
      });

      // Refresh search results
      if (searchQuery) {
        searchSingleLocations();
      }
      setSelectedLocation(null);
      setSelectedTargetAccount(null);
    } catch (error: any) {
      console.error("Error adding location:", error);
      setResult({
        success: false,
        message: `Failed: ${error.message}`,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveFromMultiLocation = async () => {
    if (!selectedLocationToRemove) {
      alert("Please select a location to remove");
      return;
    }

    const location = locations.find(l => l.id === selectedLocationToRemove);
    if (!location) {
      alert("Location not found");
      return;
    }

    if (!confirm(`Are you sure you want to remove this location from the multi-location account and create a new single-location account?`)) {
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/data-tools/remove-location-from-multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: selectedLocationToRemove,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove location");
      }

      const data = await response.json();
      setResult({
        success: true,
        message: `Successfully created new single-location account "${data.accountName}" with the removed location.`,
      });

      // Refresh search results
      if (searchQuery) {
        searchSingleLocations();
      }
      setSelectedLocationToRemove(null);
    } catch (error: any) {
      console.error("Error removing location:", error);
      setResult({
        success: false,
        message: `Failed: ${error.message}`,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleMergeLocations = async () => {
    if (!selectedLocation1 || !selectedLocation2) {
      alert("Please select two locations to merge");
      return;
    }

    if (selectedLocation1 === selectedLocation2) {
      alert("Please select two different locations");
      return;
    }

    const loc1 = locations.find(l => l.id === selectedLocation1);
    const loc2 = locations.find(l => l.id === selectedLocation2);

    if (!loc1 || !loc2) {
      alert("One or both locations not found");
      return;
    }

    if (!confirm(`Are you sure you want to merge "${loc1.name}" into "${loc2.name}"? This will combine all data from both locations.`)) {
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/data-tools/merge-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLocationId: selectedLocation1,
          targetLocationId: selectedLocation2,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to merge locations");
      }

      const data = await response.json();
      setResult({
        success: true,
        message: `Successfully merged locations. All data has been consolidated.`,
      });

      // Refresh search results
      if (searchQuery) {
        searchSingleLocations();
      }
      setSelectedLocation1(null);
      setSelectedLocation2(null);
    } catch (error: any) {
      console.error("Error merging locations:", error);
      setResult({
        success: false,
        message: `Failed: ${error.message}`,
      });
    } finally {
      setProcessing(false);
    }
  };

  // Load multi-location accounts when tab changes to "add" or "remove"
  useEffect(() => {
    if (activeTab === "add" || activeTab === "remove") {
      loadMultiLocationAccounts();
    }
  }, [activeTab, loadMultiLocationAccounts]);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-navy-100">
        <div>
          <h2 className="text-xl font-heading font-semibold text-navy-900 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location Management Tool
          </h2>
          <p className="text-sm text-navy-600 mt-1">
            Add locations to multi-location accounts, remove locations, or merge duplicate locations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-navy-200">
        <div className="flex">
          <button
            onClick={() => {
              setActiveTab("add");
              loadMultiLocationAccounts();
              setResult(null);
            }}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "add"
                ? "text-gold-600 border-b-2 border-gold-600 bg-gold-50"
                : "text-navy-600 hover:text-navy-900 hover:bg-cream-50"
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add to Multi-Location
          </button>
          <button
            onClick={() => {
              setActiveTab("remove");
              loadMultiLocationAccounts();
              setResult(null);
            }}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "remove"
                ? "text-gold-600 border-b-2 border-gold-600 bg-gold-50"
                : "text-navy-600 hover:text-navy-900 hover:bg-cream-50"
            }`}
          >
            <Minus className="w-4 h-4 inline mr-2" />
            Remove from Multi-Location
          </button>
          <button
            onClick={() => {
              setActiveTab("merge");
              setResult(null);
            }}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "merge"
                ? "text-gold-600 border-b-2 border-gold-600 bg-gold-50"
                : "text-navy-600 hover:text-navy-900 hover:bg-cream-50"
            }`}
          >
            <Merge className="w-4 h-4 inline mr-2" />
            Merge Locations
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Search Section */}
        <div className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchSingleLocations();
                }
              }}
              placeholder="Search locations by name, address, or account name..."
              className="flex-1 px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <button
              onClick={searchSingleLocations}
              disabled={searching || !searchQuery.trim()}
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
                  Search
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
              result.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={
                result.success ? "text-green-800" : "text-red-800"
              }
            >
              {result.message}
            </p>
            <button
              onClick={() => setResult(null)}
              className="ml-auto text-navy-400 hover:text-navy-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Add to Multi-Location Tab */}
        {activeTab === "add" && (
          <div className="space-y-4">
            <div className="bg-cream-50 p-4 rounded-lg">
              <h3 className="font-semibold text-navy-900 mb-2">
                Add Single Location to Multi-Location Account
              </h3>
              <p className="text-sm text-navy-600">
                Search for a single-location account, then select it and choose a multi-location account to move it to.
              </p>
            </div>

            {locations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-navy-900">Select Location:</h4>
                <div className="max-h-64 overflow-y-auto border border-navy-200 rounded-lg">
                  {locations
                    .filter(loc => loc.account_type === "single_location")
                    .map((location) => (
                      <div
                        key={location.id}
                        onClick={() => setSelectedLocation(location.id)}
                        className={`p-3 border-b border-navy-100 last:border-b-0 cursor-pointer hover:bg-cream-50 ${
                          selectedLocation === location.id ? "bg-gold-50 border-gold-300" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            checked={selectedLocation === location.id}
                            onChange={() => setSelectedLocation(location.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-navy-900">
                              {location.name}
                            </div>
                            <div className="text-sm text-navy-600">
                              Account: {location.account_name}
                            </div>
                            {location.address_line1 && (
                              <div className="text-xs text-navy-500 mt-1">
                                {location.address_line1}
                                {location.city && `, ${location.city}`}
                                {location.state && `, ${location.state}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {selectedLocation && (
              <div className="space-y-2">
                <h4 className="font-medium text-navy-900">Select Target Multi-Location Account:</h4>
                <select
                  value={selectedTargetAccount || ""}
                  onChange={(e) => setSelectedTargetAccount(e.target.value)}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="">Choose an account...</option>
                  {multiLocationAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedLocation && selectedTargetAccount && (
              <button
                onClick={handleAddToMultiLocation}
                disabled={processing}
                className="btn btn-primary flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Location to Account
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Remove from Multi-Location Tab */}
        {activeTab === "remove" && (
          <div className="space-y-4">
            <div className="bg-cream-50 p-4 rounded-lg">
              <h3 className="font-semibold text-navy-900 mb-2">
                Remove Location from Multi-Location Account
              </h3>
              <p className="text-sm text-navy-600">
                Search for a location in a multi-location account, then remove it to create a new single-location account.
              </p>
            </div>

            {locations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-navy-900">Select Location to Remove:</h4>
                <div className="max-h-64 overflow-y-auto border border-navy-200 rounded-lg">
                  {locations
                    .filter(loc => loc.account_type === "multi_location")
                    .map((location) => (
                      <div
                        key={location.id}
                        onClick={() => setSelectedLocationToRemove(location.id)}
                        className={`p-3 border-b border-navy-100 last:border-b-0 cursor-pointer hover:bg-cream-50 ${
                          selectedLocationToRemove === location.id ? "bg-gold-50 border-gold-300" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            checked={selectedLocationToRemove === location.id}
                            onChange={() => setSelectedLocationToRemove(location.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-navy-900">
                              {location.name}
                            </div>
                            <div className="text-sm text-navy-600">
                              Account: {location.account_name}
                            </div>
                            {location.address_line1 && (
                              <div className="text-xs text-navy-500 mt-1">
                                {location.address_line1}
                                {location.city && `, ${location.city}`}
                                {location.state && `, ${location.state}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {selectedLocationToRemove && (
              <button
                onClick={handleRemoveFromMultiLocation}
                disabled={processing}
                className="btn btn-primary flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Minus className="w-4 h-4" />
                    Remove Location & Create Single Account
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Merge Locations Tab */}
        {activeTab === "merge" && (
          <div className="space-y-4">
            <div className="bg-cream-50 p-4 rounded-lg">
              <h3 className="font-semibold text-navy-900 mb-2">
                Merge Duplicate Locations
              </h3>
              <p className="text-sm text-navy-600">
                Search for two locations that are duplicates, then merge them together. All data from the source location will be consolidated into the target location.
              </p>
            </div>

            {locations.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-navy-900">Source Location (to merge from):</h4>
                  <div className="max-h-64 overflow-y-auto border border-navy-200 rounded-lg">
                    {locations.map((location) => (
                      <div
                        key={location.id}
                        onClick={() => setSelectedLocation1(location.id)}
                        className={`p-3 border-b border-navy-100 last:border-b-0 cursor-pointer hover:bg-cream-50 ${
                          selectedLocation1 === location.id ? "bg-gold-50 border-gold-300" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            checked={selectedLocation1 === location.id}
                            onChange={() => setSelectedLocation1(location.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-navy-900">
                              {location.name}
                            </div>
                            <div className="text-sm text-navy-600">
                              {location.account_name}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-navy-900">Target Location (to merge into):</h4>
                  <div className="max-h-64 overflow-y-auto border border-navy-200 rounded-lg">
                    {locations
                      .filter(loc => loc.id !== selectedLocation1)
                      .map((location) => (
                        <div
                          key={location.id}
                          onClick={() => setSelectedLocation2(location.id)}
                          className={`p-3 border-b border-navy-100 last:border-b-0 cursor-pointer hover:bg-cream-50 ${
                            selectedLocation2 === location.id ? "bg-gold-50 border-gold-300" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="radio"
                              checked={selectedLocation2 === location.id}
                              onChange={() => setSelectedLocation2(location.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-navy-900">
                                {location.name}
                              </div>
                              <div className="text-sm text-navy-600">
                                {location.account_name}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {selectedLocation1 && selectedLocation2 && (
              <button
                onClick={handleMergeLocations}
                disabled={processing}
                className="btn btn-primary flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Merging...
                  </>
                ) : (
                  <>
                    <Merge className="w-4 h-4" />
                    Merge Locations
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {locations.length === 0 && !searching && searchQuery && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-navy-300 mx-auto mb-4" />
            <p className="text-navy-600">No locations found matching your search</p>
          </div>
        )}

        {locations.length === 0 && !searching && !searchQuery && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-navy-300 mx-auto mb-4" />
            <p className="text-navy-600">
              Enter a search query above to find locations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

