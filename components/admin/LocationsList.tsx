"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Location, Agreement, LocationUpload } from "@/lib/supabase/types";
import { MapPin, Plus, Edit, Trash2, Upload, FileSpreadsheet, Minus } from "lucide-react";
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
  const router = useRouter();

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
      alert(`Successfully created new single-location account "${data.accountName}" with the removed location.`);
      router.refresh();
    } catch (error: any) {
      console.error('Error removing location:', error);
      alert(`Failed to remove location: ${error.message}`);
    } finally {
      setIsRemoving(false);
      setRemoveLocationId(null);
    }
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
      alert(`Failed to update pending contract status: ${error.message}`);
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
          <button
            onClick={() => setShowCsvUpload(true)}
            className="btn btn-outline flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Add Location
          </button>
        </div>
      </div>

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
                className="border border-navy-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => router.push(`/admin/locations/${location.id}`)}
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
                    {location.phone && (
                      <p>
                        <a
                          href={`tel:${location.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-gold-600 hover:text-gold-700"
                        >
                          {location.phone}
                        </a>
                      </p>
                    )}
                    {location.email && (
                      <p>
                        <a
                          href={`mailto:${location.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-gold-600 hover:text-gold-700"
                        >
                          {location.email}
                        </a>
                      </p>
                    )}
                    {location.contact_name && (
                      <p>
                        <strong>Contact:</strong> {location.contact_name}
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
              alert(`Failed to delete location: ${error.message}`);
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
    </div>
  );
}

