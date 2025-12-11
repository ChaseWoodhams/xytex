"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Location, Agreement } from "@/lib/supabase/types";
import { MapPin, Plus, Edit, Trash2 } from "lucide-react";
import LocationForm from "./LocationForm";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { getLocationAgreementStatus } from "@/lib/supabase/agreements";

interface LocationsListProps {
  accountId: string;
  locations: Location[];
  locationAgreementsMap: Map<string, Agreement[]>;
}

export default function LocationsList({ accountId, locations, locationAgreementsMap }: LocationsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-semibold text-navy-900">
          Locations
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Location
        </button>
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
                  <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/admin/locations/${location.id}`}
                      className="p-2 text-navy-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteLocationId(location.id);
                      }}
                      className="p-2 text-navy-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
    </div>
  );
}

