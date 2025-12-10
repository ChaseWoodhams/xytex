"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  Account,
  Location,
  Agreement,
  Activity,
  Note,
} from "@/lib/supabase/types";
import { ArrowLeft, Building2, MapPin, FileText, Clock, StickyNote, Plus, Phone, Mail, Trash2 } from "lucide-react";
import LocationsList from "./LocationsList";
import AgreementsList from "./AgreementsList";
import LocationContacts from "./LocationContacts";
import ActivitiesTimeline from "./ActivitiesTimeline";
import NotesSection from "./NotesSection";
import NetworkDashboard from "./NetworkDashboard";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { getLocationAgreementStatus } from "@/lib/supabase/agreements";

interface AccountDetailViewProps {
  account: Account;
  locations: Location[];
  agreements: Agreement[];
  locationAgreementsMap: Map<string, Agreement[]>;
  activities: Activity[];
  notes: Note[];
  currentUserId: string;
}

export default function AccountDetailView({
  account,
  locations,
  agreements,
  locationAgreementsMap,
  activities,
  notes,
  currentUserId,
}: AccountDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "locations" | "agreements" | "activities" | "notes">("overview");
  const [locationFilter, setLocationFilter] = useState<'all' | 'needs_contract' | 'active' | 'expired' | 'draft'>('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);

  // Determine if this is a multi-location account based on account_type or actual location count
  const isMultiLocation = account.account_type === 'multi_location' || locations.length > 1;
  
  // Only show locations tab if it's a multi-location account and there are multiple locations
  // Only show agreements tab if it's a single-location account (for multi-location accounts, agreements are on location pages)
  type TabId = "overview" | "locations" | "agreements" | "activities" | "notes";
  const tabs: Array<{ id: TabId; label: string; icon: typeof Building2 }> = [
    { id: "overview", label: "Overview", icon: Building2 },
    ...(isMultiLocation && locations.length > 1 ? [{ id: "locations" as TabId, label: "Locations", icon: MapPin }] : []),
    ...(!isMultiLocation || locations.length <= 1 ? [{ id: "agreements" as TabId, label: "Agreements", icon: FileText }] : []),
    { id: "activities", label: "Activities", icon: Clock },
    { id: "notes", label: "Notes", icon: StickyNote },
  ];

  // Ensure active tab is valid for account type
  useEffect(() => {
    if (activeTab === "locations" && !isMultiLocation) {
      setTimeout(() => setActiveTab("overview"), 0);
    }
    if ((activeTab === "agreements" || activeTab === "activities" || activeTab === "notes") && isMultiLocation && locations.length > 1) {
      setTimeout(() => setActiveTab("overview"), 0);
    }
  }, [activeTab, isMultiLocation, locations.length]);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/accounts/${account.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }

      // Redirect to accounts list after successful deletion
      router.push('/admin/accounts');
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      alert(`Failed to delete account: ${error.message}`);
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8">
      <Link
        href="/admin/accounts"
        className="inline-flex items-center gap-2 text-navy-600 hover:text-navy-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Accounts
      </Link>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-heading font-bold text-navy-900">
              {account.name}
            </h1>
          {/* Organization Type Badge */}
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${
              isMultiLocation
                ? "bg-blue-100 text-blue-800"
                : "bg-navy-100 text-navy-800"
            }`}
          >
            {isMultiLocation ? "Multi-Location Organization" : "Single Location"}
          </span>
          </div>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
        {/* Additional Information fields */}
        {(account.sage_code || account.udf_clinic_name || account.udf_shipto_name || account.udf_country_code || 
          account.website || account.industry || account.annual_revenue || account.employee_count ||
          account.udf_address_line1 || account.udf_address_line2 || account.udf_address_line3 || 
          account.udf_city || account.udf_state || account.udf_zipcode) && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {account.sage_code && (
              <div>
                <dt className="text-xs text-navy-600 uppercase tracking-wide mb-1">Sage Code</dt>
                <dd className="text-sm text-navy-900 font-medium">{account.sage_code}</dd>
              </div>
            )}
            {account.udf_clinic_name && (
              <div>
                <dt className="text-xs text-navy-600 uppercase tracking-wide mb-1">Clinic Name</dt>
                <dd className="text-sm text-navy-900 font-medium">{account.udf_clinic_name}</dd>
              </div>
            )}
            {account.udf_shipto_name && (
              <div>
                <dt className="text-xs text-navy-600 uppercase tracking-wide mb-1">Shipto Name</dt>
                <dd className="text-sm text-navy-900 font-medium">{account.udf_shipto_name}</dd>
              </div>
            )}
            {account.udf_country_code && (
              <div>
                <dt className="text-xs text-navy-600 uppercase tracking-wide mb-1">Country Code</dt>
                <dd className="text-sm text-navy-900 font-medium">{account.udf_country_code}</dd>
              </div>
            )}
            {account.website && (
              <div>
                <dt className="text-xs text-navy-600 uppercase tracking-wide mb-1">Website</dt>
                <dd className="text-sm text-navy-900 font-medium">
                  <a
                    href={account.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold-600 hover:text-gold-700"
                  >
                    {account.website}
                  </a>
                </dd>
              </div>
            )}
            {account.industry && (
              <div>
                <dt className="text-xs text-navy-600 uppercase tracking-wide mb-1">Industry</dt>
                <dd className="text-sm text-navy-900 font-medium">{account.industry}</dd>
              </div>
            )}
            {account.annual_revenue && (
              <div>
                <dt className="text-xs text-navy-600 uppercase tracking-wide mb-1">Annual Revenue</dt>
                <dd className="text-sm text-navy-900 font-medium">
                  ${account.annual_revenue.toLocaleString()}
                </dd>
              </div>
            )}
            {account.employee_count && (
              <div>
                <dt className="text-xs text-navy-600 uppercase tracking-wide mb-1">Employee Count</dt>
                <dd className="text-sm text-navy-900 font-medium">
                  {account.employee_count.toLocaleString()}
                </dd>
              </div>
            )}
            {(account.udf_address_line1 || account.udf_address_line2 || account.udf_address_line3 || 
              account.udf_city || account.udf_state || account.udf_zipcode) && (
              <div className="md:col-span-2">
                <dt className="text-xs text-navy-600 uppercase tracking-wide mb-1">Address</dt>
                <dd className="text-sm text-navy-900 font-medium">
                  {account.udf_address_line1 && <div>{account.udf_address_line1}</div>}
                  {account.udf_address_line2 && <div>{account.udf_address_line2}</div>}
                  {account.udf_address_line3 && <div>{account.udf_address_line3}</div>}
                  {(account.udf_city || account.udf_state || account.udf_zipcode) && (
                    <div>
                      {[account.udf_city, account.udf_state, account.udf_zipcode]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  )}
                </dd>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-navy-200 mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Network Dashboard - Show first for multi-location accounts */}
            {isMultiLocation && (
              <NetworkDashboard
                locations={locations}
                locationAgreementsMap={locationAgreementsMap}
              />
            )}


            {/* Contact Information - Combined Section - Only for single location accounts */}
            {!isMultiLocation && (account.primary_contact_name || account.primary_contact_email || account.primary_contact_phone || 
              account.udf_phone || account.udf_email || account.udf_fax ||
              (locations.length > 0 && locations[0]?.id)) && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gold-100 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-gold-600" />
                  </div>
                  <h2 className="text-xl font-heading font-semibold text-navy-900">
                    Contact Information
                  </h2>
                  {locations.length > 0 && locations[0]?.id && (
                    <button
                      onClick={() => setShowContactsModal(true)}
                      className="ml-auto p-2 text-gold-600 hover:text-gold-700 hover:bg-gold-50 rounded-lg transition-colors"
                      title="Add Contact"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Primary Contact from Account */}
                {(account.primary_contact_name || account.primary_contact_email || account.primary_contact_phone) && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-navy-700 mb-3 uppercase tracking-wide">
                      Primary Contact
                    </h3>
                    <dl className="space-y-3">
                      {account.primary_contact_name && (
                        <div>
                          <dt className="text-sm text-navy-600">Name</dt>
                          <dd className="text-navy-900 font-medium">
                            {account.primary_contact_name}
                          </dd>
                        </div>
                      )}
                      {account.primary_contact_email && (
                        <div>
                          <dt className="text-sm text-navy-600">Email</dt>
                          <dd className="text-navy-900">
                            <a
                              href={`mailto:${account.primary_contact_email}`}
                              className="text-gold-600 hover:text-gold-700 flex items-center gap-1"
                            >
                              <Mail className="w-4 h-4" />
                              {account.primary_contact_email}
                            </a>
                          </dd>
                        </div>
                      )}
                      {account.primary_contact_phone && (
                        <div>
                          <dt className="text-sm text-navy-600">Phone</dt>
                          <dd className="text-navy-900">
                            <a
                              href={`tel:${account.primary_contact_phone}`}
                              className="text-gold-600 hover:text-gold-700 flex items-center gap-1"
                            >
                              <Phone className="w-4 h-4" />
                              {account.primary_contact_phone}
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {/* Location Contacts */}
                {locations.length > 0 && locations[0]?.id && (
                  <div className="mb-6">
                    <LocationContacts 
                      locationId={locations[0].id} 
                      showModal={showContactsModal}
                      onModalClose={() => setShowContactsModal(false)}
                      hideHeader={true}
                    />
                  </div>
                )}

                {/* Additional Contact Information */}
                {(account.udf_phone || account.udf_email || account.udf_fax) && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-navy-700 mb-3 uppercase tracking-wide">
                      Additional Contact
                    </h3>
                    <dl className="space-y-3">
                      {account.udf_phone && (
                        <div>
                          <dt className="text-sm text-navy-600">Phone</dt>
                          <dd className="text-navy-900">
                            <a
                              href={`tel:${account.udf_phone}`}
                              className="text-gold-600 hover:text-gold-700 flex items-center gap-1"
                            >
                              <Phone className="w-4 h-4" />
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
                              className="text-gold-600 hover:text-gold-700 flex items-center gap-1"
                            >
                              <Mail className="w-4 h-4" />
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

              </div>
            )}

            {/* Locations Summary Section */}
            {locations.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-navy-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-heading font-semibold text-navy-900">
                      Locations
                    </h2>
                    {(() => {
                      const locationsWithAgreements = locations.map((loc) => {
                        const locAgreements = locationAgreementsMap.get(loc.id) || [];
                        const agreementStatus = getLocationAgreementStatus(locAgreements);
                        return { location: loc, agreementStatus };
                      });
                      const activeContractCount = locationsWithAgreements.filter(
                        (item) => item.agreementStatus.status === 'active'
                      ).length;
                      const filteredLocations = locationsWithAgreements.filter((item) => {
                        if (locationFilter === 'all') return true;
                        if (locationFilter === 'needs_contract') return item.agreementStatus.status === 'none';
                        if (locationFilter === 'active') return item.agreementStatus.status === 'active';
                        if (locationFilter === 'expired') return item.agreementStatus.status === 'expired';
                        if (locationFilter === 'draft') return item.agreementStatus.status === 'draft';
                        return true;
                      });
                      return (
                        <p className="text-sm text-navy-600 mt-1">
                          Showing {filteredLocations.length} of {locations.length} location{locations.length !== 1 ? 's' : ''}
                          {activeContractCount > 0 && ` (${activeContractCount} with active contract${activeContractCount !== 1 ? 's' : ''})`}
                        </p>
                      );
                    })()}
                  </div>
                  {isMultiLocation && (
                    <Link
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab('locations');
                      }}
                      className="text-sm text-gold-600 hover:text-gold-700 font-medium"
                    >
                      {locations.length > 1 ? 'View All' : 'Add Locations'} →
                    </Link>
                  )}
                </div>
                
                {/* Filter Buttons */}
                {locations.length > 1 && (
                  <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-navy-200">
                    <button
                      onClick={() => setLocationFilter('all')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        locationFilter === 'all'
                          ? 'bg-gold-600 text-white'
                          : 'bg-navy-100 text-navy-700 hover:bg-navy-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setLocationFilter('needs_contract')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        locationFilter === 'needs_contract'
                          ? 'bg-orange-600 text-white'
                          : 'bg-navy-100 text-navy-700 hover:bg-navy-200'
                      }`}
                    >
                      Needs Contract
                    </button>
                    <button
                      onClick={() => setLocationFilter('active')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        locationFilter === 'active'
                          ? 'bg-green-600 text-white'
                          : 'bg-navy-100 text-navy-700 hover:bg-navy-200'
                      }`}
                    >
                      Active Contracts
                    </button>
                    <button
                      onClick={() => setLocationFilter('expired')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        locationFilter === 'expired'
                          ? 'bg-orange-600 text-white'
                          : 'bg-navy-100 text-navy-700 hover:bg-navy-200'
                      }`}
                    >
                      Expired
                    </button>
                    <button
                      onClick={() => setLocationFilter('draft')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        locationFilter === 'draft'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-navy-100 text-navy-700 hover:bg-navy-200'
                      }`}
                    >
                      Draft
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  {locations
                    .map((location) => {
                      const locAgreements = locationAgreementsMap.get(location.id) || [];
                      const agreementStatus = getLocationAgreementStatus(locAgreements);
                      return { location, agreementStatus };
                    })
                    .filter((item) => {
                      if (locationFilter === 'all') return true;
                      if (locationFilter === 'needs_contract') return item.agreementStatus.status === 'none';
                      if (locationFilter === 'active') return item.agreementStatus.status === 'active';
                      if (locationFilter === 'expired') return item.agreementStatus.status === 'expired';
                      if (locationFilter === 'draft') return item.agreementStatus.status === 'draft';
                      return true;
                    })
                    .map(({ location, agreementStatus }) => (
                      <div
                        key={location.id}
                        className="border border-navy-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Link
                                href={`/admin/locations/${location.id}`}
                                className="text-lg font-heading font-semibold text-navy-900 hover:text-gold-600"
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
                              {(location.city || location.state) && (
                                <p>
                                  {[location.city, location.state].filter(Boolean).join(", ")}
                                </p>
                              )}
                              {location.phone && (
                                <p>
                                  <a
                                    href={`tel:${location.phone}`}
                                    className="text-gold-600 hover:text-gold-700"
                                  >
                                    {location.phone}
                                  </a>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}


            {/* Notes - Combined at the bottom */}
            {(account.notes || account.udf_notes) && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center">
                    <StickyNote className="w-6 h-6 text-navy-600" />
                  </div>
                  <h2 className="text-xl font-heading font-semibold text-navy-900">
                    Notes
                  </h2>
                </div>
                <div className="space-y-4">
                  {account.notes && (
                    <div>
                      <h3 className="text-sm font-semibold text-navy-700 mb-2">Account Notes</h3>
                      <p className="text-navy-700 whitespace-pre-wrap">{account.notes}</p>
                    </div>
                  )}
                  {account.udf_notes && (
                    <div>
                      {account.notes && <div className="border-t border-navy-200 pt-4 mt-4" />}
                      <h3 className="text-sm font-semibold text-navy-700 mb-2">Additional Notes</h3>
                      <p className="text-navy-700 whitespace-pre-wrap">{account.udf_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "locations" && (
          <LocationsList
            accountId={account.id}
            locations={locations}
            locationAgreementsMap={locationAgreementsMap}
          />
        )}

        {/* Agreements tab - only for single-location accounts */}
        {activeTab === "agreements" && (!isMultiLocation || locations.length <= 1) && (
          locations.length > 0 && locations[0]?.id ? (
            <AgreementsList
              accountId={account.id}
              locationId={locations[0].id}
              agreements={locationAgreementsMap.get(locations[0].id) || []}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-navy-300 mx-auto mb-4" />
                <p className="text-navy-600 mb-4">No location found. Please add a location to upload agreements.</p>
              </div>
            </div>
          )
        )}

        {/* Activities tab - only for single-location accounts */}
        {activeTab === "activities" && (!isMultiLocation || locations.length <= 1) && (
          <ActivitiesTimeline
            accountId={account.id}
            activities={activities}
          />
        )}

        {/* Notes tab - only for single-location accounts */}
        {activeTab === "notes" && (!isMultiLocation || locations.length <= 1) && (
          <NotesSection
            accountId={account.id}
            notes={notes}
            currentUserId={currentUserId}
          />
        )}
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message={`Are you sure you want to delete this account? This will permanently delete:
        
• All ${locations.length} location${locations.length !== 1 ? 's' : ''} associated with this account
• All agreements, activities, and notes
• All related data

This action cannot be undone.`}
        itemName={account.name}
        isLoading={isDeleting}
      />
    </div>
  );
}

