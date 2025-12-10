"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Location, Account, Agreement } from "@/lib/supabase/types";
import { ArrowLeft, MapPin, Building2, FileText, Trash2 } from "lucide-react";
import AgreementsList from "./AgreementsList";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

interface LocationDetailViewProps {
  location: Location;
  account: Account;
  agreements: Agreement[];
  isMultiLocation: boolean;
}

export default function LocationDetailView({
  location,
  account,
  agreements,
  isMultiLocation,
}: LocationDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "agreements">("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Only show agreements tab if this is a multi-location account
  // Use account_type or fallback to isMultiLocation flag
  const shouldShowAgreements = account.account_type === 'multi_location' || isMultiLocation;
  const tabs = [
    { id: "overview", label: "Overview", icon: MapPin },
    ...(shouldShowAgreements ? [{ id: "agreements" as const, label: "Agreements", icon: FileText }] : []),
  ];

  return (
    <div className="p-8">
      <Link
        href={`/admin/accounts/${account.id}`}
        className="inline-flex items-center gap-2 text-navy-600 hover:text-navy-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Account
      </Link>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-heading font-bold text-navy-900">
            {location.name}
          </h1>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Location
          </button>
        </div>
        <div className="flex items-center gap-4">
          {location.is_primary && (
            <span className="px-3 py-1 text-sm font-semibold bg-gold-100 text-gold-800 rounded-full">
              Primary Location
            </span>
          )}
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${
              location.status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {location.status}
          </span>
          <Link
            href={`/admin/accounts/${account.id}`}
            className="text-sm text-navy-600 hover:text-gold-600"
          >
            <Building2 className="w-4 h-4 inline mr-1" />
            {account.name}
          </Link>
        </div>
      </div>

      {/* Tabs */}
      {shouldShowAgreements && (
        <div className="border-b border-navy-200 mb-6">
          <nav className="flex gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-gold-600 text-gold-600"
                      : "border-transparent text-navy-600 hover:text-navy-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && (
          <div className="space-y-6">
        {/* Location Codes */}
        {(location.clinic_code || location.sage_code) && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
              Location Codes
            </h2>
            <dl className="grid md:grid-cols-2 gap-4">
              {location.clinic_code && (
                <div>
                  <dt className="text-xs text-navy-600 uppercase tracking-wide mb-1">Clinic Code</dt>
                  <dd className="text-sm text-navy-900 font-medium">{location.clinic_code}</dd>
                </div>
              )}
              {location.sage_code && (
                <div>
                  <dt className="text-xs text-navy-600 uppercase tracking-wide mb-1">Sage Code</dt>
                  <dd className="text-sm text-navy-900 font-medium">{location.sage_code}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Location Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gold-600" />
            Location Information
          </h2>
          <dl className="space-y-3">
            {(location.address_line1 || location.address_line2) && (
              <div>
                <dt className="text-sm text-navy-600">Address</dt>
                <dd className="text-navy-900">
                  {location.address_line1}
                  {location.address_line2 && `, ${location.address_line2}`}
                </dd>
              </div>
            )}
            {(location.city || location.state || location.zip_code) && (
              <div>
                <dt className="text-sm text-navy-600">City, State, ZIP</dt>
                <dd className="text-navy-900">
                  {[location.city, location.state, location.zip_code]
                    .filter(Boolean)
                    .join(", ")}
                </dd>
              </div>
            )}
            {location.country && (
              <div>
                <dt className="text-sm text-navy-600">Country</dt>
                <dd className="text-navy-900">{location.country}</dd>
              </div>
            )}
            {location.phone && (
              <div>
                <dt className="text-sm text-navy-600">Phone</dt>
                <dd className="text-navy-900">
                  <a
                    href={`tel:${location.phone}`}
                    className="text-gold-600 hover:text-gold-700"
                  >
                    {location.phone}
                  </a>
                </dd>
              </div>
            )}
            {location.email && (
              <div>
                <dt className="text-sm text-navy-600">Email</dt>
                <dd className="text-navy-900">
                  <a
                    href={`mailto:${location.email}`}
                    className="text-gold-600 hover:text-gold-700"
                  >
                    {location.email}
                  </a>
                </dd>
              </div>
            )}
            {location.contact_name && (
              <div>
                <dt className="text-sm text-navy-600">Contact Name</dt>
                <dd className="text-navy-900">
                  {location.contact_name}
                  {location.contact_title && ` (${location.contact_title})`}
                </dd>
              </div>
            )}
            {location.notes && (
              <div>
                <dt className="text-sm text-navy-600">Notes</dt>
                <dd className="text-navy-700 whitespace-pre-wrap">{location.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Account UDF Information */}
        {(account.sage_code || account.udf_clinic_name || account.udf_shipto_name || account.udf_country_code) && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gold-600" />
              Account Information
            </h2>
            <dl className="space-y-3 grid md:grid-cols-2 gap-4">
              {account.sage_code && (
                <div>
                  <dt className="text-sm text-navy-600">Sage Code</dt>
                  <dd className="text-navy-900">{account.sage_code}</dd>
                </div>
              )}
              {account.udf_clinic_name && (
                <div>
                  <dt className="text-sm text-navy-600">Clinic Name</dt>
                  <dd className="text-navy-900">{account.udf_clinic_name}</dd>
                </div>
              )}
              {account.udf_shipto_name && (
                <div>
                  <dt className="text-sm text-navy-600">Shipto Name</dt>
                  <dd className="text-navy-900">{account.udf_shipto_name}</dd>
                </div>
              )}
              {account.udf_country_code && (
                <div>
                  <dt className="text-sm text-navy-600">Country Code</dt>
                  <dd className="text-navy-900">{account.udf_country_code}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Account Address Information */}
        {(account.udf_address_line1 || account.udf_address_line2 || account.udf_address_line3 || account.udf_city || account.udf_state || account.udf_zipcode) && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
              Account Address Information
            </h2>
            <dl className="space-y-3">
              {account.udf_address_line1 && (
                <div>
                  <dt className="text-sm text-navy-600">Address Line 1</dt>
                  <dd className="text-navy-900">{account.udf_address_line1}</dd>
                </div>
              )}
              {account.udf_address_line2 && (
                <div>
                  <dt className="text-sm text-navy-600">Address Line 2</dt>
                  <dd className="text-navy-900">{account.udf_address_line2}</dd>
                </div>
              )}
              {account.udf_address_line3 && (
                <div>
                  <dt className="text-sm text-navy-600">Address Line 3</dt>
                  <dd className="text-navy-900">{account.udf_address_line3}</dd>
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-4">
                {account.udf_city && (
                  <div>
                    <dt className="text-sm text-navy-600">City</dt>
                    <dd className="text-navy-900">{account.udf_city}</dd>
                  </div>
                )}
                {account.udf_state && (
                  <div>
                    <dt className="text-sm text-navy-600">State</dt>
                    <dd className="text-navy-900">{account.udf_state}</dd>
                  </div>
                )}
                {account.udf_zipcode && (
                  <div>
                    <dt className="text-sm text-navy-600">Zipcode</dt>
                    <dd className="text-navy-900">{account.udf_zipcode}</dd>
                  </div>
                )}
              </div>
            </dl>
          </div>
        )}

        {/* Account Contact Information */}
        {(account.udf_phone || account.udf_email || account.udf_fax) && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
              Account Contact Information
            </h2>
            <dl className="space-y-3 grid md:grid-cols-3 gap-4">
              {account.udf_phone && (
                <div>
                  <dt className="text-sm text-navy-600">Phone</dt>
                  <dd className="text-navy-900">
                    <a
                      href={`tel:${account.udf_phone}`}
                      className="text-gold-600 hover:text-gold-700"
                    >
                      {account.udf_phone}
                    </a>
                  </dd>
                </div>
              )}
              {account.udf_email && (
                <div>
                  <dt className="text-sm text-navy-600">Email</dt>
                  <dd className="text-navy-900">
                    <a
                      href={`mailto:${account.udf_email}`}
                      className="text-gold-600 hover:text-gold-700"
                    >
                      {account.udf_email}
                    </a>
                  </dd>
                </div>
              )}
              {account.udf_fax && (
                <div>
                  <dt className="text-sm text-navy-600">Fax</dt>
                  <dd className="text-navy-900">{account.udf_fax}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Account Additional Notes */}
        {account.udf_notes && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
              Account Additional Notes
            </h2>
            <p className="text-navy-700 whitespace-pre-wrap">{account.udf_notes}</p>
          </div>
        )}
          </div>
        )}

        {activeTab === "agreements" && shouldShowAgreements && (
          <AgreementsList
            accountId={account.id}
            agreements={agreements}
          />
        )}
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            const response = await fetch(`/api/admin/locations/${location.id}`, {
              method: 'DELETE',
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to delete location');
            }

            // Redirect to account page after successful deletion
            router.push(`/admin/accounts/${account.id}`);
            router.refresh();
          } catch (error: any) {
            console.error('Error deleting location:', error);
            alert(`Failed to delete location: ${error.message}`);
            setIsDeleting(false);
          }
        }}
        title="Delete Location"
        message="Are you sure you want to delete this location? This will also delete all associated agreements."
        itemName={location.name}
        isLoading={isDeleting}
      />
    </div>
  );
}

