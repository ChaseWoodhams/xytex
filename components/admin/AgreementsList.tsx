"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Agreement } from "@/lib/supabase/types";
import { FileText, Plus, Download, Edit, Trash2, Search } from "lucide-react";

interface AgreementsListProps {
  accountId: string;
  agreements: Agreement[];
  locationFilterId?: string | null;
}

export default function AgreementsList({ accountId, agreements, locationFilterId }: AgreementsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgreements = useMemo(() => {
    let base = agreements;

    // Optional filter: show only agreements for a specific location
    if (locationFilterId) {
      base = base.filter((agreement) => agreement.location_id === locationFilterId);
    }

    if (!searchQuery.trim()) {
      return base;
    }

    const query = searchQuery.toLowerCase();
    return base.filter((agreement) => {
      // Search in title
      if (agreement.title?.toLowerCase().includes(query)) return true;
      
      // Search in agreement type
      if (agreement.agreement_type?.toLowerCase().includes(query)) return true;
      
      // Search in status
      if (agreement.status?.toLowerCase().includes(query)) return true;
      
      // Search in terms
      if (agreement.terms?.toLowerCase().includes(query)) return true;
      
      // Search in notes
      if (agreement.notes?.toLowerCase().includes(query)) return true;
      
      // Search in formatted dates
      if (agreement.start_date) {
        const startDate = new Date(agreement.start_date).toLocaleDateString().toLowerCase();
        if (startDate.includes(query)) return true;
      }
      
      if (agreement.end_date) {
        const endDate = new Date(agreement.end_date).toLocaleDateString().toLowerCase();
        if (endDate.includes(query)) return true;
      }
      
      // Search in revenue share percentage (as string)
      if (agreement.revenue_share_percentage !== null) {
        if (agreement.revenue_share_percentage.toString().includes(query)) return true;
      }
      
      // Search in monthly fee (as string)
      if (agreement.monthly_fee !== null) {
        if (agreement.monthly_fee.toString().includes(query)) return true;
      }
      
      return false;
    });
  }, [agreements, searchQuery, locationFilterId]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-semibold text-navy-900">
          Agreements
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          New Agreement
        </button>
      </div>

      {/* Search Bar */}
      {agreements.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
            <input
              type="text"
              placeholder="Search agreements by title, type, status, terms, dates, etc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-navy-600">
              Showing {filteredAgreements.length} of {agreements.length} agreement{agreements.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {agreements.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-navy-300 mx-auto mb-4" />
          <p className="text-navy-600 mb-4">No agreements yet</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            Create First Agreement
          </button>
        </div>
      ) : filteredAgreements.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-navy-300 mx-auto mb-4" />
          <p className="text-navy-600 mb-2">No agreements match your search</p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-gold-600 hover:text-gold-700 font-medium text-sm"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAgreements.map((agreement) => (
            <Link
              key={agreement.id}
              href={`/admin/agreements/${agreement.id}`}
              className="block border border-navy-200 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-gold-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-heading font-semibold text-navy-900">
                      {agreement.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        agreement.status === "active"
                          ? "bg-green-100 text-green-800"
                          : agreement.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : agreement.status === "expired"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {agreement.status}
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold bg-navy-100 text-navy-800 rounded-full capitalize">
                      {agreement.agreement_type}
                    </span>
                  </div>
                  <div className="text-sm text-navy-600 space-y-1">
                    {agreement.start_date && (
                      <p>
                        <strong>Start:</strong>{" "}
                        {new Date(agreement.start_date).toLocaleDateString()}
                      </p>
                    )}
                    {agreement.end_date && (
                      <p>
                        <strong>End:</strong>{" "}
                        {new Date(agreement.end_date).toLocaleDateString()}
                      </p>
                    )}
                    {agreement.revenue_share_percentage && (
                      <p>
                        <strong>Revenue Share:</strong>{" "}
                        {agreement.revenue_share_percentage}%
                      </p>
                    )}
                    {agreement.monthly_fee && (
                      <p>
                        <strong>Monthly Fee:</strong> $
                        {agreement.monthly_fee.toLocaleString()}
                      </p>
                    )}
                    {agreement.terms && (
                      <p className="mt-2">{agreement.terms}</p>
                    )}
                  </div>
                  {agreement.notes && (
                    <p className="mt-2 text-sm text-navy-600">{agreement.notes}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  {agreement.document_url && (
                    <a
                      href={agreement.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-navy-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  {/* Edit/Delete will be implemented on the detail page */}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <div className="mt-6 p-4 bg-cream-50 rounded-lg border border-navy-200">
          <p className="text-navy-600 mb-4">
            Agreement form will be implemented in the next phase
          </p>
          <button
            onClick={() => setShowForm(false)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

