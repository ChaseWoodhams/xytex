"use client";

import { useState, useEffect } from "react";
import { Play, Settings, List, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import ScrapingCredentialsForm from "./ScrapingCredentialsForm";
import ScrapingJobsList from "./ScrapingJobsList";
import ScrapingResultsTable from "./ScrapingResultsTable";
import DonorIdListManager from "./DonorIdListManager";

export default function ScrapingTab() {
  const [activeView, setActiveView] = useState<"dashboard" | "credentials" | "jobs" | "results" | "donor-ids">("dashboard");
  const [credentialsExist, setCredentialsExist] = useState<boolean | null>(null);
  const [stats, setStats] = useState({
    totalDonors: 0,
    activeDonors: 0,
    lastScrape: null as string | null,
    successRate: 0,
  });

  useEffect(() => {
    checkCredentials();
    loadStats();
  }, []);

  const checkCredentials = async () => {
    try {
      const response = await fetch("/api/admin/scraping/credentials");
      if (response.ok) {
        const data = await response.json();
        setCredentialsExist(data.exists);
      }
    } catch (error) {
      console.error("Error checking credentials:", error);
    }
  };

  const loadStats = async () => {
    try {
      // Get donor ID list stats
      const donorsResponse = await fetch("/api/admin/scraping/donor-ids");
      if (donorsResponse.ok) {
        const donors = await donorsResponse.json();
        setStats((prev) => ({
          ...prev,
          totalDonors: donors.length,
          activeDonors: donors.filter((d: any) => d.is_active).length,
        }));
      }

      // Get latest scrape info
      const resultsResponse = await fetch("/api/admin/scraping/results?pageSize=1");
      if (resultsResponse.ok) {
        const results = await resultsResponse.json();
        if (results.data && results.data.length > 0) {
          setStats((prev) => ({
            ...prev,
            lastScrape: results.data[0].scraped_at,
          }));
        }
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleStartScraping = async (fullScrape: boolean = true) => {
    if (!confirm(`Start ${fullScrape ? 'full' : 'incremental'} scraping job?`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/scraping/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullScrape }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start scraping");
      }

      const data = await response.json();
      alert(`Scraping job started! Job ID: ${data.job_id}`);
      setActiveView("jobs");
      // Refresh jobs list if it's mounted
    } catch (error: any) {
      alert(`Failed to start scraping: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-navy-900 mb-1">
            Donor Scraping
          </h2>
          <p className="text-navy-600">
            Automatically scrape and update donor information from Xytex.com
          </p>
        </div>
        <div className="flex items-center gap-3">
          {credentialsExist && (
            <button
              onClick={() => handleStartScraping(true)}
              className="btn btn-primary"
            >
              <Play className="w-5 h-5" />
              Start Full Scrape
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-navy-200">
        <nav className="flex gap-4">
          {[
            { id: "dashboard", label: "Dashboard", icon: Clock },
            { id: "credentials", label: "Credentials", icon: Settings },
            { id: "donor-ids", label: "Donor IDs", icon: List },
            { id: "jobs", label: "Jobs", icon: Clock },
            { id: "results", label: "Results", icon: CheckCircle2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeView === tab.id
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

      {/* Content */}
      <div>
        {activeView === "dashboard" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-navy-200 p-6">
                <div className="text-sm text-navy-600 mb-1">Total Donor IDs</div>
                <div className="text-3xl font-bold text-navy-900">{stats.totalDonors}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-navy-200 p-6">
                <div className="text-sm text-navy-600 mb-1">Active Donors</div>
                <div className="text-3xl font-bold text-navy-900">{stats.activeDonors}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-navy-200 p-6">
                <div className="text-sm text-navy-600 mb-1">Last Scrape</div>
                <div className="text-lg font-semibold text-navy-900">
                  {stats.lastScrape
                    ? new Date(stats.lastScrape).toLocaleDateString()
                    : "Never"}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-navy-200 p-6">
                <div className="text-sm text-navy-600 mb-1">Credentials</div>
                <div className="flex items-center gap-2">
                  {credentialsExist ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-green-600 font-semibold">Configured</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-600 font-semibold">Not Set</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-navy-200 p-6">
              <h3 className="text-lg font-semibold text-navy-900 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveView("credentials")}
                  className="btn btn-secondary"
                >
                  <Settings className="w-5 h-5" />
                  Configure Credentials
                </button>
                <button
                  onClick={() => setActiveView("donor-ids")}
                  className="btn btn-secondary"
                >
                  <List className="w-5 h-5" />
                  Manage Donor IDs
                </button>
                {credentialsExist && (
                  <button
                    onClick={() => handleStartScraping(true)}
                    className="btn btn-primary"
                  >
                    <Play className="w-5 h-5" />
                    Start Full Scrape
                  </button>
                )}
              </div>
            </div>

            {/* Status Alert */}
            {!credentialsExist && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-yellow-900 mb-1">
                    Credentials Not Configured
                  </div>
                  <div className="text-sm text-yellow-700">
                    Please configure your Xytex login credentials before starting a scraping job.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === "credentials" && (
          <ScrapingCredentialsForm onSaved={checkCredentials} />
        )}

        {activeView === "donor-ids" && (
          <DonorIdListManager />
        )}

        {activeView === "jobs" && (
          <ScrapingJobsList />
        )}

        {activeView === "results" && (
          <ScrapingResultsTable />
        )}
      </div>
    </div>
  );
}
