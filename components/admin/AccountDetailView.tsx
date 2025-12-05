"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type {
  CorporateAccount,
  Location,
  Agreement,
  Activity,
  Note,
} from "@/lib/supabase/types";
import type { AgreementStatusInfo, LocationAgreementHealth } from "@/lib/supabase/agreements";
import { ArrowLeft, Building2, MapPin, FileText, Clock, StickyNote, CheckCircle2, AlertCircle } from "lucide-react";
import LocationsList from "./LocationsList";
import AgreementsList from "./AgreementsList";
import ActivitiesTimeline from "./ActivitiesTimeline";
import NotesSection from "./NotesSection";

interface AccountDetailViewProps {
  account: CorporateAccount;
  locations: Location[];
  agreements: Agreement[];
  activities: Activity[];
  notes: Note[];
  currentUserId: string;
  locationAgreementStatuses: Record<string, AgreementStatusInfo>;
}

export default function AccountDetailView({
  account,
  locations,
  agreements,
  activities,
  notes,
  currentUserId,
  locationAgreementStatuses,
}: AccountDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "locations" | "agreements" | "activities" | "notes">(
    "overview"
  );
  const [filteredLocationId, setFilteredLocationId] = useState<string | null>(null);

  // Map each location to its most recent agreement (if any), preferring ones with a document_url
  const locationAgreements = useMemo(() => {
    const map: Record<string, Agreement | null> = {};

    locations.forEach((location) => {
      const matchWithDocument = agreements.find(
        (agreement) => agreement.location_id === location.id && !!agreement.document_url
      );

      const anyMatch = matchWithDocument
        ? matchWithDocument
        : agreements.find((agreement) => agreement.location_id === location.id) || null;

      map[location.id] = anyMatch;
    });

    return map;
  }, [locations, agreements]);

  const tabs = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "locations", label: "Locations", icon: MapPin },
    { id: "agreements", label: "Agreements", icon: FileText },
    { id: "activities", label: "Activities", icon: Clock },
    { id: "notes", label: "Notes", icon: StickyNote },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Link
        href="/admin/accounts"
        className="inline-flex items-center gap-2 text-navy-600 hover:text-navy-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Accounts
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl font-heading font-bold text-navy-900">
            {account.name}
          </h1>
          {account.code && (
            <span className="font-mono text-lg font-semibold text-gold-600 bg-gold-50 px-3 py-1 rounded-lg">
              {account.code}
            </span>
          )}
        </div>
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
          {"deal_stage" in account && (account as CorporateAccount & { deal_stage: string }).deal_stage && (
            <span className="text-sm text-navy-600 capitalize">
              {(account as CorporateAccount & { deal_stage: string }).deal_stage.replace("_", " ")}
            </span>
          )}
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
                onClick={() =>
                  setActiveTab(tab.id as "overview" | "locations" | "agreements" | "activities" | "notes")
                }
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
                  {account.code && (
                    <div>
                      <dt className="text-sm text-navy-600">Account Code</dt>
                      <dd className="text-navy-900">
                        <span className="font-mono text-sm font-semibold text-gold-600">
                          {account.code}
                        </span>
                      </dd>
                    </div>
                  )}
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

            {/* Location Health Summary */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-heading font-semibold text-navy-900">
                  Location Agreement Health
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setFilteredLocationId(null);
                    setActiveTab("agreements");
                  }}
                  className="text-sm font-medium text-gold-600 hover:text-gold-700"
                >
                  View all agreements
                </button>
              </div>
              {locations.length === 0 ? (
                <p className="text-navy-600">No locations added yet</p>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    // Calculate health summary from location statuses
                    const health: LocationAgreementHealth = {
                      total: locations.length,
                      green: 0,
                      yellow: 0,
                      red: 0,
                      none: 0,
                      worstStatus: 'none',
                    };

                    locations.forEach((location) => {
                      const status = locationAgreementStatuses[location.id];
                      if (status) {
                        health[status.status]++;
                      } else {
                        health.none++;
                      }
                    });

                    // Determine worst status
                    if (health.red > 0) {
                      health.worstStatus = 'red';
                    } else if (health.yellow > 0) {
                      health.worstStatus = 'yellow';
                    } else if (health.green > 0) {
                      health.worstStatus = 'green';
                    }

                    const allGood = health.green === health.total && health.total > 0;
                    const hasIssues = health.red > 0 || health.yellow > 0;

                    return (
                      <>
                        {/* Overall Status */}
                        <div className="flex items-center gap-3 p-4 bg-cream-50 rounded-lg border border-navy-200">
                          {allGood ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                          ) : hasIssues ? (
                            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-navy-900">
                                {health.total} Location{health.total !== 1 ? 's' : ''}
                              </span>
                              <span className={`text-sm font-medium ${
                                allGood ? 'text-green-700' : hasIssues ? 'text-yellow-700' : 'text-red-700'
                              }`}>
                                {allGood 
                                  ? 'All agreements current' 
                                  : hasIssues 
                                  ? 'Some agreements need attention'
                                  : 'No active agreements'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {health.green > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                                  <div className="w-2 h-2 rounded-full bg-green-600" />
                                  {health.green} Current
                                </span>
                              )}
                              {health.yellow > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">
                                  <div className="w-2 h-2 rounded-full bg-yellow-600" />
                                  {health.yellow} Renewal Due
                                </span>
                              )}
                              {health.red > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                                  <div className="w-2 h-2 rounded-full bg-red-600" />
                                  {health.red} Expired
                                </span>
                              )}
                              {health.none > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                                  {health.none} No Agreement
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-2xl font-bold text-green-700 mb-1">
                              {health.green}
                            </div>
                            <div className="text-xs text-green-600 font-medium">Current</div>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="text-2xl font-bold text-yellow-700 mb-1">
                              {health.yellow}
                            </div>
                            <div className="text-xs text-yellow-600 font-medium">Renewal Due</div>
                          </div>
                          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-2xl font-bold text-red-700 mb-1">
                              {health.red}
                            </div>
                            <div className="text-xs text-red-600 font-medium">Expired</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="text-2xl font-bold text-gray-700 mb-1">
                              {health.none}
                            </div>
                            <div className="text-xs text-gray-600 font-medium">No Agreement</div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {account.notes && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-heading font-semibold text-navy-900 mb-4">
                  Notes
                </h2>
                <p className="text-navy-700 whitespace-pre-wrap">{account.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "locations" && (
          <LocationsList
            locations={locations}
            locationAgreementStatuses={locationAgreementStatuses}
            locationAgreements={locationAgreements}
            onViewAgreementsTab={(locationId) => {
              setFilteredLocationId(locationId);
              setActiveTab("agreements");
            }}
          />
        )}

        {activeTab === "agreements" && (
          <AgreementsList
            accountId={account.id}
            agreements={agreements}
            locationFilterId={filteredLocationId}
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

