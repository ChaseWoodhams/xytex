"use client";

import type { Location, Agreement } from "@/lib/supabase/types";
import { getLocationAgreementStatus } from "@/lib/supabase/agreements";
import { Building2, MapPin, FileCheck, AlertCircle, Clock } from "lucide-react";

interface NetworkDashboardProps {
  locations: Location[];
  locationAgreementsMap: Map<string, Agreement[]>;
}

export default function NetworkDashboard({
  locations,
  locationAgreementsMap,
}: NetworkDashboardProps) {
  // Calculate statistics
  const totalLocations = locations.length;
  
  const locationsWithStats = locations.map((location) => {
    const agreements = locationAgreementsMap.get(location.id) || [];
    const agreementStatus = getLocationAgreementStatus(agreements);
    return {
      location,
      agreementStatus,
    };
  });

  const activeContractCount = locationsWithStats.filter(
    (item) => item.agreementStatus.status === 'active'
  ).length;

  const needsContractCount = locationsWithStats.filter(
    (item) => item.agreementStatus.status === 'none'
  ).length;

  const expiredCount = locationsWithStats.filter(
    (item) => item.agreementStatus.status === 'expired'
  ).length;

  const draftCount = locationsWithStats.filter(
    (item) => item.agreementStatus.status === 'draft'
  ).length;

  const needsAttentionCount = needsContractCount + expiredCount;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-heading font-semibold text-navy-900">
          Network Overview
        </h2>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-navy-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-navy-600" />
            <span className="text-sm font-medium text-navy-600">Total Locations</span>
          </div>
          <p className="text-2xl font-bold text-navy-900">{totalLocations}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Active Contracts</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{activeContractCount}</p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Need Attention</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">{needsAttentionCount}</p>
          <p className="text-xs text-orange-600 mt-1">
            {needsContractCount} need contracts, {expiredCount} expired
          </p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">Draft Contracts</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900">{draftCount}</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="border-t border-navy-200 pt-4">
        <h3 className="text-sm font-semibold text-navy-700 mb-3">Contract Status Breakdown</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-navy-600">Locations with active contracts</span>
            <span className="text-sm font-semibold text-navy-900">
              {activeContractCount} ({Math.round((activeContractCount / totalLocations) * 100)}%)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-navy-600">Locations needing contracts</span>
            <span className="text-sm font-semibold text-navy-900">
              {needsContractCount} ({Math.round((needsContractCount / totalLocations) * 100)}%)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-navy-600">Expired contracts</span>
            <span className="text-sm font-semibold text-navy-900">
              {expiredCount} ({Math.round((expiredCount / totalLocations) * 100)}%)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-navy-600">Draft contracts</span>
            <span className="text-sm font-semibold text-navy-900">
              {draftCount} ({Math.round((draftCount / totalLocations) * 100)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

