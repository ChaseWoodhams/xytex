"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Package, Loader2 } from "lucide-react";
import type {
  Account,
  Location,
  CarePackageRequest,
  CarePackageShipment,
} from "@/lib/supabase/types";

interface ShipmentFormRow {
  id: string;
  label: string;
  recipient_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  quantity: number;
}

interface CarePackageRequestWithShipments extends CarePackageRequest {
  shipments: CarePackageShipment[];
}

export default function CarePackagesTab() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  
  // #region agent log
  // Track selectedAccountId changes
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:33',message:'selectedAccountId changed',data:{selectedAccountId,accountsLoaded:accounts.length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
  }, [selectedAccountId, accounts.length]);
  // #endregion
  const [accountSearch, setAccountSearch] = useState<string>("");
  const [locationSearch, setLocationSearch] = useState<string>("");
  const [showAccountSuggestions, setShowAccountSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [requests, setRequests] = useState<CarePackageRequestWithShipments[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  const [shipments, setShipments] = useState<ShipmentFormRow[]>([
    {
      id: "row-1",
      label: "Clinic office",
      recipient_name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip_code: "",
      country: "US",
      quantity: 1,
    },
  ]);

  useEffect(() => {
    async function loadAccounts() {
      try {
        // Fetch all accounts without pagination (simpler and more efficient)
        const res = await fetch("/api/admin/accounts");
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:69',message:'Account fetch response',data:{status:res?.ok,statusText:res?.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        if (!res.ok) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:72',message:'Account fetch failed',data:{status:res?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'F'})}).catch(()=>{});
          // #endregion
          return;
        }
        const data = await res.json();
        const list: Account[] = Array.isArray(data) ? data : data.accounts;
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:77',message:'Accounts loaded',data:{count:list?.length,accounts:list?.slice(0,3).map(a=>({id:a.id,name:a.name}))},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        setAccounts(list || []);
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:81',message:'Account load error',data:{error:err?.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        console.error("[CarePackagesTab] Error loading accounts", err);
      }
    }
    loadAccounts();
  }, []);

  useEffect(() => {
    async function loadLocations() {
      try {
        // Load all locations, not just for selected account, to enable better search
        const res = await fetch("/api/admin/locations");
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:78',message:'Location fetch response status',data:{status:res?.ok,statusText:res?.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        if (!res.ok) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:81',message:'Location fetch failed',data:{status:res?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          return;
        }
        const data: Location[] = await res.json();
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:85',message:'Locations loaded',data:{count:data?.length,locations:data?.slice(0,3).map(l=>({id:l.id,name:l.name,account_id:l.account_id}))},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setLocations(data || []);
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:88',message:'Location load error',data:{error:err?.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error("[CarePackagesTab] Error loading locations", err);
      }
    }
    loadLocations();
  }, []);

  const filteredAccounts = useMemo(() => {
    if (!accountSearch.trim()) {
      return accounts.sort((a, b) => a.name.localeCompare(b.name));
    }
    const searchLower = accountSearch.toLowerCase();
    return accounts
      .filter((acc) => acc.name.toLowerCase().includes(searchLower))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts, accountSearch]);

  const filteredLocations = useMemo(() => {
    // If account is selected, filter by account first, then by search
    let filtered = locations;
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:101',message:'Filtering locations start',data:{totalLocations:locations.length,selectedAccountId,locationSearch},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (selectedAccountId) {
      filtered = filtered.filter((loc) => loc.account_id === selectedAccountId);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:104',message:'After account filter',data:{filteredCount:filtered.length,accountId:selectedAccountId},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    }
    if (!locationSearch.trim()) {
      const result = filtered.sort((a, b) => a.name.localeCompare(b.name));
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:109',message:'Filtered locations (no search)',data:{count:result.length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return result;
    }
    const searchLower = locationSearch.toLowerCase();
    const result = filtered
      .filter(
        (loc) =>
          loc.name.toLowerCase().includes(searchLower) ||
          (loc.city && loc.city.toLowerCase().includes(searchLower))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:118',message:'Filtered locations (with search)',data:{count:result.length,searchTerm:locationSearch},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return result;
  }, [locations, locationSearch, selectedAccountId]);

  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);
  const selectedLocation = locations.find((loc) => loc.id === selectedLocationId);

  async function loadRequests() {
    setIsLoadingRequests(true);
    try {
      const url = new URL("/api/admin/care-packages", window.location.origin);
      url.searchParams.set("limit", "50");
      const res = await fetch(url.toString());
      if (!res.ok) {
        console.error("[CarePackagesTab] Failed to load requests", await res.text());
        return;
      }
      const data: CarePackageRequestWithShipments[] = await res.json();
      setRequests(data || []);
    } catch (err) {
      console.error("[CarePackagesTab] Error loading requests", err);
    } finally {
      setIsLoadingRequests(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAddShipmentRow = () => {
    setShipments((prev) => [
      ...prev,
      {
        id: `row-${prev.length + 1}`,
        label: "",
        recipient_name: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        zip_code: "",
        country: "US",
        quantity: 1,
      },
    ]);
  };

  const handleRemoveShipmentRow = (id: string) => {
    setShipments((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)));
  };

  const handleShipmentChange = (
    id: string,
    field: keyof ShipmentFormRow,
    value: string | number
  ) => {
    setShipments((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedAccountId) {
      setFormError("Please select an account.");
      return;
    }

    const hasValidShipment = shipments.some((s) => s.quantity > 0);
    if (!hasValidShipment) {
      setFormError("Please add at least one shipment with quantity > 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        account_id: selectedAccountId,
        location_id: selectedLocationId || null,
        notes: notes || null,
        shipments: shipments.map((s) => ({
          label: s.label || null,
          recipient_name: s.recipient_name || null,
          address_line1: s.address_line1 || null,
          address_line2: s.address_line2 || null,
          city: s.city || null,
          state: s.state || null,
          zip_code: s.zip_code || null,
          country: s.country || null,
          quantity: s.quantity || 1,
        })),
      };

      const res = await fetch("/api/admin/care-packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setFormError(body.error || "Failed to create care package request.");
        return;
      }

      setNotes("");
      setShipments([
        {
          id: "row-1",
          label: "Clinic office",
          recipient_name: "",
          address_line1: "",
          address_line2: "",
          city: "",
          state: "",
          zip_code: "",
          country: "US",
          quantity: 1,
        },
      ]);

      await loadRequests();
    } catch (err: any) {
      console.error("[CarePackagesTab] Error submitting request", err);
      setFormError(err.message || "Unexpected error creating request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRequestedPackages = useMemo(
    () => shipments.reduce((sum, s) => sum + (s.quantity || 0), 0),
    [shipments]
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-heading font-semibold text-navy-900 mb-1">
          Care Packages
        </h2>
        <p className="text-navy-600">
          Request care packages to be sent to clinic locations or custom addresses.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-md p-6 space-y-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-navy-900">
              New care package request
            </h3>
            <p className="text-sm text-navy-600">
              Choose a clinic account and optionally a location, then add one or
              more shipments. You can send multiple packages to the same
              location or to different addresses (including personal homes).
            </p>
          </div>
          <div className="text-sm text-navy-700">
            <span className="font-medium">Total packages:</span>{" "}
            {totalRequestedPackages}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-navy-800 mb-1">
              Account <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountSearch}
              onChange={(e) => {
                const value = e.target.value;
                setAccountSearch(value);
                setShowAccountSuggestions(true);
                // Clear selection when user starts typing
                if (selectedAccountId) {
                  setSelectedAccountId("");
                }
              }}
              onFocus={(e) => {
                setShowAccountSuggestions(true);
                // When focused, if there's a selected account, clear it to allow fresh search
                if (selectedAccount) {
                  setAccountSearch("");
                  setSelectedAccountId("");
                  // Clear the input value so user can type immediately
                  e.currentTarget.value = "";
                }
              }}
              onBlur={() => {
                // Delay hiding to allow click events
                setTimeout(() => {
                  setShowAccountSuggestions(false);
                  // If no account selected and we have a search value, clear it
                  if (!selectedAccountId && accountSearch) {
                    setAccountSearch("");
                  }
                }, 200);
              }}
              placeholder="Type to search accounts..."
              className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white"
            />
            {/* #region agent log */}
            {(() => {
              const shouldShow = showAccountSuggestions && filteredAccounts.length > 0;
              fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:342',message:'Account suggestions render check',data:{shouldShow,showAccountSuggestions,filteredAccountsCount:filteredAccounts.length,accountSearch},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
              return null;
            })()}
            {/* #endregion */}
            {showAccountSuggestions && filteredAccounts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-navy-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      // #region agent log
                      fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:316',message:'Account clicked',data:{accountId:acc.id,accountName:acc.name},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
                      // #endregion
                      setSelectedAccountId(acc.id);
                      setAccountSearch(acc.name); // Keep the name visible
                      setShowAccountSuggestions(false);
                      // #region agent log
                      fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:320',message:'After account selection',data:{accountId:acc.id},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
                      // #endregion
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-navy-50 focus:bg-navy-50 focus:outline-none"
                  >
                    {acc.name}
                  </button>
                ))}
              </div>
            )}
            {showAccountSuggestions &&
              filteredAccounts.length === 0 &&
              accountSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-navy-200 rounded-lg shadow-lg px-3 py-2 text-sm text-navy-600">
                  No accounts found
                </div>
              )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-navy-800 mb-1">
              Location (optional)
            </label>
              <input
              type="text"
              value={locationSearch}
              onChange={(e) => {
                const value = e.target.value;
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:361',message:'Location search changed',data:{value,selectedAccountId,filteredLocationsCount:filteredLocations.length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                setLocationSearch(value);
                setShowLocationSuggestions(true);
                // Clear selection when user starts typing
                if (selectedLocationId) {
                  setSelectedLocationId("");
                }
              }}
              onFocus={(e) => {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:369',message:'Location input focused',data:{selectedAccountId,selectedLocationId,filteredLocationsCount:filteredLocations.length,showLocationSuggestions:true},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                setShowLocationSuggestions(true);
                // When focused, if there's a selected location, clear it to allow fresh search
                if (selectedLocation) {
                  setLocationSearch("");
                  setSelectedLocationId("");
                  // Clear the input value so user can type immediately
                  e.currentTarget.value = "";
                }
              }}
              onBlur={() => {
                // Delay hiding to allow click events
                setTimeout(() => {
                  setShowLocationSuggestions(false);
                  // If no location selected and we have a search value, clear it
                  if (!selectedLocationId && locationSearch) {
                    setLocationSearch("");
                  }
                }, 200);
              }}
              placeholder={
                selectedAccountId
                  ? "Type to search locations..."
                  : "Select an account first"
              }
              disabled={!selectedAccountId}
              className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white disabled:bg-navy-50 disabled:text-navy-400 disabled:cursor-not-allowed"
            />
            {/* #region agent log */}
            {(() => {
              const shouldShow = showLocationSuggestions && selectedAccountId && filteredLocations.length > 0;
              fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:430',message:'Checking location suggestions render',data:{shouldShow,showLocationSuggestions,selectedAccountId,filteredLocationsCount:filteredLocations.length,locationSearch},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
              return null;
            })()}
            {/* #endregion */}
            {showLocationSuggestions &&
              selectedAccountId &&
              filteredLocations.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-navy-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {/* #region agent log */}
                  {/* Render logged separately */}
                  {/* #endregion */}
                  {filteredLocations.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => {
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:405',message:'Location clicked',data:{locationId:loc.id,locationName:loc.name},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
                        // #endregion
                        setSelectedLocationId(loc.id);
                        const locationText = `${loc.name}${loc.city ? ` – ${loc.city}` : ""}`;
                        setLocationSearch(locationText); // Keep the name visible
                        setShowLocationSuggestions(false);
                      }}
                      onMouseDown={(e) => {
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/11f82521-220b-46dc-b360-a5e4085b9b5b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CarePackagesTab.tsx:411',message:'Location button mousedown',data:{locationId:loc.id},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
                        // #endregion
                        e.preventDefault(); // Prevent blur from firing before click
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-navy-50 focus:bg-navy-50 focus:outline-none"
                    >
                      {loc.name}
                      {loc.city && (
                        <span className="text-navy-500"> – {loc.city}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            {showLocationSuggestions &&
              selectedAccountId &&
              filteredLocations.length === 0 &&
              locationSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-navy-200 rounded-lg shadow-lg px-3 py-2 text-sm text-navy-600">
                  No locations found
                </div>
              )}
            {/* #region agent log */}
            {/* Conditional render check */}
            {showLocationSuggestions && selectedAccountId && (
              <div style={{display:'none'}}>
                {/* Force re-render to log */}
                {/* Logged: showLocationSuggestions={showLocationSuggestions}, selectedAccountId={selectedAccountId}, filteredLocations.length={filteredLocations.length} */}
              </div>
            )}
            {/* #endregion */}
            {showLocationSuggestions &&
              selectedAccountId &&
              filteredLocations.length === 0 &&
              locationSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-navy-200 rounded-lg shadow-lg px-3 py-2 text-sm text-navy-600">
                  No locations found
                </div>
              )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-800 mb-1">
            Notes for marketing / fulfillment
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white"
            placeholder="Optional context about why we're sending these, what to include, etc."
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-sm font-semibold text-navy-900 uppercase tracking-wide">
              Shipments
            </h4>
            <button
              type="button"
              onClick={handleAddShipmentRow}
              className="inline-flex items-center gap-2 text-sm font-medium text-gold-700 hover:text-gold-800"
            >
              <Plus className="w-4 h-4" />
              Add shipment
            </button>
          </div>

          <div className="space-y-4">
            {shipments.map((row, index) => (
              <div
                key={row.id}
                className="border border-navy-100 rounded-lg p-4 space-y-3 bg-slate-50/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-navy-700">
                    <Package className="w-4 h-4" />
                    <span className="font-medium">
                      Shipment {index + 1}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveShipmentRow(row.id)}
                    className="text-xs text-navy-500 hover:text-red-600 disabled:opacity-40"
                    disabled={shipments.length <= 1}
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) =>
                        handleShipmentChange(row.id, "label", e.target.value)
                      }
                      className="w-full rounded-md border border-navy-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white"
                      placeholder="Clinic office, Dr. Smith home, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Recipient name
                    </label>
                    <input
                      type="text"
                      value={row.recipient_name}
                      onChange={(e) =>
                        handleShipmentChange(
                          row.id,
                          "recipient_name",
                          e.target.value
                        )
                      }
                      className="w-full rounded-md border border-navy-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white"
                      placeholder="Person receiving the package"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) =>
                        handleShipmentChange(
                          row.id,
                          "quantity",
                          Number(e.target.value || 1)
                        )
                      }
                      className="w-full rounded-md border border-navy-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Address line 1
                    </label>
                    <input
                      type="text"
                      value={row.address_line1}
                      onChange={(e) =>
                        handleShipmentChange(
                          row.id,
                          "address_line1",
                          e.target.value
                        )
                      }
                      className="w-full rounded-md border border-navy-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Address line 2
                    </label>
                    <input
                      type="text"
                      value={row.address_line2}
                      onChange={(e) =>
                        handleShipmentChange(
                          row.id,
                          "address_line2",
                          e.target.value
                        )
                      }
                      className="w-full rounded-md border border-navy-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={row.city}
                      onChange={(e) =>
                        handleShipmentChange(row.id, "city", e.target.value)
                      }
                      className="w-full rounded-md border border-navy-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={row.state}
                      onChange={(e) =>
                        handleShipmentChange(row.id, "state", e.target.value)
                      }
                      className="w-full rounded-md border border-navy-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Postal code
                    </label>
                    <input
                      type="text"
                      value={row.zip_code}
                      onChange={(e) =>
                        handleShipmentChange(row.id, "zip_code", e.target.value)
                      }
                      className="w-full rounded-md border border-navy-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={row.country}
                      onChange={(e) =>
                        handleShipmentChange(row.id, "country", e.target.value)
                      }
                      className="w-full rounded-md border border-navy-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white"
                      placeholder="US"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {formError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {formError}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-gold-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gold-700 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-1 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Submit request</span>
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-navy-900">
              Recent care package requests
            </h3>
            <p className="text-sm text-navy-600">
              Includes all shipments for the most recent requests.
            </p>
          </div>
          <button
            type="button"
            onClick={loadRequests}
            className="inline-flex items-center gap-2 text-sm text-navy-700 hover:text-navy-900"
          >
            <Loader2
              className={`w-4 h-4 ${isLoadingRequests ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>

        {isLoadingRequests ? (
          <div className="py-8 text-center text-navy-600 text-sm">
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-8 text-center text-navy-600 text-sm">
            No care package requests yet. Create your first one above.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const shipmentCount = req.shipments.length;
              const sentCount = req.shipments.filter(
                (s) => s.status === "sent"
              ).length;

              return (
                <div
                  key={req.id}
                  className="border border-navy-100 rounded-lg p-4 text-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-navy-900">
                        <span className="font-semibold">
                          Request on{" "}
                          {new Date(req.requested_at).toLocaleDateString()}
                        </span>
                      </div>
                      {req.notes && (
                        <p className="text-xs text-navy-700 max-w-2xl">
                          {req.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-navy-700">
                      <span>
                        Shipments: {sentCount}/{shipmentCount} sent
                      </span>
                    </div>
                  </div>

                  {req.shipments.length > 0 && (
                    <div className="mt-2 border-t border-navy-100 pt-2 overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="text-left text-navy-500">
                            <th className="py-1 pr-3 font-medium">Label</th>
                            <th className="py-1 pr-3 font-medium">
                              Recipient
                            </th>
                            <th className="py-1 pr-3 font-medium">Address</th>
                            <th className="py-1 pr-3 font-medium">Qty</th>
                            <th className="py-1 pr-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {req.shipments.map((s) => (
                            <tr key={s.id} className="border-t border-navy-50">
                              <td className="py-1 pr-3">
                                {s.label || <span className="text-navy-400">—</span>}
                              </td>
                              <td className="py-1 pr-3">
                                {s.recipient_name || (
                                  <span className="text-navy-400">—</span>
                                )}
                              </td>
                              <td className="py-1 pr-3 max-w-xs">
                                <div className="truncate">
                                  {[s.address_line1, s.address_line2]
                                    .filter(Boolean)
                                    .join(", ")}
                                  {(s.city || s.state || s.zip_code) && (
                                    <>
                                      {" "}
                                      •{" "}
                                      {[s.city, s.state, s.zip_code]
                                        .filter(Boolean)
                                        .join(", ")}
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="py-1 pr-3">{s.quantity}</td>
                              <td className="py-1 pr-3 capitalize">
                                {s.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

