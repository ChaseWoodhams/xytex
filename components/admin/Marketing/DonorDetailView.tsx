"use client";

import type { MarketingDonor } from "@/lib/supabase/types";
import { X, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  formatGeneticTestResults,
  formatHealthInfo,
  formatEducationDetails,
  formatFamilyHistory,
  formatHealthDiseases,
  calculateAge,
} from "@/lib/utils/json-formatter";

interface DonorDetailViewProps {
  donor: MarketingDonor;
  onClose: () => void;
  onEdit: (donor: MarketingDonor) => void;
}

export default function DonorDetailView({
  donor,
  onClose,
  onEdit,
}: DonorDetailViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["core", "demographics", "physical", "inventory"])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatJson = (data: any): string => {
    if (!data) return "N/A";
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const formatDate = (date: string | null): string => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return date;
    }
  };

  const Section = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections.has(id);
    return (
      <div className="border border-navy-200 rounded-lg mb-4">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="w-full px-6 py-4 flex items-center justify-between bg-navy-50 hover:bg-navy-100 transition-colors"
        >
          <h3 className="text-lg font-semibold text-navy-900">{title}</h3>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-navy-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-navy-600" />
          )}
        </button>
        {isExpanded && <div className="p-6 space-y-4">{children}</div>}
      </div>
    );
  };

  const InfoRow = ({ label, value }: { label: string; value: any }) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    return (
      <div className="grid grid-cols-3 gap-4">
        <div className="text-sm font-medium text-navy-700">{label}:</div>
        <div className="col-span-2 text-sm text-navy-900">{String(value)}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-navy-900 mb-1">
            Donor {donor.id}
          </h2>
          <p className="text-navy-600">
            {donor.name || "Unnamed Donor"} - Comprehensive Profile
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(donor)}
            className="btn btn-secondary"
          >
            <Edit className="w-5 h-5" />
            Edit
          </button>
          <button
            onClick={onClose}
            className="text-navy-600 hover:text-navy-900 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <Section id="core" title="Core Identification">
        <div className="space-y-2">
          <InfoRow label="Donor ID" value={donor.id} />
          <InfoRow label="Name" value={donor.name} />
          <InfoRow label="Year of Birth" value={donor.year_of_birth} />
          {donor.year_of_birth && (
            <InfoRow label="Age" value={calculateAge(donor.year_of_birth)} />
          )}
          <InfoRow label="Marital Status" value={donor.marital_status} />
          <InfoRow label="Number of Children" value={donor.number_of_children} />
        </div>
      </Section>

      <Section id="demographics" title="Demographics">
        <div className="space-y-2">
          <InfoRow label="Occupation" value={donor.occupation} />
          <InfoRow label="Education" value={donor.education} />
          <InfoRow label="Blood Type" value={donor.blood_type} />
          <InfoRow label="CMV Status" value={donor.cmv_status} />
          <InfoRow label="Nationality (Maternal)" value={donor.nationality_maternal} />
          <InfoRow label="Nationality (Paternal)" value={donor.nationality_paternal} />
          <InfoRow label="Race" value={donor.race} />
        </div>
      </Section>

      <Section id="physical" title="Physical Attributes">
        <div className="space-y-2">
          <InfoRow label="Height (feet/inches)" value={donor.height_feet_inches} />
          <InfoRow label="Height (cm)" value={donor.height_cm} />
          <InfoRow label="Weight (lbs)" value={donor.weight_lbs} />
          <InfoRow label="Weight (kg)" value={donor.weight_kg} />
          <InfoRow label="Eye Color" value={donor.eye_color} />
          <InfoRow label="Hair Color" value={donor.hair_color} />
          <InfoRow label="Hair Texture" value={donor.hair_texture} />
          <InfoRow label="Hair Loss" value={donor.hair_loss} />
          <InfoRow label="Hair Type" value={donor.hair_type} />
          <InfoRow label="Body Build" value={donor.body_build} />
          <InfoRow label="Freckles" value={donor.freckles} />
          <InfoRow label="Skin Tone" value={donor.skin_tone} />
        </div>
      </Section>

      <Section id="genetic" title="Genetic Testing">
        <div className="space-y-4">
          <InfoRow label="Genetic Tests Count" value={donor.genetic_tests_count} />
          <InfoRow
            label="Last Medical History Update"
            value={formatDate(donor.last_medical_history_update)}
          />
          {donor.genetic_test_results && (
            <div>
              <div className="text-sm font-medium text-navy-700 mb-3">
                Genetic Test Results:
              </div>
              {formatGeneticTestResults(donor.genetic_test_results)}
            </div>
          )}
        </div>
      </Section>

      <Section id="health" title="Health Information">
        <div className="space-y-4">
          <InfoRow label="Health Comments" value={donor.health_comments} />
          {donor.health_info && (
            <div>
              <div className="text-sm font-medium text-navy-700 mb-3">
                Health Info:
              </div>
              {formatHealthInfo(donor.health_info)}
            </div>
          )}
        </div>
      </Section>

      <Section id="personality" title="Personality & Interests">
        <div className="space-y-2">
          <InfoRow
            label="Skills, Hobbies & Interests"
            value={donor.skills_hobbies_interests}
          />
          {donor.personality_description && (
            <div>
              <div className="text-sm font-medium text-navy-700 mb-2">
                Personality Description:
              </div>
              <div className="text-sm text-navy-900 whitespace-pre-wrap">
                {donor.personality_description}
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section id="education" title="Education Details">
        {donor.education_details ? (
          formatEducationDetails(donor.education_details)
        ) : (
          <span className="text-navy-600 italic">No education details available</span>
        )}
      </Section>

      <Section id="family" title="Family Medical History">
        <div className="space-y-6">
          {donor.immediate_family_history && (
            <div>
              {formatFamilyHistory(donor.immediate_family_history, 'Immediate Family')}
            </div>
          )}
          {donor.paternal_family_history && (
            <div>
              {formatFamilyHistory(donor.paternal_family_history, 'Paternal Family')}
            </div>
          )}
          {donor.maternal_family_history && (
            <div>
              {formatFamilyHistory(donor.maternal_family_history, 'Maternal Family')}
            </div>
          )}
          {donor.health_diseases && (
            <div>
              <div className="text-sm font-medium text-navy-700 mb-3">
                Health & Diseases:
              </div>
              {formatHealthDiseases(donor.health_diseases)}
            </div>
          )}
          {!donor.immediate_family_history && 
           !donor.paternal_family_history && 
           !donor.maternal_family_history && 
           !donor.health_diseases && (
            <span className="text-navy-600 italic">No family medical history available</span>
          )}
        </div>
      </Section>

      <Section id="inventory" title="Donor Status Report">
        {(() => {
          // Extract inventory_data from compliance_flags (where we store it)
          const statusReport = donor.compliance_flags && typeof donor.compliance_flags === 'object' && 'inventory_data' in donor.compliance_flags
            ? (donor.compliance_flags as any).inventory_data
            : null;

          if (!statusReport) {
            return <div className="text-sm text-navy-600">No status report data available</div>;
          }

          const inventoryData = statusReport;

          return (
            <>
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-navy-50 p-4 rounded-lg">
                  <div className="text-xs text-navy-600 mb-1">Total Units</div>
                  <div className="text-2xl font-bold text-navy-900">{inventoryData.total_units || 0}</div>
                </div>
                {inventoryData.total_visits !== undefined && (
                  <div className="bg-navy-50 p-4 rounded-lg">
                    <div className="text-xs text-navy-600 mb-1">Total Visits</div>
                    <div className="text-2xl font-bold text-navy-900">{inventoryData.total_visits}</div>
                  </div>
                )}
                {inventoryData.avg_units_per_visit !== undefined && (
                  <div className="bg-navy-50 p-4 rounded-lg">
                    <div className="text-xs text-navy-600 mb-1">Avg Units/Visit</div>
                    <div className="text-2xl font-bold text-navy-900">{inventoryData.avg_units_per_visit.toFixed(2)}</div>
                  </div>
                )}
                {inventoryData.finished?.total !== undefined && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-xs text-green-700 mb-1">Finished</div>
                    <div className="text-2xl font-bold text-green-900">{inventoryData.finished.total}</div>
                  </div>
                )}
              </div>

              {/* Finished Units */}
              {inventoryData.finished && (
                <div>
                  <h4 className="text-sm font-semibold text-navy-900 mb-3">Finished Units</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Unwashed */}
                    {inventoryData.finished.unwashed && Object.keys(inventoryData.finished.unwashed).length > 0 && (
                      <div className="border border-navy-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-navy-700 mb-2">Unwashed</div>
                        <div className="space-y-1">
                          {Object.entries(inventoryData.finished.unwashed).map(([type, count]: [string, any]) => (
                            <div key={type} className="flex justify-between text-sm">
                              <span className="text-navy-600">{type}:</span>
                              <span className="font-medium text-navy-900">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Washed */}
                    {inventoryData.finished.washed && Object.keys(inventoryData.finished.washed).length > 0 && (
                      <div className="border border-navy-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-navy-700 mb-2">Washed</div>
                        <div className="space-y-1">
                          {Object.entries(inventoryData.finished.washed).map(([type, count]: [string, any]) => (
                            <div key={type} className="flex justify-between text-sm">
                              <span className="text-navy-600">{type}:</span>
                              <span className="font-medium text-navy-900">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ART */}
                    {inventoryData.finished.art && Object.keys(inventoryData.finished.art).length > 0 && (
                      <div className="border border-navy-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-navy-700 mb-2">ART</div>
                        <div className="space-y-1">
                          {Object.entries(inventoryData.finished.art).map(([type, count]: [string, any]) => (
                            <div key={type} className="flex justify-between text-sm">
                              <span className="text-navy-600">{type}:</span>
                              <span className="font-medium text-navy-900">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quarantine Units */}
              {inventoryData.quarantine && (
                <div>
                  <h4 className="text-sm font-semibold text-navy-900 mb-3">Quarantine Units</h4>
                  <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <div className="text-xs text-orange-700 mb-1">Unwashed</div>
                        <div className="text-lg font-bold text-orange-900">{inventoryData.quarantine.unwashed || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-orange-700 mb-1">Washed</div>
                        <div className="text-lg font-bold text-orange-900">{inventoryData.quarantine.washed || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-orange-700 mb-1">ART</div>
                        <div className="text-lg font-bold text-orange-900">{inventoryData.quarantine.art || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-orange-700 mb-1">Washed CC</div>
                        <div className="text-lg font-bold text-orange-900">{inventoryData.quarantine.washed_cc || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-orange-700 mb-1">Unwashed CC</div>
                        <div className="text-lg font-bold text-orange-900">{inventoryData.quarantine.unwashed_cc || 0}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-orange-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-orange-900">Total Quarantine:</span>
                        <span className="text-lg font-bold text-orange-900">{inventoryData.quarantine.total || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Unit Types Breakdown */}
              {inventoryData.unit_types && Object.keys(inventoryData.unit_types).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-navy-900 mb-3">Unit Types</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(inventoryData.unit_types).map(([type, count]: [string, any]) => (
                      <div key={type} className="flex justify-between items-center p-2 bg-navy-50 rounded">
                        <span className="text-sm text-navy-600">{type}:</span>
                        <span className="text-sm font-medium text-navy-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Header Info */}
            {(statusReport.rating || statusReport.date_of_last_p2 || statusReport.colorado_compliant !== undefined) && (
              <div className="mt-6 pt-6 border-t border-navy-200">
                <h4 className="text-sm font-semibold text-navy-900 mb-3">Donor Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {statusReport.rating && (
                    <div>
                      <div className="text-xs text-navy-600 mb-1">Rating</div>
                      <div className="text-lg font-bold text-navy-900">{statusReport.rating}</div>
                    </div>
                  )}
                  {statusReport.date_of_last_p2 && (
                    <div>
                      <div className="text-xs text-navy-600 mb-1">Date of Last P2</div>
                      <div className="text-lg font-bold text-navy-900">{statusReport.date_of_last_p2}</div>
                    </div>
                  )}
                  {statusReport.colorado_compliant !== undefined && (
                    <div>
                      <div className="text-xs text-navy-600 mb-1">Colorado Compliant</div>
                      <div className={`text-lg font-bold ${statusReport.colorado_compliant ? 'text-green-600' : 'text-red-600'}`}>
                        {statusReport.colorado_compliant ? 'Yes' : 'No'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sales Data */}
            {statusReport.sales_data && (
              <div className="mt-6 pt-6 border-t border-navy-200">
                <h4 className="text-sm font-semibold text-navy-900 mb-3">Sales Data</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-navy-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-navy-700">Region</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-navy-700">Current</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-navy-700">YTD</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-navy-700">Previous Year</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-navy-700">All Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-200">
                      {['us', 'canada', "int'l", 'total'].map((region) => {
                        const regionKey = region === "int'l" ? 'intl' : region;
                        const data = statusReport.sales_data;
                        if (!data.current || !data.current[regionKey]) return null;
                        return (
                          <tr key={region}>
                            <td className="px-4 py-2 font-medium text-navy-900 capitalize">{region}</td>
                            <td className="px-4 py-2 text-right text-navy-600">{data.current[regionKey] || 0}</td>
                            <td className="px-4 py-2 text-right text-navy-600">{data.ytd?.[regionKey] || 0}</td>
                            <td className="px-4 py-2 text-right text-navy-600">{data.previous_year?.[regionKey] || 0}</td>
                            <td className="px-4 py-2 text-right text-navy-600">{data.all_time?.[regionKey] || 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Family Units */}
            {statusReport.family_units && (
              <div className="mt-6 pt-6 border-t border-navy-200">
                <h4 className="text-sm font-semibold text-navy-900 mb-3">Family Units</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {statusReport.family_units.us !== undefined && (
                    <div>
                      <div className="text-xs text-navy-600 mb-1">US</div>
                      <div className="text-lg font-bold text-navy-900">{statusReport.family_units.us}</div>
                    </div>
                  )}
                  {statusReport.family_units.canada !== undefined && (
                    <div>
                      <div className="text-xs text-navy-600 mb-1">Canada</div>
                      <div className="text-lg font-bold text-navy-900">{statusReport.family_units.canada}</div>
                    </div>
                  )}
                  {statusReport.family_units.intl !== undefined && (
                    <div>
                      <div className="text-xs text-navy-600 mb-1">International</div>
                      <div className="text-lg font-bold text-navy-900">{statusReport.family_units.intl}</div>
                    </div>
                  )}
                  {statusReport.family_units.total !== undefined && (
                    <div>
                      <div className="text-xs text-navy-600 mb-1">Total</div>
                      <div className="text-lg font-bold text-navy-900">{statusReport.family_units.total}</div>
                    </div>
                  )}
                </div>
                {statusReport.family_units.limit && (
                  <div className="mt-4 p-3 bg-navy-50 rounded-lg">
                    <div className="text-xs text-navy-600 mb-1">Family Unit Limit ({statusReport.family_units.limit_type || 'Regular'})</div>
                    <div className="text-xl font-bold text-navy-900">{statusReport.family_units.limit}</div>
                  </div>
                )}
              </div>
            )}

            {/* Advisories */}
            {statusReport.advisories && (
              <div className="mt-6 pt-6 border-t border-navy-200">
                <h4 className="text-sm font-semibold text-navy-900 mb-2">Advisories</h4>
                <div className="text-sm text-navy-900">{statusReport.advisories}</div>
              </div>
            )}

            {/* Canadian Sibling Status */}
            {statusReport.canadian_sibling_status && (
              <div className="mt-6 pt-6 border-t border-navy-200">
                <h4 className="text-sm font-semibold text-navy-900 mb-3">Canadian Sibling Only Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {statusReport.canadian_sibling_status.pregnancies !== undefined && (
                    <div>
                      <div className="text-xs text-navy-600 mb-1">Pregnancies</div>
                      <div className="text-lg font-bold text-navy-900">{statusReport.canadian_sibling_status.pregnancies}</div>
                    </div>
                  )}
                  {statusReport.canadian_sibling_status.births !== undefined && (
                    <div>
                      <div className="text-xs text-navy-600 mb-1">Births</div>
                      <div className="text-lg font-bold text-navy-900">{statusReport.canadian_sibling_status.births}</div>
                    </div>
                  )}
                  {statusReport.canadian_sibling_status.total_combined !== undefined && (
                    <div>
                      <div className="text-xs text-navy-600 mb-1">Total Combined</div>
                      <div className="text-lg font-bold text-navy-900">{statusReport.canadian_sibling_status.total_combined}</div>
                    </div>
                  )}
                  {statusReport.canadian_sibling_status.is_sibling_only !== undefined && (
                    <div>
                      <div className="text-xs text-navy-600 mb-1">Sibling Only</div>
                      <div className={`text-lg font-bold ${statusReport.canadian_sibling_status.is_sibling_only ? 'text-orange-600' : 'text-green-600'}`}>
                        {statusReport.canadian_sibling_status.is_sibling_only ? 'Yes' : 'No'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Birth Limit Category */}
            {statusReport.birth_limit_category && (
              <div className="mt-6 pt-6 border-t border-navy-200">
                <h4 className="text-sm font-semibold text-navy-900 mb-2">Birth Limit Category</h4>
                <div className="text-sm text-navy-900 font-medium">{statusReport.birth_limit_category}</div>
              </div>
            )}

            {/* Totals from Donor Testing and Sage */}
            {(statusReport.total_units_donor_testing !== undefined || statusReport.total_units_sage !== undefined) && (
              <div className="mt-6 pt-6 border-t border-navy-200">
                <h4 className="text-sm font-semibold text-navy-900 mb-3">Total Units Ever Created</h4>
                <div className="grid grid-cols-2 gap-4">
                  {statusReport.total_units_donor_testing !== undefined && (
                    <div>
                      <div className="text-xs text-navy-600 mb-1">Donor Testing</div>
                      <div className="text-lg font-bold text-navy-900">{statusReport.total_units_donor_testing}</div>
                    </div>
                  )}
                  {statusReport.total_units_sage !== undefined && (
                    <div>
                      <div className="text-xs text-navy-600 mb-1">Sage</div>
                      <div className="text-lg font-bold text-navy-900">{statusReport.total_units_sage}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        );
      })()}
      </Section>

      <Section id="purchase" title="Purchase Options">
        <div className="space-y-2">
          <InfoRow
            label="Audio File Available"
            value={donor.audio_file_available ? "Yes" : "No"}
          />
          <InfoRow
            label="Photos Available"
            value={donor.photos_available ? "Yes" : "No"}
          />
          <InfoRow label="Inventory Summary" value={donor.inventory_summary} />
          {donor.vial_options && (
            <div>
              <div className="text-sm font-medium text-navy-700 mb-2">
                Vial Options:
              </div>
              <pre className="bg-navy-50 p-4 rounded-lg text-xs overflow-x-auto font-mono">
                {formatJson(donor.vial_options)}
              </pre>
            </div>
          )}
          {donor.compliance_flags && !('inventory_data' in donor.compliance_flags) && (
            <div>
              <div className="text-sm font-medium text-navy-700 mb-2">
                Compliance Flags:
              </div>
              <pre className="bg-navy-50 p-4 rounded-lg text-xs overflow-x-auto font-mono">
                {formatJson(donor.compliance_flags)}
              </pre>
            </div>
          )}
        </div>
      </Section>

      <Section id="metadata" title="Metadata">
        <div className="space-y-2">
          <InfoRow label="Document ID" value={donor.document_id} />
          <InfoRow label="Source URL" value={donor.source_url} />
          <InfoRow
            label="Created At"
            value={formatDate(donor.created_at)}
          />
          <InfoRow
            label="Updated At"
            value={formatDate(donor.updated_at)}
          />
        </div>
      </Section>
    </div>
  );
}
