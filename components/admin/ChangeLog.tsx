"use client";

import { useState, useEffect } from "react";
import { Clock, Merge, MapPin, Plus, Minus, Loader2, User, RefreshCw, Building2, FileText, Upload, Trash2, Edit } from "lucide-react";

interface ChangeLogEntry {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  description: string;
  details: Record<string, any> | null;
  created_at: string;
}

const actionIcons: Record<string, typeof Merge> = {
  merge_accounts: Merge,
  merge_locations: Merge,
  add_location: Plus,
  remove_location: Minus,
  create_account: Building2,
  update_account: Edit,
  delete_account: Trash2,
  create_location: MapPin,
  update_location: Edit,
  delete_location: Trash2,
  create_agreement: FileText,
  update_agreement: Edit,
  delete_agreement: Trash2,
  upload_contract: Upload,
  upload_license: Upload,
};

const actionLabels: Record<string, string> = {
  merge_accounts: "Merged Accounts",
  merge_locations: "Merged Locations",
  add_location: "Added Location",
  remove_location: "Removed Location",
  create_account: "Created Account",
  update_account: "Updated Account",
  delete_account: "Deleted Account",
  create_location: "Created Location",
  update_location: "Updated Location",
  delete_location: "Deleted Location",
  create_agreement: "Created Agreement",
  update_agreement: "Updated Agreement",
  delete_agreement: "Deleted Agreement",
  upload_contract: "Uploaded Contract",
  upload_license: "Uploaded License",
};

export default function ChangeLog() {
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChangeLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/data-tools/change-log?limit=50');
      if (!response.ok) {
        throw new Error('Failed to fetch change logs');
      }
      const data = await response.json();
      setChangeLogs(data.changeLogs || []);
    } catch (err: any) {
      console.error('Error fetching change logs:', err);
      setError(err.message || 'Failed to load change logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChangeLogs();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDetails = (details: Record<string, any> | null): string | null => {
    if (!details) return null;

    const parts: string[] = [];
    
    // Merge operations
    if (details.accountsMerged) {
      parts.push(`${details.accountsMerged} accounts merged`);
    }
    if (details.locationCount !== undefined) {
      parts.push(`${details.locationCount} location${details.locationCount !== 1 ? 's' : ''}`);
    }
    if (details.mergedAccountName) {
      parts.push(`into "${details.mergedAccountName}"`);
    }
    if (details.accountName) {
      parts.push(`created "${details.accountName}"`);
    }
    if (details.sourceLocationName && details.targetLocationName) {
      parts.push(`"${details.sourceLocationName}" → "${details.targetLocationName}"`);
    }
    
    // Field changes
    if (details.changedFields && Array.isArray(details.changedFields)) {
      if (details.changedFields.length > 0) {
        const fields = details.changedFields.length <= 3 
          ? details.changedFields.join(', ')
          : `${details.changedFields.slice(0, 3).join(', ')} and ${details.changedFields.length - 3} more`;
        parts.push(`Changed: ${fields}`);
      }
    }
    
    // File uploads
    if (details.fileName) {
      parts.push(`File: ${details.fileName}`);
    }
    if (details.fileSize) {
      const sizeKB = (details.fileSize / 1024).toFixed(1);
      parts.push(`Size: ${sizeKB} KB`);
    }

    return parts.length > 0 ? parts.join(' • ') : null;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-navy-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-semibold text-navy-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Change Log
            </h2>
            <p className="text-sm text-navy-600 mt-1">
              Track all changes made to accounts, locations, agreements, and documents
            </p>
          </div>
          <button
            onClick={fetchChangeLogs}
            disabled={loading}
            className="btn btn-secondary flex items-center gap-2"
            title="Refresh change log"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading && changeLogs.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-navy-400 animate-spin mx-auto mb-4" />
            <p className="text-navy-600">Loading change log...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={fetchChangeLogs} className="btn btn-primary">
              Try Again
            </button>
          </div>
        ) : changeLogs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-navy-300 mx-auto mb-4" />
            <p className="text-navy-600">No changes logged yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {changeLogs.map((entry) => {
              const Icon = actionIcons[entry.action_type] || Clock;
              const actionLabel = actionLabels[entry.action_type] || entry.action_type;
              const detailsText = formatDetails(entry.details);

              return (
                <div
                  key={entry.id}
                  className="flex gap-4 border-l-2 border-navy-200 pl-4 py-4 hover:bg-cream-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-navy-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-navy-900">{actionLabel}</h3>
                      {entry.entity_name && (
                        <span className="text-sm text-navy-600">
                          • {entry.entity_name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-navy-700 mb-2">{entry.description}</p>
                    {detailsText && (
                      <p className="text-xs text-navy-500 mb-2 italic">{detailsText}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-navy-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>
                          {entry.user_name || entry.user_email}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(entry.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

