import React from 'react';

/**
 * Utility functions to format JSON data from marketing donors into readable display components
 */

/**
 * Format genetic test results into a readable table/list
 */
export function formatGeneticTestResults(
  results: Record<string, any> | null | undefined
): React.ReactNode {
  if (!results || typeof results !== 'object' || Object.keys(results).length === 0) {
    return <span className="text-navy-600 italic">No genetic test results available</span>;
  }

  const entries = Object.entries(results);
  if (entries.length === 0) {
    return <span className="text-navy-600 italic">No genetic test results available</span>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([condition, status]) => (
        <div key={condition} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
          <span className="text-sm font-medium text-navy-900">{condition}</span>
          <span className="text-sm text-green-700 font-semibold">
            {status === 'negative' || status === false ? 'Negative' : String(status)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Format health info into key-value pairs
 */
export function formatHealthInfo(
  healthInfo: Record<string, any> | null | undefined
): React.ReactNode {
  if (!healthInfo || typeof healthInfo !== 'object' || Object.keys(healthInfo).length === 0) {
    return <span className="text-navy-600 italic">No health information available</span>;
  }

  const entries = Object.entries(healthInfo);
  if (entries.length === 0) {
    return <span className="text-navy-600 italic">No health information available</span>;
  }

  // Convert snake_case keys to readable labels
  const formatLabel = (key: string): string => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {entries.map(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          return null;
        }
        return (
          <div key={key} className="flex items-start justify-between p-3 bg-navy-50 rounded border border-navy-200">
            <span className="text-sm font-medium text-navy-700">{formatLabel(key)}:</span>
            <span className="text-sm text-navy-900 text-right ml-4">{String(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Format education details into structured sections
 */
export function formatEducationDetails(
  educationDetails: Record<string, any> | null | undefined
): React.ReactNode {
  if (!educationDetails || typeof educationDetails !== 'object' || Object.keys(educationDetails).length === 0) {
    return <span className="text-navy-600 italic">No education details available</span>;
  }

  const formatLabel = (key: string): string => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-4">
      {/* Undergraduate Section */}
      {(educationDetails.has_undergraduate || educationDetails.degree_earned || educationDetails.major) && (
        <div className="border border-navy-200 rounded-lg p-4 bg-navy-50">
          <h4 className="text-sm font-semibold text-navy-900 mb-3">Undergraduate Education</h4>
          <div className="space-y-2">
            {educationDetails.has_undergraduate !== undefined && (
              <div className="flex justify-between">
                <span className="text-sm text-navy-700">Has Undergraduate Degree:</span>
                <span className="text-sm text-navy-900">{educationDetails.has_undergraduate ? 'Yes' : 'No'}</span>
              </div>
            )}
            {educationDetails.degree_earned && (
              <div className="flex justify-between">
                <span className="text-sm text-navy-700">Degree:</span>
                <span className="text-sm text-navy-900">{String(educationDetails.degree_earned)}</span>
              </div>
            )}
            {educationDetails.degree_status && (
              <div className="flex justify-between">
                <span className="text-sm text-navy-700">Status:</span>
                <span className="text-sm text-navy-900">{String(educationDetails.degree_status)}</span>
              </div>
            )}
            {educationDetails.major && (
              <div className="flex justify-between">
                <span className="text-sm text-navy-700">Major:</span>
                <span className="text-sm text-navy-900">{String(educationDetails.major)}</span>
              </div>
            )}
            {educationDetails.minor && (
              <div className="flex justify-between">
                <span className="text-sm text-navy-700">Minor:</span>
                <span className="text-sm text-navy-900">{String(educationDetails.minor)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Graduate Section */}
      {(educationDetails.has_graduate || educationDetails.graduate_degree) && (
        <div className="border border-navy-200 rounded-lg p-4 bg-navy-50">
          <h4 className="text-sm font-semibold text-navy-900 mb-3">Graduate Education</h4>
          <div className="space-y-2">
            {educationDetails.has_graduate !== undefined && (
              <div className="flex justify-between">
                <span className="text-sm text-navy-700">Has Graduate Degree:</span>
                <span className="text-sm text-navy-900">{educationDetails.has_graduate ? 'Yes' : 'No'}</span>
              </div>
            )}
            {educationDetails.graduate_degree && (
              <div className="flex justify-between">
                <span className="text-sm text-navy-700">Degree:</span>
                <span className="text-sm text-navy-900">{String(educationDetails.graduate_degree)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other Fields */}
      {(educationDetails.in_school !== undefined || educationDetails.has_specialized_training !== undefined) && (
        <div className="space-y-2">
          {educationDetails.in_school !== undefined && (
            <div className="flex justify-between p-2 bg-navy-50 rounded">
              <span className="text-sm text-navy-700">Currently In School:</span>
              <span className="text-sm text-navy-900">{educationDetails.in_school ? 'Yes' : 'No'}</span>
            </div>
          )}
          {educationDetails.has_specialized_training !== undefined && (
            <div className="flex justify-between p-2 bg-navy-50 rounded">
              <span className="text-sm text-navy-700">Has Specialized Training:</span>
              <span className="text-sm text-navy-900">{educationDetails.has_specialized_training ? 'Yes' : 'No'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Format family history into organized tables
 */
export function formatFamilyHistory(
  familyHistory: Record<string, any> | null | undefined,
  title: string
): React.ReactNode {
  if (!familyHistory || typeof familyHistory !== 'object' || Object.keys(familyHistory).length === 0) {
    return <span className="text-navy-600 italic">No {title.toLowerCase()} history available</span>;
  }

  const entries = Object.entries(familyHistory);
  if (entries.length === 0) {
    return <span className="text-navy-600 italic">No {title.toLowerCase()} history available</span>;
  }

  return (
    <div className="border border-navy-200 rounded-lg overflow-hidden">
      <div className="bg-navy-100 px-4 py-2">
        <h4 className="text-sm font-semibold text-navy-900">{title}</h4>
      </div>
      <div className="divide-y divide-navy-200">
        {entries.map(([memberType, memberData]) => {
          if (!memberData || typeof memberData !== 'object') {
            return null;
          }
          const memberEntries = Object.entries(memberData);
          if (memberEntries.length === 0) {
            return null;
          }
          return (
            <div key={memberType} className="p-4">
              <div className="font-medium text-navy-900 mb-2 capitalize">{memberType}</div>
              <div className="space-y-1 ml-4">
                {memberEntries.map(([key, value]) => {
                  if (value === null || value === undefined || value === '') {
                    return null;
                  }
                  const formatLabel = (k: string): string => {
                    return k
                      .split('_')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                  };
                  return (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-navy-600">{formatLabel(key)}:</span>
                      <span className="text-navy-900 font-medium">{String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Format health diseases into a structured table
 */
export function formatHealthDiseases(
  healthDiseases: Record<string, any> | null | undefined
): React.ReactNode {
  if (!healthDiseases || typeof healthDiseases !== 'object' || Object.keys(healthDiseases).length === 0) {
    return <span className="text-navy-600 italic">No health disease information available</span>;
  }

  const entries = Object.entries(healthDiseases);
  if (entries.length === 0) {
    return <span className="text-navy-600 italic">No health disease information available</span>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-navy-100">
            <th className="px-4 py-2 text-left text-xs font-medium text-navy-700 border border-navy-200">Condition</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-navy-700 border border-navy-200">Relative</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-navy-700 border border-navy-200">Father's Side</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-navy-700 border border-navy-200">Mother's Side</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-navy-700 border border-navy-200">Age of Onset</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-200">
          {entries.map(([condition, data]) => {
            if (!data || typeof data !== 'object') {
              return null;
            }
            return (
              <tr key={condition} className="hover:bg-navy-50">
                <td className="px-4 py-2 border border-navy-200 font-medium text-navy-900">{condition}</td>
                <td className="px-4 py-2 border border-navy-200 text-navy-700">{String(data.relative || 'N/A')}</td>
                <td className="px-4 py-2 border border-navy-200 text-center">
                  {data.father_side ? (
                    <span className="text-red-600 font-semibold">Yes</span>
                  ) : (
                    <span className="text-navy-400">No</span>
                  )}
                </td>
                <td className="px-4 py-2 border border-navy-200 text-center">
                  {data.mother_side ? (
                    <span className="text-red-600 font-semibold">Yes</span>
                  ) : (
                    <span className="text-navy-400">No</span>
                  )}
                </td>
                <td className="px-4 py-2 border border-navy-200 text-navy-700">{String(data.age_of_onset || 'N/A')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Calculate age from year of birth
 */
export function calculateAge(yearOfBirth: number | null | undefined): number | null {
  if (!yearOfBirth || yearOfBirth < 1900 || yearOfBirth > new Date().getFullYear()) {
    return null;
  }
  const currentYear = new Date().getFullYear();
  return currentYear - yearOfBirth;
}
