"use client";

import { useState, useEffect } from "react";
import type { ScrapingResult } from "@/lib/supabase/types";
import {
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from "lucide-react";

export default function ScrapingResultsTable() {
  const [results, setResults] = useState<ScrapingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [donorIdFilter, setDonorIdFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }
      if (statusFilter) {
        params.append("status", statusFilter);
      }
      if (donorIdFilter) {
        params.append("donor_id", donorIdFilter);
      }

      const response = await fetch(`/api/admin/scraping/results?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }

      const data = await response.json();
      setResults(data.data || []);
      setTotal(data.count || 0);
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [page, searchQuery, statusFilter, donorIdFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-navy-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-heading font-semibold text-navy-900 mb-1">
            Scraping Results
          </h3>
          <p className="text-navy-600">
            View and search scraping results with banner messages and changes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-navy-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search donor ID or banner message..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <input
            type="text"
            placeholder="Filter by Donor ID"
            value={donorIdFilter}
            onChange={(e) => {
              setDonorIdFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-navy-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold-600" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-navy-600">
            No scraping results found
          </div>
        ) : (
          <>
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
                      Banner Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                      Changes Detected
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                      Scraped At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-200">
                  {results.map((result) => {
                    const changesCount = result.changes_detected
                      ? Object.keys(result.changes_detected).length
                      : 0;

                    return (
                      <tr key={result.id} className="hover:bg-navy-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-900">
                          {result.donor_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusIcon(result.scrape_status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-navy-600">
                          {result.banner_message || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-navy-600">
                          {changesCount > 0 ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                              {changesCount} change{changesCount !== 1 ? "s" : ""}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-navy-600">
                          {new Date(result.scraped_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
                          {result.error_message || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {Math.ceil(total / pageSize) > 1 && (
              <div className="bg-navy-50 px-6 py-3 flex items-center justify-between border-t border-navy-200">
                <div className="text-sm text-navy-600">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, total)} of {total} results
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
                    onClick={() =>
                      setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))
                    }
                    disabled={page >= Math.ceil(total / pageSize)}
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
