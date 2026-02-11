"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Location, Agreement, LocationUpload } from "@/lib/supabase/types";
import { MapPin, Plus, Edit, Trash2, Upload, FileSpreadsheet, Minus, Search, Loader2, X, ArrowRight, Check, Pencil } from "lucide-react";
import { showToast } from "@/components/shared/toast";
import LocationForm from "./LocationForm";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import LocationCsvUpload from "./LocationCsvUpload";
import LocationUploadHistory from "./LocationUploadHistory";
import { getLocationAgreementStatus } from "@/lib/supabase/agreements";

interface LocationsListProps {
  accountId: string;
  locations: Location[];
  locationAgreementsMap: Map<string, Agreement[]>;
  isMultiLocation?: boolean;
}

interface SearchResult {
  id: string;
  account_id: string;
  name: string;
  address_line1?: string;
  city?: string;
  state?: string;
  account_name: string;
  account_type: string;
}

export default function LocationsList({ accountId, locations, locationAgreementsMap, isMultiLocation = false }: LocationsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [removeLocationId, setRemoveLocationId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [uploads, setUploads] = useState<LocationUpload[]>([]);
  const [updatingPendingContract, setUpdatingPendingContract] = useState<Set<string>>(new Set());
  const [locationPendingContract, setLocationPendingContract] = useState<Map<string, boolean>>(
    new Map(locations.map(loc => [loc.id, loc.pending_contract_sent]))
  );
  // Add Existing Location state
  const [showAddExisting, setShowAddExisting] = useState(false);
  const [addExistingQuery, setAddExistingQuery] = useState("");
  const [addExistingResults, setAddExistingResults] = useState<SearchResult[]>([]);
  const [addExistingSearching, setAddExistingSearching] = useState(false);
  const [addExistingSelected, setAddExistingSelected] = useState<Set<string>>(new Set());
  const [addExistingProcessing, setAddExistingProcessing] = useState(false);
  // Inline edit state
  const [inlineEdit, setInlineEdit] = useState<{ locationId: string; field: string; value: string } | null>(null);
  const [isSavingInline, setIsSavingInline] = useState(false);
  // Bulk edit state
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkField, setBulkField] = useState<string>("status");
  const [bulkValue, setBulkValue] = useState<string>("");
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const router = useRouter();

  const saveInlineEdit = async () => {
    if (!inlineEdit) return;
    setIsSavingInline(true);
    try {
      const response = await fetch(`/api/admin/locations/${inlineEdit.locationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [inlineEdit.field]: inlineEdit.value.trim() || null }),
      });
      if (!response.ok) throw new Error('Failed to update');
      showToast("Updated successfully", "success");
      setInlineEdit(null);
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to save", "error");
    } finally {
      setIsSavingInline(false);
    }
  };

  const handleBulkApply = async () => {
    if (bulkSelected.size === 0 || !bulkValue) return;
    setIsBulkSaving(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const locationId of bulkSelected) {
      try {
        const response = await fetch(`/api/admin/locations/${locationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [bulkField]: bulkField === 'pending_contract_sent' ? bulkValue === 'true' : bulkValue }),
        });
        if (!response.ok) throw new Error('Failed');
        successCount++;
      } catch {
        errors.push(locationId);
      }
    }

    if (successCount > 0) {
      showToast(`Updated ${successCount} location${successCount !== 1 ? 's' : ''}${errors.length > 0 ? ` (${errors.length} failed)` : ''}`, "success");
      setBulkEditMode(false);
      setBulkSelected(new Set());
      setBulkValue("");
      router.refresh();
    } else {
      showToast("Failed to update locations", "error");
    }
    setIsBulkSaving(false);
  };

  const toggleBulkSelect = (locationId: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(locationId)) next.delete(locationId);
      else next.add(locationId);
      return next;
    });
  };

  const toggleBulkSelectAll = () => {
    if (bulkSelected.size === locations.length) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(new Set(locations.map(l => l.id)));
    }
  };

  // Fetch upload history
  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const response = await fetch(`/api/admin/locations/uploads?accountId=${accountId}`);
        if (response.ok) {
          const data = await response.json();
          setUploads(data);
        }
      } catch (error) {
        console.error('Error fetching uploads:', error);
      }
    };
    fetchUploads();
  }, [accountId]);

  // Sync pending contract state when locations change
  useEffect(() => {
    setLocationPendingContract(new Map(locations.map(loc => [loc.id, loc.pending_contract_sent])));
  }, [locations]);

  const refreshUploads = async () => {
    try {
      const response = await fetch(`/api/admin/locations/uploads?accountId=${accountId}`);
      if (response.ok) {
        const data = await response.json();
        setUploads(data);
      }
    } catch (error) {
      console.error('Error fetching uploads:', error);
    }
  };

  // Remove location from multi-location account
  const handleRemoveLocation = async (locationId: string) => {
    setIsRemoving(true);
    try {
      const response = await fetch('/api/admin/data-tools/remove-location-from-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove location');
      }

      const data = await response.json();
      showToast(`Successfully created new single-location account "${data.accountName}" with the removed location.`, "success");
      router.refresh();
    } catch (error: any) {
      console.error('Error removing location:', error);
      showToast(`Failed to remove location: ${error.message}`, "error");
    } finally {
      setIsRemoving(false);
      setRemoveLocationId(null);
    }
  };

  // Add Existing Location helpers
  const searchExistingLocations = async () => {
    if (!addExistingQuery.trim()) return;
    setAddExistingSearching(true);
    setAddExistingResults([]);
    try {
      const response = await fetch(
        `/api/admin/data-tools/search-single-locations?q=${encodeURIComponent(addExistingQuery)}`
      );
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      // Only show single-location results (not already part of this account)
      const filtered = (data.locations || []).filter(
        (loc: SearchResult) =>
          loc.account_type === "single_location" && loc.account_id !== accountId
      );
      setAddExistingResults(filtered);
    } catch (error) {
      console.error("Error searching locations:", error);
    } finally {
      setAddExistingSearching(false);
    }
  };

  const handleAddExistingLocations = async () => {
    if (addExistingSelected.size === 0) return;
    setAddExistingProcessing(true);
    let successCount = 0;
    const errors: string[] = [];
    for (const locationId of addExistingSelected) {
      try {
        const response = await fetch("/api/admin/data-tools/add-location-to-multi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationId, targetAccountId: accountId }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed");
        }
        successCount++;
      } catch (error: any) {
        errors.push(error.message);
      }
    }
    if (successCount > 0) {
      showToast(`Successfully added ${successCount} location${successCount !== 1 ? "s" : ""} to this account.${errors.length > 0 ? ` ${errors.length} failed.` : ""}`, "success");
      setShowAddExisting(false);
      setAddExistingSelected(new Set());
      setAddExistingResults([]);
      setAddExistingQuery("");
      router.refresh();
    } else {
      showToast(`Failed to add locations: ${errors.join(", ")}`, "error");
    }
    setAddExistingProcessing(false);
  };

  // Update location pending contract status
  const handleTogglePendingContract = async (locationId: string, checked: boolean) => {
    setUpdatingPendingContract(prev => new Set(prev).add(locationId));
    try {
      const response = await fetch(`/api/admin/locations/${locationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pending_contract_sent: checked }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pending contract status');
      }

      setLocationPendingContract(prev => {
        const newMap = new Map(prev);
        newMap.set(locationId, checked);
        return newMap;
      });
      router.refresh();
    } catch (error: any) {
      console.error('Error updating pending contract status:', error);
      showToast(`Failed to update pending contract status: ${error.message}`, "error");
    } finally {
      setUpdatingPendingContract(prev => {
        const newSet = new Set(prev);
        newSet.delete(locationId);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload History */}
      {uploads.length > 0 && (
        <LocationUploadHistory 
          uploads={uploads} 
          onRevert={() => {
            refreshUploads();
            router.refresh();
          }}
        />
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-semibold text-navy-900">
          Locations
        </h2>
        <div className="flex gap-3">
          {locations.length > 1 && (
            <button
              onClick={() => {
                setBulkEditMode(!bulkEditMode);
                if (bulkEditMode) { setBulkSelected(new Set()); setBulkValue(""); }
              }}
              className={`btn ${bulkEditMode ? 'btn-secondary' : 'btn-outline'} flex items-center gap-2`}
            >
              <Edit className="w-4 h-4" />
              {bulkEditMode ? 'Cancel Bulk' : 'Bulk Edit'}
            </button>
          )}
          {isMultiLocation && !bulkEditMode && (
            <button
              onClick={() => setShowAddExisting(true)}
              className="btn btn-outline flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Add Existing
            </button>
          )}
          {!bulkEditMode && (
            <button
              onClick={() => setShowCsvUpload(true)}
              className="btn btn-outline flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
          )}
          {!bulkEditMode && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn btn-primary"
            >
              <Plus className="w-5 h-5" />
              Add Location
            </button>
          )}
        </div>
      </div>

      {/* Bulk Edit Toolbar */}
      {bulkEditMode && locations.length > 0 && (
        <div className="mb-4 p-4 bg-navy-50 rounded-lg border border-navy-200">
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bulkSelected.size === locations.length}
                onChange={toggleBulkSelectAll}
                className="w-4 h-4 text-gold-600 border-navy-300 rounded focus:ring-gold-500"
              />
              <span className="text-sm font-medium text-navy-700">
                Select All ({bulkSelected.size}/{locations.length})
              </span>
            </label>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-navy-600 mb-1">Field to Update</label>
              <select
                value={bulkField}
                onChange={(e) => { setBulkField(e.target.value); setBulkValue(""); }}
                className="px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:outline-none"
              >
                <option value="status">Status</option>
                <option value="country">Country</option>
                <option value="pending_contract_sent">Contract Sent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-600 mb-1">New Value</label>
              {bulkField === 'status' ? (
                <select
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:outline-none"
                >
                  <option value="">Select...</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              ) : bulkField === 'pending_contract_sent' ? (
                <select
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:outline-none"
                >
                  <option value="">Select...</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  placeholder="Enter value..."
                  className="px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:outline-none"
                />
              )}
            </div>
            <button
              onClick={handleBulkApply}
              disabled={bulkSelected.size === 0 || !bulkValue || isBulkSaving}
              className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isBulkSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Apply to {bulkSelected.size} Location{bulkSelected.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {locations.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-navy-300 mx-auto mb-4" />
          <p className="text-navy-600 mb-4">No locations added yet</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            Add First Location
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {locations.map((location) => {
            const locAgreements = locationAgreementsMap.get(location.id) || [];
            const agreementStatus = getLocationAgreementStatus(locAgreements);
            return (
              <div
                key={location.id}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${bulkEditMode && bulkSelected.has(location.id) ? 'border-gold-400 bg-gold-50/30' : 'border-navy-200'}`}
              >
                <div className="flex items-start justify-between">
                  {bulkEditMode && (
                    <div className="flex items-center mr-3 pt-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={bulkSelected.has(location.id)}
                        onChange={() => toggleBulkSelect(location.id)}
                        className="w-4 h-4 text-gold-600 border-navy-300 rounded focus:ring-gold-500"
                      />
                    </div>
                  )}
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => bulkEditMode ? toggleBulkSelect(location.id) : router.push(`/admin/locations/${location.id}`)}
                  >
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Link
                        href={`/admin/locations/${location.id}`}
                        className="text-lg font-heading font-semibold text-navy-900 hover:text-gold-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {location.name}
                      </Link>
                      {location.is_primary && (
                        <span className="px-2 py-1 text-xs font-semibold bg-gold-100 text-gold-800 rounded-full">
                          Primary
                        </span>
                      )}
                      {location.total_vials_sold > 0 && (
                        <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                          {location.total_vials_sold} Vial{location.total_vials_sold !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          location.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {location.status}
                      </span>
                      {/* Agreement Status Badge */}
                      {agreementStatus.status === 'active' && (
                        <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                          Active Contract
                          {agreementStatus.activeCount > 1 && ` (${agreementStatus.activeCount})`}
                        </span>
                      )}
                      {agreementStatus.status === 'expired' && (
                        <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">
                          Expired Contract
                        </span>
                      )}
                      {agreementStatus.status === 'draft' && (
                        <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                          Draft Contract
                        </span>
                      )}
                      {agreementStatus.status === 'none' && (
                        <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                          No Contract
                        </span>
                      )}
                      {/* Upload List Badge */}
                      {location.upload_list_name && (
                        <span className="px-2 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full flex items-center gap-1">
                          <FileSpreadsheet className="w-3 h-3" />
                          {location.upload_list_name}
                        </span>
                      )}
                      {/* Pending Contract Badge */}
                      {locationPendingContract.get(location.id) && (
                        <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                          Contract Sent (Pending)
                        </span>
                      )}
                    </div>
                  <div className="text-sm text-navy-600 space-y-1">
                    {location.address_line1 && (
                      <p>
                        {location.address_line1}
                        {location.address_line2 && `, ${location.address_line2}`}
                      </p>
                    )}
                    {(location.city || location.state || location.zip_code) && (
                      <p>
                        {[location.city, location.state, location.zip_code]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {/* Phone - inline editable */}
                    {inlineEdit?.locationId === location.id && inlineEdit.field === 'phone' ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="tel"
                          value={inlineEdit.value}
                          onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit(); if (e.key === 'Escape') setInlineEdit(null); }}
                          className="px-2 py-0.5 border border-gold-400 rounded text-sm w-40 focus:outline-none focus:ring-1 focus:ring-gold-500"
                          autoFocus
                          disabled={isSavingInline}
                        />
                        <button onClick={saveInlineEdit} disabled={isSavingInline} className="p-0.5 text-green-600 hover:bg-green-50 rounded"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setInlineEdit(null)} className="p-0.5 text-navy-500 hover:bg-navy-50 rounded"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : location.phone ? (
                      <p className="group/phone flex items-center gap-1">
                        <a
                          href={`tel:${location.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-gold-600 hover:text-gold-700"
                        >
                          {location.phone}
                        </a>
                        <button
                          onClick={(e) => { e.stopPropagation(); setInlineEdit({ locationId: location.id, field: 'phone', value: location.phone || '' }); }}
                          className="p-0.5 text-navy-400 hover:text-gold-600 opacity-0 group-hover/phone:opacity-100 transition-opacity"
                        ><Pencil className="w-3 h-3" /></button>
                      </p>
                    ) : null}
                    {/* Email - inline editable */}
                    {inlineEdit?.locationId === location.id && inlineEdit.field === 'email' ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="email"
                          value={inlineEdit.value}
                          onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit(); if (e.key === 'Escape') setInlineEdit(null); }}
                          className="px-2 py-0.5 border border-gold-400 rounded text-sm w-48 focus:outline-none focus:ring-1 focus:ring-gold-500"
                          autoFocus
                          disabled={isSavingInline}
                        />
                        <button onClick={saveInlineEdit} disabled={isSavingInline} className="p-0.5 text-green-600 hover:bg-green-50 rounded"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setInlineEdit(null)} className="p-0.5 text-navy-500 hover:bg-navy-50 rounded"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : location.email ? (
                      <p className="group/email flex items-center gap-1">
                        <a
                          href={`mailto:${location.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-gold-600 hover:text-gold-700"
                        >
                          {location.email}
                        </a>
                        <button
                          onClick={(e) => { e.stopPropagation(); setInlineEdit({ locationId: location.id, field: 'email', value: location.email || '' }); }}
                          className="p-0.5 text-navy-400 hover:text-gold-600 opacity-0 group-hover/email:opacity-100 transition-opacity"
                        ><Pencil className="w-3 h-3" /></button>
                      </p>
                    ) : null}
                    {location.contact_name && (
                      <p className="text-navy-500">
                        <span className="text-xs bg-navy-100 text-navy-500 px-1 py-0.5 rounded mr-1">Legacy</span>
                        {location.contact_name}
                        {location.contact_title && ` (${location.contact_title})`}
                      </p>
                    )}
                  </div>
                    {location.notes && (
                      <p className="mt-2 text-sm text-navy-600">{location.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    {/* Pending Contract Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-blue-50 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={locationPendingContract.get(location.id) || false}
                        onChange={(e) => handleTogglePendingContract(location.id, e.target.checked)}
                        disabled={updatingPendingContract.has(location.id)}
                        className="w-4 h-4 text-blue-600 border-navy-300 rounded focus:ring-blue-500 focus:ring-2"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className={`text-xs ${locationPendingContract.get(location.id) ? 'text-blue-700 font-medium' : 'text-navy-600'}`}>
                        Contract Sent
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/locations/${location.id}`}
                        className="p-2 text-navy-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        title="Edit location"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      {isMultiLocation && locations.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRemoveLocationId(location.id);
                          }}
                          disabled={isRemoving}
                          className="p-2 text-navy-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove from account (creates new single-location account)"
                        >
                          {isRemoving && removeLocationId === location.id ? (
                            <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Minus className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteLocationId(location.id);
                        }}
                        className="p-2 text-navy-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete location permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="mt-6 p-6 bg-cream-50 rounded-lg border border-navy-200">
          <LocationForm
            accountId={accountId}
            onSuccess={() => {
              setShowForm(false);
              router.refresh();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {deleteLocationId && (
        <DeleteConfirmationDialog
          isOpen={!!deleteLocationId}
          onClose={() => setDeleteLocationId(null)}
          onConfirm={async () => {
            setIsDeleting(true);
            try {
              const response = await fetch(`/api/admin/locations/${deleteLocationId}`, {
                method: 'DELETE',
              });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete location');
              }

              // Refresh the router to update the locations list
              router.refresh();
            } catch (error: any) {
              console.error('Error deleting location:', error);
              showToast(`Failed to delete location: ${error.message}`, "error");
              setIsDeleting(false);
              setDeleteLocationId(null);
            }
          }}
          title="Delete Location"
          message="Are you sure you want to delete this location? This will also delete all associated agreements."
          itemName={locations.find(l => l.id === deleteLocationId)?.name || 'this location'}
          isLoading={isDeleting}
        />
      )}

      {removeLocationId && (
        <DeleteConfirmationDialog
          isOpen={!!removeLocationId}
          onClose={() => setRemoveLocationId(null)}
          onConfirm={async () => {
            await handleRemoveLocation(removeLocationId);
          }}
          title="Remove Location from Multi-Location Account"
          message="This will remove the location from this multi-location account and create a new single-location account with this location. The location and all its data will be preserved."
          itemName={locations.find(l => l.id === removeLocationId)?.name || 'this location'}
          isLoading={isRemoving}
          confirmText="Remove from Account"
          itemLabel="Location to remove from multi-location account:"
        />
      )}
      </div>

      {/* CSV Upload Modal */}
      {showCsvUpload && (
        <LocationCsvUpload
          accountId={accountId}
          onClose={() => setShowCsvUpload(false)}
          onSuccess={() => {
            setShowCsvUpload(false);
            refreshUploads();
            router.refresh();
          }}
        />
      )}

      {/* Add Existing Location Modal */}
      {showAddExisting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-navy-100 flex items-center justify-between bg-gradient-to-r from-navy-900 to-navy-800">
              <div className="flex items-center gap-3">
                <ArrowRight className="w-5 h-5 text-gold-400" />
                <h2 className="text-lg font-heading font-semibold text-white">
                  Add Existing Single-Location to This Account
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowAddExisting(false);
                  setAddExistingQuery("");
                  setAddExistingResults([]);
                  setAddExistingSelected(new Set());
                }}
                className="text-navy-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-auto space-y-4">
              <p className="text-sm text-navy-600">
                Search for single-location accounts to move into this multi-location account. The original single-location account will be deleted and its location added here.
              </p>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={addExistingQuery}
                  onChange={(e) => setAddExistingQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") searchExistingLocations(); }}
                  placeholder="Search by name, address, city, state..."
                  className="flex-1 px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
                <button
                  onClick={searchExistingLocations}
                  disabled={addExistingSearching || !addExistingQuery.trim()}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {addExistingSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
              </div>

              {addExistingResults.length > 0 && (
                <div className="border border-navy-200 rounded-lg max-h-80 overflow-y-auto">
                  {addExistingResults.map((loc) => {
                    const isSelected = addExistingSelected.has(loc.id);
                    return (
                      <div
                        key={loc.id}
                        onClick={() => {
                          setAddExistingSelected((prev) => {
                            const next = new Set(prev);
                            if (next.has(loc.id)) next.delete(loc.id);
                            else next.add(loc.id);
                            return next;
                          });
                        }}
                        className={`p-3 border-b border-navy-100 last:border-b-0 cursor-pointer hover:bg-cream-50 ${
                          isSelected ? "bg-gold-50 border-l-4 border-l-gold-500" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-navy-900">{loc.name}</p>
                            <p className="text-sm text-navy-600">Account: {loc.account_name}</p>
                            {(loc.address_line1 || loc.city || loc.state) && (
                              <p className="text-xs text-navy-500 mt-1">
                                {[loc.address_line1, loc.city, loc.state].filter(Boolean).join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {addExistingResults.length === 0 && !addExistingSearching && addExistingQuery && (
                <div className="text-center py-8 text-navy-500">
                  <MapPin className="w-10 h-10 mx-auto mb-2 text-navy-300" />
                  <p>No single-location accounts found matching your search</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-navy-100 bg-cream-50 flex items-center justify-between">
              <p className="text-sm text-navy-600">
                {addExistingSelected.size > 0
                  ? `${addExistingSelected.size} location${addExistingSelected.size !== 1 ? "s" : ""} selected`
                  : "Select locations to add"}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddExisting(false);
                    setAddExistingQuery("");
                    setAddExistingResults([]);
                    setAddExistingSelected(new Set());
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExistingLocations}
                  disabled={addExistingSelected.size === 0 || addExistingProcessing}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {addExistingProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add {addExistingSelected.size > 0 ? addExistingSelected.size : ""} to Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

