"use client";

import { useState, useEffect } from "react";
import type { ScrapingJob } from "@/lib/supabase/types";
import {
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import ScrapingJobDetail from "./ScrapingJobDetail";

export default function ScrapingJobsList() {
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedJob, setSelectedJob] = useState<ScrapingJob | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/scraping/jobs?page=${page}&pageSize=${pageSize}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();
      setJobs(data.data || []);
      setTotal(data.count || 0);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Poll for updates if there are running jobs
    const interval = setInterval(() => {
      const hasRunning = jobs.some((j) => j.status === "running");
      if (hasRunning) {
        fetchJobs();
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [page]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-navy-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-navy-100 text-navy-800";
    }
  };

  if (selectedJob) {
    return (
      <ScrapingJobDetail job={selectedJob} onClose={() => setSelectedJob(null)} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-heading font-semibold text-navy-900 mb-1">
            Scraping Jobs
          </h3>
          <p className="text-navy-600">
            View and monitor scraping job execution
          </p>
        </div>
        <button
          onClick={fetchJobs}
          className="btn btn-secondary"
          disabled={loading}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gold-600" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-navy-600">
          No scraping jobs found. Start a scraping job to see it here.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-navy-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-navy-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-navy-200">
                {jobs.map((job) => {
                  const progress =
                    job.total_donors && job.total_donors > 0
                      ? Math.round(
                          ((job.processed_count || 0) / job.total_donors) * 100
                        )
                      : 0;

                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-navy-50 cursor-pointer"
                      onClick={() => setSelectedJob(job)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                              job.status
                            )}`}
                          >
                            {job.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-navy-900">
                        {job.job_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-navy-200 rounded-full h-2 min-w-[100px]">
                            <div
                              className="bg-gold-600 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-navy-600 min-w-[60px]">
                            {job.processed_count || 0} / {job.total_donors || 0}
                          </span>
                        </div>
                        <div className="text-xs text-navy-500 mt-1">
                          {job.success_count || 0} success, {job.failed_count || 0} failed
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-navy-600">
                        {job.started_at
                          ? new Date(job.started_at).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-navy-600">
                        {job.completed_at
                          ? new Date(job.completed_at).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJob(job);
                          }}
                          className="text-gold-600 hover:text-gold-700"
                        >
                          View Details
                        </button>
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
                {Math.min(page * pageSize, total)} of {total} jobs
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
        </div>
      )}
    </div>
  );
}
