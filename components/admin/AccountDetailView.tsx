"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  CorporateAccount,
  Location,
  Agreement,
  Activity,
  Note,
} from "@/lib/supabase/types";
import { ArrowLeft, Building2, MapPin, FileText, Clock, StickyNote } from "lucide-react";
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

  const tabs = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "locations", label: "Locations", icon: MapPin },
    { id: "agreements", label: "Agreements", icon: FileText },
    { id: "activities", label: "Activities", icon: Clock },
    { id: "notes", label: "Notes", icon: StickyNote },
  ];

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

