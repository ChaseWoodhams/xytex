"use client";

import AccountMergeTool from "@/components/admin/AccountMergeTool";
import LocationManagementTool from "@/components/admin/LocationManagementTool";
import ChangeLog from "@/components/admin/ChangeLog";

export default function DataToolsTab() {
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

      <AccountMergeTool />
      <LocationManagementTool />
      <ChangeLog />
    </div>
  );
}
