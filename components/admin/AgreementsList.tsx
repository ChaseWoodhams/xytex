"use client";

import { useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Agreement } from "@/lib/supabase/types";
import { FileText, Download, Edit, Trash2, Upload, X, Eye } from "lucide-react";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AgreementsListProps {
  accountId: string;
  locationId: string;
  agreements: Agreement[];
}

export default function AgreementsList({ accountId, locationId, agreements }: AgreementsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);
  const [deletingAgreementId, setDeletingAgreementId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSignedDate, setUploadSignedDate] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate locationId
    if (!locationId) {
      setUploadError('Location ID is required');
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF files are allowed');
      return;
    }

    // Store the file and show modal for signed date input
    setShowUploadModal(true);
    // Store file in a way we can access it later
    if (fileInputRef.current) {
      (fileInputRef.current as any).storedFile = file;
    }
  };

  const handleUploadWithSignedDate = async () => {
    const file = (fileInputRef.current as any)?.storedFile;
    if (!file) {
      setUploadError('No file selected');
      setShowUploadModal(false);
      return;
    }

    // Validate locationId
    if (!locationId) {
      setUploadError('Location ID is required');
      setShowUploadModal(false);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // 1) Upload file directly to Supabase Storage from the browser
      const supabase = createSupabaseBrowserClient();
      const fileExt = file.name.split('.').pop() || 'pdf';
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const uniqueId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      const storageFileName = `${baseName}-${uniqueId}.${fileExt}`;
      const filePath = `location-agreements/location-${locationId}-${storageFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('agreements')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'application/pdf',
        });

      if (uploadError) {
        console.error('Error uploading agreement PDF to Supabase Storage:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload document to storage');
      }

      const { data: urlData } = supabase.storage
        .from('agreements')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to generate public URL for uploaded document');
      }

      const documentUrl = urlData.publicUrl;

      // 2) Call lightweight API route to record agreement metadata in the database
      const metadataResponse = await fetch(`/api/admin/locations/${locationId}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_url: documentUrl,
          file_name: file.name,
          signed_date: uploadSignedDate || null,
        }),
      });

      if (!metadataResponse.ok) {
        let errorMessage = 'Failed to record agreement metadata';
        try {
          const text = await metadataResponse.text();
          if (text.trim()) {
            const error = JSON.parse(text);
            errorMessage = error.error || errorMessage;
          } else {
            errorMessage = metadataResponse.statusText || errorMessage;
          }
        } catch {
          errorMessage = metadataResponse.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      await metadataResponse.json();

      // Clear the file input and modal state
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        (fileInputRef.current as any).storedFile = null;
      }
      setUploadSignedDate('');
      setShowUploadModal(false);
      
      // Refresh the page to show the new agreement
      // Use both refresh and push to ensure data is updated
      router.refresh();
      // Small delay then push to ensure refresh completes
      setTimeout(() => {
        router.push(pathname);
      }, 100);
      setUploadError(null);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      setUploadError(error.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        (fileInputRef.current as any).storedFile = null;
      }
    }
  };

  const handleEditAgreement = (agreement: Agreement) => {
    setEditingAgreement(agreement);
  };

  const handleSaveAgreement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAgreement) return;

    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const updates = {
        title: formData.get('title') as string,
        signed_date: formData.get('signed_date') ? (formData.get('signed_date') as string) : null,
        signer_name: formData.get('signer_name') ? (formData.get('signer_name') as string) : null,
        signer_email: formData.get('signer_email') ? (formData.get('signer_email') as string) : null,
        start_date: formData.get('start_date') ? (formData.get('start_date') as string) : null,
        end_date: formData.get('end_date') ? (formData.get('end_date') as string) : null,
      };

      const response = await fetch(`/api/admin/agreements/${editingAgreement.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update agreement');
      }

      setEditingAgreement(null);
      router.refresh();
      setTimeout(() => {
        router.push(pathname);
      }, 100);
    } catch (error: any) {
      console.error('Error updating agreement:', error);
      setUploadError(error.message || 'Failed to update agreement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAgreement = async (agreementId: string, agreementTitle: string) => {
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete the agreement "${agreementTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingAgreementId(agreementId);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/agreements/${agreementId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete agreement';
        try {
          const text = await response.text();
          if (text.trim()) {
            const error = JSON.parse(text);
            errorMessage = error.error || errorMessage;
          } else {
            errorMessage = response.statusText || errorMessage;
          }
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Refresh the page to show updated list
      router.refresh();
      setTimeout(() => {
        router.push(pathname);
      }, 100);
    } catch (error: any) {
      console.error('Error deleting agreement:', error);
      setDeleteError(error.message || 'Failed to delete agreement');
    } finally {
      setDeletingAgreementId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-semibold text-navy-900">
          Agreements
        </h2>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
          <button
            onClick={() => {
              setUploadSignedDate('');
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="btn btn-primary"
          >
            <Upload className="w-5 h-5" />
            {isUploading ? 'Uploading...' : 'Upload Agreement PDF'}
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{uploadError}</p>
        </div>
      )}

      {deleteError && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{deleteError}</p>
          <button
            onClick={() => setDeleteError(null)}
            className="mt-2 text-sm text-red-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {agreements.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-navy-300 mx-auto mb-4" />
          <p className="text-navy-600 mb-4">No agreements yet</p>
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
                    {agreement.signed_date && (
                      <p>
                        <strong>Signed:</strong>{" "}
                        {new Date(agreement.signed_date).toLocaleDateString()}
                      </p>
                    )}
                    {agreement.signer_name && (
                      <p>
                        <strong>Signer:</strong> {agreement.signer_name}
                      </p>
                    )}
                    {agreement.signer_email && (
                      <p>
                        <strong>Email:</strong>{" "}
                        <a
                          href={`mailto:${agreement.signer_email}`}
                          className="text-gold-600 hover:text-gold-700 underline"
                        >
                          {agreement.signer_email}
                        </a>
                      </p>
                    )}
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
                    <>
                      <button
                        onClick={() => setViewingPdf(agreement.document_url!)}
                        className="p-2 text-navy-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                        title="View PDF"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a
                        href={agreement.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-navy-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </>
                  )}
                  <button 
                    onClick={() => handleEditAgreement(agreement)}
                    className="p-2 text-navy-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                    title="Edit Agreement"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteAgreement(agreement.id, agreement.title)}
                    disabled={deletingAgreementId === agreement.id}
                    className="p-2 text-navy-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete Agreement"
                  >
                    {deletingAgreementId === agreement.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-navy-200">
              <h3 className="text-lg font-heading font-semibold text-navy-900">
                Agreement Document
              </h3>
              <button
                onClick={() => setViewingPdf(null)}
                className="p-2 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={viewingPdf}
                className="w-full h-full border-0"
                title="Agreement PDF Viewer"
              />
            </div>
            <div className="p-4 border-t border-navy-200 flex items-center justify-between">
              <a
                href={viewingPdf}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
              <button
                onClick={() => setViewingPdf(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Agreement Modal */}
      {editingAgreement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-navy-200">
              <h3 className="text-xl font-heading font-semibold text-navy-900">
                Edit Agreement
              </h3>
              <button
                onClick={() => setEditingAgreement(null)}
                className="p-2 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAgreement} className="p-6 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-navy-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  defaultValue={editingAgreement.title}
                  required
                  className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label htmlFor="signed_date" className="block text-sm font-medium text-navy-700 mb-1">
                  Signed Date
                </label>
                <input
                  type="date"
                  id="signed_date"
                  name="signed_date"
                  defaultValue={editingAgreement.signed_date ? editingAgreement.signed_date.split('T')[0] : ''}
                  className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label htmlFor="signer_name" className="block text-sm font-medium text-navy-700 mb-1">
                  Signer Name
                </label>
                <input
                  type="text"
                  id="signer_name"
                  name="signer_name"
                  defaultValue={editingAgreement.signer_name || ''}
                  placeholder="e.g., Erin Marten"
                  className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label htmlFor="signer_email" className="block text-sm font-medium text-navy-700 mb-1">
                  Signer Email
                </label>
                <input
                  type="email"
                  id="signer_email"
                  name="signer_email"
                  defaultValue={editingAgreement.signer_email || ''}
                  placeholder="e.g., emarten@solaceconsultingllc.com"
                  className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-navy-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    defaultValue={editingAgreement.start_date ? editingAgreement.start_date.split('T')[0] : ''}
                    className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-navy-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    defaultValue={editingAgreement.end_date ? editingAgreement.end_date.split('T')[0] : ''}
                    className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-200">
                <button
                  type="button"
                  onClick={() => setEditingAgreement(null)}
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Agreement Modal with Signed Date Input */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-navy-200">
              <h3 className="text-xl font-heading font-semibold text-navy-900">
                Upload Service Agreement
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadSignedDate('');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                    (fileInputRef.current as any).storedFile = null;
                  }
                }}
                className="p-2 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="upload_signed_date" className="block text-sm font-medium text-navy-700 mb-1">
                  Contract Sign Date (Optional)
                </label>
                <input
                  type="date"
                  id="upload_signed_date"
                  value={uploadSignedDate}
                  onChange={(e) => setUploadSignedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
                <p className="mt-1 text-xs text-navy-500">
                  Enter the date the contract was signed. Leave blank if unknown.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadSignedDate('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                      (fileInputRef.current as any).storedFile = null;
                    }
                  }}
                  className="btn btn-secondary"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadWithSignedDate}
                  className="btn btn-primary"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload Agreement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

