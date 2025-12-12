"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { AccountUpload } from "@/lib/supabase/types";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

interface AccountUploadHistoryProps {
  uploads: AccountUpload[];
  onRevert?: () => void;
}

export default function AccountUploadHistory({
  uploads,
  onRevert,
}: AccountUploadHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [confirmRevert, setConfirmRevert] = useState<AccountUpload | null>(null);
  const router = useRouter();

  if (uploads.length === 0) {
    return null;
  }

  const handleRevert = async (upload: AccountUpload) => {
    setRevertingId(upload.id);
    try {
      const response = await fetch(
        `/api/admin/accounts/uploads/${upload.id}/revert`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to revert upload");
      }

      const result = await response.json();
      alert(
        `Successfully reverted upload. ${result.deletedCount} accounts were deleted.`
      );
      router.refresh();
      onRevert?.();
    } catch (error: any) {
      console.error("Error reverting upload:", error);
      alert(`Failed to revert upload: ${error.message}`);
    } finally {
      setRevertingId(null);
      setConfirmRevert(null);
    }
  };

  const completedUploads = uploads.filter((u) => u.status === "completed");
  const revertedUploads = uploads.filter((u) => u.status === "reverted");

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-cream-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-5 h-5 text-navy-600" />
          <h3 className="text-lg font-heading font-semibold text-navy-900">
            CSV Upload History
          </h3>
          <span className="px-2 py-0.5 text-xs font-semibold bg-navy-100 text-navy-700 rounded-full">
            {uploads.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-navy-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-navy-400" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-navy-100">
          {/* Stats */}
          <div className="px-6 py-3 bg-cream-50 flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-navy-600">
                {completedUploads.length} active upload
                {completedUploads.length !== 1 ? "s" : ""}
              </span>
            </div>
            {revertedUploads.length > 0 && (
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-navy-500">
                  {revertedUploads.length} reverted
                </span>
              </div>
            )}
          </div>

          {/* Upload list */}
          <div className="divide-y divide-navy-100">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className={`px-6 py-4 ${
                  upload.status === "reverted" ? "bg-gray-50 opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-navy-900 truncate">
                        {upload.name}
                      </h4>
                      {upload.status === "completed" ? (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Reverted
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-navy-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <span className="text-navy-400">File:</span>
                        {upload.file_name}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-navy-400">Accounts:</span>
                        {upload.account_count}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-navy-400" />
                        {new Date(upload.created_at).toLocaleDateString()}{" "}
                        {new Date(upload.created_at).toLocaleTimeString()}
                      </p>
                      {upload.status === "reverted" && upload.reverted_at && (
                        <p className="text-red-600 flex items-center gap-2">
                          <RotateCcw className="w-3 h-3" />
                          Reverted on{" "}
                          {new Date(upload.reverted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {upload.status === "completed" && (
                    <button
                      onClick={() => setConfirmRevert(upload)}
                      disabled={revertingId === upload.id}
                      className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 flex items-center gap-2"
                    >
                      {revertingId === upload.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Reverting...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          Revert
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Revert Dialog */}
      {confirmRevert && (
        <DeleteConfirmationDialog
          isOpen={!!confirmRevert}
          onClose={() => setConfirmRevert(null)}
          onConfirm={() => handleRevert(confirmRevert)}
          title="Revert Upload"
          message={
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">This action cannot be undone</p>
                  <p>
                    This will permanently delete all {confirmRevert.account_count} accounts
                    (and their locations) that were imported from this file.
                  </p>
                </div>
              </div>
              <p className="text-navy-600">
                Are you sure you want to revert the upload{" "}
                <strong>&quot;{confirmRevert.name}&quot;</strong>?
              </p>
            </div>
          }
          itemName={confirmRevert.name}
          confirmText="Revert Upload"
          isLoading={revertingId === confirmRevert.id}
        />
      )}
    </div>
  );
}

