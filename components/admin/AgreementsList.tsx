"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Agreement } from "@/lib/supabase/types";
import { FileText, Plus, Download, Edit, Trash2, Upload } from "lucide-react";

interface AgreementsListProps {
  accountId: string;
  locationId: string;
  agreements: Agreement[];
}

export default function AgreementsList({ accountId, locationId, agreements }: AgreementsListProps) {
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF files are allowed');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/admin/locations/${locationId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload document');
      }

      router.refresh();
      setShowUpload(false);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      setUploadError(error.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-semibold text-navy-900">
          Agreements
        </h2>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn btn-primary"
        >
          <Upload className="w-5 h-5" />
          Upload Agreement PDF
        </button>
      </div>

      {agreements.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-navy-300 mx-auto mb-4" />
          <p className="text-navy-600 mb-4">No agreements yet</p>
          <button onClick={() => setShowUpload(true)} className="btn btn-primary">
            <Upload className="w-5 h-5" />
            Upload Agreement PDF
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {agreements.map((agreement) => (
            <div
              key={agreement.id}
              className="border border-navy-200 rounded-lg p-4 hover:shadow-md transition-shadow"
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
                  <button className="p-2 text-navy-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-navy-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <div className="mt-6 p-6 bg-cream-50 rounded-lg border border-navy-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-navy-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold-600" />
              Upload Agreement PDF
            </h3>
            <button
              onClick={() => {
                setShowUpload(false);
                setUploadError(null);
              }}
              className="text-navy-600 hover:text-navy-900 text-2xl leading-none"
              disabled={isUploading}
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-navy-600">
              Upload a location-level agreement document (PDF format)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="btn btn-primary"
            >
              <Upload className="w-5 h-5" />
              {isUploading ? 'Uploading...' : 'Choose PDF File'}
            </button>
          </div>

          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{uploadError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

