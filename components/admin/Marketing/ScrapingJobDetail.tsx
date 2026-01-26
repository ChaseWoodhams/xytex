"use client";

import { useState, useEffect } from "react";
import type { ScrapingJob, ScrapingResult } from "@/lib/supabase/types";
import { X, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface ScrapingJobDetailProps {
  job: ScrapingJob;
  onClose: () => void;
}

export default function ScrapingJobDetail({ job, onClose }: ScrapingJobDetailProps) {
  const [results, setResults] = useState<ScrapingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobDetails, setJobDetails] = useState<ScrapingJob>(job);

  useEffect(() => {
    fetchResults();
    fetchJobDetails();
    
    // Poll for updates if job is running
    const interval = setInterval(() => {
      if (jobDetails.status === "running") {
        fetchJobDetails();
        fetchResults();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobDetails.status]);

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/admin/scraping/jobs/${job.id}`);
      if (response.ok) {
        const data = await response.json();
        setJobDetails(data);
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/scraping/results?job_id=${job.id}&pageSize=1000`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  const progress =
    jobDetails.total_donors && jobDetails.total_donors > 0
      ? Math.round(
          ((jobDetails.processed_count || 0) / jobDetails.total_donors) * 100
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-navy-900 mb-1">
            Scraping Job {job.id.slice(0, 8)}
          </h2>
          <p className="text-navy-600">
            {jobDetails.job_type} job - {jobDetails.status}
          </p>
        </div>
        <button onClick={onClose} className="text-navy-600 hover:text-navy-900 p-2">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Job Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-navy-200 p-4">
          <div className="text-sm text-navy-600 mb-1">Total Donors</div>
          <div className="text-2xl font-bold text-navy-900">
            {jobDetails.total_donors || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-navy-200 p-4">
          <div className="text-sm text-navy-600 mb-1">Processed</div>
          <div className="text-2xl font-bold text-navy-900">
            {jobDetails.processed_count || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-navy-200 p-4">
          <div className="text-sm text-navy-600 mb-1">Success</div>
          <div className="text-2xl font-bold text-green-600">
            {jobDetails.success_count || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-navy-200 p-4">
          <div className="text-sm text-navy-600 mb-1">Failed</div>
          <div className="text-2xl font-bold text-red-600">
            {jobDetails.failed_count || 0}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-navy-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-navy-700">Progress</span>
          <span className="text-sm text-navy-600">{progress}%</span>
        </div>
        <div className="w-full bg-navy-200 rounded-full h-4">
          <div
            className="bg-gold-600 h-4 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Error Message */}
      {jobDetails.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="font-semibold text-red-900 mb-1">Error</div>
          <div className="text-sm text-red-700">{jobDetails.error_message}</div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-sm border border-navy-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-navy-200">
          <h3 className="text-lg font-semibold text-navy-900">Scraping Results</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold-600" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-navy-600">
            No results yet
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
                    Banner Message
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
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-navy-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-900">
                      {result.donor_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.scrape_status === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : result.scrape_status === "failed" ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-600" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-navy-600">
                      {result.banner_message || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-navy-600">
                      {new Date(result.scraped_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      {result.error_message || "-"}
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
