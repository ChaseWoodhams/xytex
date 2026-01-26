"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Users, Download } from "lucide-react";
import CarePackageDashboard from "./CarePackageDashboard";
import DonorsTab from "./DonorsTab";
import ScrapingTab from "./ScrapingTab";

type TabId = "donors" | "care-packages" | "scraping";

export default function MarketingToolsClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("donors");

  useEffect(() => {
    // Read tab from URL search params using window.location (client-side only)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") as TabId;
      if (tab && (tab === "donors" || tab === "care-packages" || tab === "scraping")) {
        setActiveTab(tab);
      }
    }
  }, []); // Empty deps - only run once on mount

  // Listen for URL changes (e.g., browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab") as TabId;
        if (tab && (tab === "donors" || tab === "care-packages" || tab === "scraping")) {
          setActiveTab(tab);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const tabs: Array<{ id: TabId; label: string; icon: typeof Users }> = [
    { id: "donors", label: "Donors", icon: Users },
    { id: "scraping", label: "Scraping", icon: Download },
    { id: "care-packages", label: "Care Packages", icon: Package },
  ];

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    router.push(`/admin/marketing-tools?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-navy-900 mb-2">
            Marketing Tools
          </h1>
          <p className="text-navy-600">
            Manage donor information and care packages
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
          {activeTab === "donors" && <DonorsTab />}
          {activeTab === "scraping" && <ScrapingTab />}
          {activeTab === "care-packages" && <CarePackageDashboard />}
        </div>
      </div>
    </div>
  );
}
