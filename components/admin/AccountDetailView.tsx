"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type {
  Account,
  Location,
  Agreement,
  Activity,
  Note,
} from "@/lib/supabase/types";
import { ArrowLeft, Building2, MapPin, FileText, Clock, StickyNote, Plus } from "lucide-react";
import LocationsList from "./LocationsList";
import AgreementsList from "./AgreementsList";
import ActivitiesTimeline from "./ActivitiesTimeline";
import NotesSection from "./NotesSection";
import LocationForm from "./LocationForm";

interface AccountDetailViewProps {
  account: Account;
  locations: Location[];
  agreements: Agreement[];
  activities: Activity[];
  notes: Note[];
  currentUserId: string;
}

export default function AccountDetailView({
  account,
  locations,
  agreements,
  activities,
  notes,
  currentUserId,
}: AccountDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "locations" | "agreements" | "activities" | "notes">("overview");
  const [showLocationForm, setShowLocationForm] = useState(false);

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

  // If activeTab is "locations" but it's not a multi-location account, switch to overview
  // If activeTab is "agreements" but it's a multi-location account, switch to overview
  useEffect(() => {
    if (activeTab === "locations" && !isMultiLocation) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => setActiveTab("overview"), 0);
    }
    if (activeTab === "agreements" && isMultiLocation && locations.length > 1) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => setActiveTab("overview"), 0);
    }
  }, [activeTab, isMultiLocation, locations.length]);

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
        <h1 className="text-4xl font-heading font-bold text-navy-900 mb-2">
          {account.name}
        </h1>
        <div className="flex items-center gap-4">
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              account.status === "active"
                ? "bg-green-100 text-green-800"
                : account.status === "inactive"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {account.status}
          </span>
          <span className="text-sm text-navy-600 capitalize">
            {account.deal_stage.replace("_", " ")}
          </span>
        </div>
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
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
                  Account Information
                </h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-navy-600">Website</dt>
                    <dd className="text-navy-900">
                      {account.website ? (
                        <a
                          href={account.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gold-600 hover:text-gold-700"
                        >
                          {account.website}
                        </a>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-navy-600">Industry</dt>
                    <dd className="text-navy-900">{account.industry || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-navy-600">Annual Revenue</dt>
                    <dd className="text-navy-900">
                      {account.annual_revenue
                        ? `$${account.annual_revenue.toLocaleString()}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-navy-600">Employee Count</dt>
                    <dd className="text-navy-900">
                      {account.employee_count?.toLocaleString() || "—"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
                  Primary Contact
                </h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-navy-600">Name</dt>
                    <dd className="text-navy-900">
                      {account.primary_contact_name || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-navy-600">Email</dt>
                    <dd className="text-navy-900">
                      {account.primary_contact_email ? (
                        <a
                          href={`mailto:${account.primary_contact_email}`}
                          className="text-gold-600 hover:text-gold-700"
                        >
                          {account.primary_contact_email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-navy-600">Phone</dt>
                    <dd className="text-navy-900">
                      {account.primary_contact_phone ? (
                        <a
                          href={`tel:${account.primary_contact_phone}`}
                          className="text-gold-600 hover:text-gold-700"
                        >
                          {account.primary_contact_phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {account.notes && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
                  Notes
                </h2>
                <p className="text-navy-700 whitespace-pre-wrap">{account.notes}</p>
              </div>
            )}

            {(account.udf_clinic_code || account.udf_clinic_name || account.udf_shipto_name || account.udf_country_code) && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
                  Additional Information
                </h2>
                <dl className="space-y-3 grid md:grid-cols-2 gap-4">
                  {account.udf_clinic_code && (
                    <div>
                      <dt className="text-sm text-navy-600">Clinic Code</dt>
                      <dd className="text-navy-900">{account.udf_clinic_code}</dd>
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

            {(account.udf_address_line1 || account.udf_address_line2 || account.udf_address_line3 || account.udf_city || account.udf_state || account.udf_zipcode) && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
                  Address Information
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

            {(account.udf_phone || account.udf_email || account.udf_fax) && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
                  Contact Information
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

            {account.udf_notes && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
                  Additional Notes
                </h2>
                <p className="text-navy-700 whitespace-pre-wrap">{account.udf_notes}</p>
              </div>
            )}

            {/* Location section for single location accounts */}
            {!isMultiLocation && locations.length === 1 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-heading font-semibold text-navy-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gold-600" />
                    Location
                  </h2>
                  <button
                    onClick={() => setShowLocationForm(!showLocationForm)}
                    className="text-sm text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </button>
                </div>
                {!showLocationForm ? (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-navy-900 mb-2">
                        {locations[0].name}
                      </h3>
                      {locations[0].is_primary && (
                        <span className="px-2 py-1 text-xs font-semibold bg-gold-100 text-gold-800 rounded-full mr-2">
                          Primary
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          locations[0].status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {locations[0].status}
                      </span>
                    </div>
                    <dl className="space-y-2 text-sm">
                      {(locations[0].address_line1 || locations[0].address_line2) && (
                        <div>
                          <dt className="text-navy-600">Address</dt>
                          <dd className="text-navy-900">
                            {locations[0].address_line1}
                            {locations[0].address_line2 && `, ${locations[0].address_line2}`}
                          </dd>
                        </div>
                      )}
                      {(locations[0].city || locations[0].state || locations[0].zip_code) && (
                        <div>
                          <dt className="text-navy-600">City, State, ZIP</dt>
                          <dd className="text-navy-900">
                            {[locations[0].city, locations[0].state, locations[0].zip_code]
                              .filter(Boolean)
                              .join(", ")}
                          </dd>
                        </div>
                      )}
                      {locations[0].phone && (
                        <div>
                          <dt className="text-navy-600">Phone</dt>
                          <dd className="text-navy-900">
                            <a
                              href={`tel:${locations[0].phone}`}
                              className="text-gold-600 hover:text-gold-700"
                            >
                              {locations[0].phone}
                            </a>
                          </dd>
                        </div>
                      )}
                      {locations[0].email && (
                        <div>
                          <dt className="text-navy-600">Email</dt>
                          <dd className="text-navy-900">
                            <a
                              href={`mailto:${locations[0].email}`}
                              className="text-gold-600 hover:text-gold-700"
                            >
                              {locations[0].email}
                            </a>
                          </dd>
                        </div>
                      )}
                      <div className="pt-2">
                        <Link
                          href={`/admin/locations/${locations[0].id}`}
                          className="text-gold-600 hover:text-gold-700 font-medium text-sm"
                        >
                          View Location Details →
                        </Link>
                      </div>
                    </dl>
                  </div>
                ) : (
                  <div className="mt-4">
                    <LocationForm
                      accountId={account.id}
                      onSuccess={() => {
                        setShowLocationForm(false);
                        window.location.reload();
                      }}
                      onCancel={() => setShowLocationForm(false)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "locations" && (
          <LocationsList
            accountId={account.id}
            locations={locations}
          />
        )}

        {activeTab === "agreements" && (
          <AgreementsList
            accountId={account.id}
            agreements={agreements}
          />
        )}

        {activeTab === "activities" && (
          <ActivitiesTimeline
            accountId={account.id}
            activities={activities}
          />
        )}

        {activeTab === "notes" && (
          <NotesSection
            accountId={account.id}
            notes={notes}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  );
}

