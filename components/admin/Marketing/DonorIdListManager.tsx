"use client";

import { useState, useEffect } from "react";
import type { DonorIdListItem } from "@/lib/supabase/types";
import {
  Plus,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { showToast } from "@/components/shared/toast";

export default function DonorIdListManager() {
  const [donors, setDonors] = useState<DonorIdListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [newDonorId, setNewDonorId] = useState("");

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/scraping/donor-ids");
      if (!response.ok) {
        throw new Error("Failed to fetch donor IDs");
      }
      const data = await response.json();
      setDonors(data);
    } catch (error) {
      console.error("Error fetching donor IDs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSingle = async () => {
    if (!newDonorId.trim()) {
      showToast("Please enter a donor ID", "error");
      return;
    }

    try {
      const response = await fetch("/api/admin/scraping/donor-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorIds: [newDonorId.trim()] }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add donor ID");
      }

      setNewDonorId("");
      setShowAddForm(false);
      await fetchDonors();
    } catch (error: any) {
      showToast(`Failed to add donor ID: ${error.message}`, "error");
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) {
      showToast("Please enter donor IDs", "error");
      return;
    }

    // Parse donor IDs (one per line or comma-separated)
    const ids = bulkImportText
      .split(/[,\n]/)
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (ids.length === 0) {
      showToast("No valid donor IDs found", "error");
      return;
    }

    try {
      const response = await fetch("/api/admin/scraping/donor-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorIds: ids }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import donor IDs");
      }

      const data = await response.json();
      setBulkImportText("");
      setShowBulkImport(false);
      showToast(`Added ${data.added} donor IDs. ${data.skipped} were duplicates.`, "success");
      await fetchDonors();
    } catch (error: any) {
      showToast(`Failed to import donor IDs: ${error.message}`, "error");
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch("/api/admin/scraping/donor-ids", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to update donor ID");
      }

      await fetchDonors();
    } catch (error: any) {
      showToast(`Failed to update: ${error.message}`, "error");
    }
  };

  const handleDelete = async (id: string, donorId: string) => {
    try {
      const response = await fetch(`/api/admin/scraping/donor-ids?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete donor ID");
      }

      await fetchDonors();
    } catch (error: any) {
      alert(`Failed to delete: ${error.message}`);
    }
  };

  const activeCount = donors.filter((d) => d.is_active).length;
  const inactiveCount = donors.length - activeCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-heading font-semibold text-navy-900 mb-1">
            Donor ID List
          </h3>
          <p className="text-navy-600">
            Manage the list of donor IDs to scrape ({activeCount} active, {inactiveCount} inactive)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="btn btn-secondary"
          >
            <Upload className="w-5 h-5" />
            Bulk Import
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Add Donor ID
          </button>
        </div>
      </div>

      {/* Add Single Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border border-navy-200 p-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Enter donor ID (e.g., 96034)"
              value={newDonorId}
              onChange={(e) => setNewDonorId(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddSingle();
                }
              }}
              className="flex-1 px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
            />
            <button onClick={handleAddSingle} className="btn btn-primary">
              Add
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewDonorId("");
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bulk Import Form */}
      {showBulkImport && (
        <div className="bg-white rounded-lg shadow-sm border border-navy-200 p-6">
          <h4 className="text-lg font-semibold text-navy-900 mb-3">
            Bulk Import Donor IDs
          </h4>
          <p className="text-sm text-navy-600 mb-4">
            Enter donor IDs, one per line or comma-separated
          </p>
          <textarea
            value={bulkImportText}
            onChange={(e) => setBulkImportText(e.target.value)}
            rows={10}
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 font-mono text-sm"
            placeholder="96034&#10;96035&#10;96036"
          />
          <div className="flex items-center gap-3 mt-4">
            <button onClick={handleBulkImport} className="btn btn-primary">
              Import
            </button>
            <button
              onClick={() => {
                setShowBulkImport(false);
                setBulkImportText("");
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Donor IDs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-navy-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold-600" />
          </div>
        ) : donors.length === 0 ? (
          <div className="text-center py-12 text-navy-600">
            No donor IDs added yet. Add your first donor ID to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                    Donor ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                    Last Scraped
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                    Last Successful
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                    Failures
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-navy-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-200">
                {donors.map((donor) => (
                  <tr key={donor.id} className="hover:bg-navy-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-900">
                      {donor.donor_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {donor.is_active ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-navy-600">
                      {donor.last_scraped_at
                        ? new Date(donor.last_scraped_at).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-navy-600">
                      {donor.last_successful_scrape_at
                        ? new Date(donor.last_successful_scrape_at).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-navy-600">
                      {donor.consecutive_failures || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            handleToggleActive(donor.id, donor.is_active || false)
                          }
                          className={`p-1 ${
                            donor.is_active
                              ? "text-yellow-600 hover:text-yellow-700"
                              : "text-green-600 hover:text-green-700"
                          }`}
                          title={donor.is_active ? "Deactivate" : "Activate"}
                        >
                          {donor.is_active ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(donor.id, donor.donor_id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
