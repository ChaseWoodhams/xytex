"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import AccountMergeTool from "@/components/admin/AccountMergeTool";
import LocationManagementTool from "@/components/admin/LocationManagementTool";
import ChangeLog from "@/components/admin/ChangeLog";

export default function DataToolsTab() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportContacts = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/export/contacts');
      
      if (!response.ok) {
        throw new Error('Failed to export contacts');
      }

      // Get the CSV content
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'xytex-contacts-export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting contacts:', error);
      alert('Failed to export contacts. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-semibold text-navy-900 mb-1">
          Data Tools
        </h2>
        <p className="text-navy-600">
          Tools to help manage and clean up your CRM data
        </p>
      </div>

      {/* Export Contacts Section */}
      <div className="bg-white rounded-lg border border-navy-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-heading font-semibold text-navy-900 mb-1">
              Export Contact Information
            </h3>
            <p className="text-sm text-navy-600">
              Export all contact information including emails, phone numbers, and locations to CSV
            </p>
          </div>
          <button
            onClick={handleExportContacts}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-navy-800 text-white rounded-lg hover:bg-navy-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export Contacts'}
          </button>
        </div>
        <div className="text-sm text-navy-600 bg-navy-50 p-3 rounded border border-navy-200">
          <p className="font-medium mb-1">What's included:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Account primary contacts (name, email, phone)</li>
            <li>Account UDF contacts (email, phone)</li>
            <li>Location contacts (name, email, phone, address)</li>
            <li>Detailed location contacts with roles</li>
            <li>Account and location metadata (website, industry, status)</li>
          </ul>
        </div>
      </div>

      <AccountMergeTool />
      <LocationManagementTool />
      <ChangeLog />
    </div>
  );
}
