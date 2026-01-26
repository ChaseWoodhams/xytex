"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, UserPlus, Wrench, Package, Search } from "lucide-react";
import AccountsTab from "./AccountsTab";
import InvitationsTab from "./InvitationsTab";
import DataToolsTab from "./DataToolsTab";
import CarePackagesTab from "./CarePackagesTab";
import LocationScrapingTab from "./LocationScrapingTab";

type TabId = "accounts" | "invitations" | "data-tools" | "care-packages" | "location-scraping";

export default function ClinicToolsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>("accounts");

  useEffect(() => {
    const tab = searchParams.get("tab") as TabId;
    if (tab && (tab === "accounts" || tab === "invitations" || tab === "data-tools" || tab === "care-packages" || tab === "location-scraping")) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const tabs: Array<{ id: TabId; label: string; icon: typeof Building2 }> = [
    { id: "accounts", label: "Accounts", icon: Building2 },
    { id: "invitations", label: "Invitations", icon: UserPlus },
    { id: "data-tools", label: "Data Tools", icon: Wrench },
    { id: "care-packages", label: "Care Packages", icon: Package },
    { id: "location-scraping", label: "Location Scraping", icon: Search },
  ];

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    router.push(`/admin/clinic-tools?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-navy-900 mb-2">
            Clinic Tools
          </h1>
          <p className="text-navy-600">
            Manage accounts, invitations, and data tools
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-navy-200 mb-6">
          <nav className="flex gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
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
          {activeTab === "accounts" && <AccountsTab />}
          {activeTab === "invitations" && <InvitationsTab />}
          {activeTab === "data-tools" && <DataToolsTab />}
          {activeTab === "care-packages" && <CarePackagesTab />}
          {activeTab === "location-scraping" && <LocationScrapingTab />}
        </div>
      </div>
    </div>
  );
}
