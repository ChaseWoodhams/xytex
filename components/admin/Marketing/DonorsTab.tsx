"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { MarketingDonor } from "@/lib/supabase/types";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  X,
} from "lucide-react";
import DonorForm from "./DonorForm";
import DonorDetailView from "./DonorDetailView";
import { showToast } from "@/components/shared/toast";

export default function DonorsTab() {
  const router = useRouter();
  const [donors, setDonors] = useState<MarketingDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [raceFilter, setRaceFilter] = useState<string>("");
  const [cmvFilter, setCmvFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [editingDonor, setEditingDonor] = useState<MarketingDonor | null>(null);
  const [viewingDonor, setViewingDonor] = useState<MarketingDonor | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDonors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }
      if (raceFilter) {
        params.append("race", raceFilter);
      }
      if (cmvFilter) {
        params.append("cmvStatus", cmvFilter);
      }

      const response = await fetch(`/api/admin/marketing-donors?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch donors" }));
        throw new Error(errorData.error || `Failed to fetch donors: ${response.status}`);
      }

      const data = await response.json();
      setDonors(data.data || []);
      setTotal(data.count || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error("Error fetching donors:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch donors");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, raceFilter, cmvFilter]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/marketing-donors/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete donor");
      }

      await fetchDonors();
      showToast("Donor deleted.", "success");
    } catch (error: any) {
      console.error("Error deleting donor:", error);
      showToast(error.message || "Failed to delete donor", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (donor: MarketingDonor) => {
    setEditingDonor(donor);
    setShowForm(true);
  };

  const handleView = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/marketing-donors/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch donor");
      }
      const donor = await response.json();
      setViewingDonor(donor);
    } catch (error) {
      console.error("Error fetching donor:", error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDonor(null);
    fetchDonors();
  };

  const handleViewClose = () => {
    setViewingDonor(null);
  };

  // Get unique races and CMV statuses for filters
  const uniqueRaces = Array.from(new Set(donors.map((d) => d.race).filter((r): r is string => Boolean(r))));
  const uniqueCmvStatuses = Array.from(
    new Set(donors.map((d) => d.cmv_status).filter((s): s is string => Boolean(s)))
  );

  if (viewingDonor) {
    return (
      <DonorDetailView donor={viewingDonor} onClose={handleViewClose} onEdit={handleEdit} />
    );
  }

  if (showForm) {
    return (
      <DonorForm
        donor={editingDonor || undefined}
        onClose={handleFormClose}
        onSave={handleFormClose}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-navy-900 mb-1">
            Marketing Donors
          </h2>
          <p className="text-navy-600">
            Manage comprehensive donor information for marketing use
          </p>
        </div>
        <button
          onClick={() => {
            setEditingDonor(null);
            setShowForm(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          New Donor
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <X className="w-5 h-5" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-navy-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, ID, occupation..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>
          <select
            value={raceFilter}
            onChange={(e) => {
              setRaceFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          >
            <option value="">All Races</option>
            {uniqueRaces.map((race) => (
              <option key={race} value={race}>
                {race}
              </option>
            ))}
          </select>
          <select
            value={cmvFilter}
            onChange={(e) => {
              setCmvFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          >
            <option value="">All CMV Status</option>
            {uniqueCmvStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-navy-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold-600" />
          </div>
        ) : donors.length === 0 ? (
          <div className="text-center py-12 text-navy-600">
            No donors found. Create your first donor to get started.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-navy-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                      Year of Birth
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                      Race
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                      CMV Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                      Occupation
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-navy-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-navy-200">
                  {donors.map((donor) => (
                    <tr key={donor.id} className="hover:bg-navy-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-900">
                        {donor.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-navy-900">
                        {donor.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-navy-600">
                        {donor.year_of_birth || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-navy-600">
                        {donor.race || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-navy-600">
                        {donor.cmv_status || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-navy-600">
                        {donor.occupation || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(donor.id)}
                            className="text-gold-600 hover:text-gold-700 p-1"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(donor)}
                            className="text-navy-600 hover:text-navy-900 p-1"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(donor.id)}
                            disabled={deletingId === donor.id}
                            className="text-red-600 hover:text-red-700 p-1 disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === donor.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-navy-50 px-6 py-3 flex items-center justify-between border-t border-navy-200">
                <div className="text-sm text-navy-600">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, total)} of {total} donors
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm border border-navy-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm border border-navy-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
