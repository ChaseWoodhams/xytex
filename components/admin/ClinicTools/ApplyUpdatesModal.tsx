"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2 } from "lucide-react";
import type { LocationScrapingResult, Location } from "@/lib/supabase/types";

interface ApplyUpdatesModalProps {
  result: LocationScrapingResult;
  locationId: string;
  onClose: () => void;
  onApply: (fields: string[]) => Promise<void>;
}

export default function ApplyUpdatesModal({
  result,
  locationId,
  onClose,
  onApply,
}: ApplyUpdatesModalProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    loadLocation();
  }, [locationId]);

  const loadLocation = async () => {
    try {
      const response = await fetch(`/api/admin/locations/${locationId}`);
      if (response.ok) {
        const data = await response.json();
        setLocation(data);
      }
    } catch (error) {
      console.error("Error loading location:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const availableFields = [
    { key: "address_line1", label: "Address Line 1", hasValue: !!result.address_line1 },
    { key: "address_line2", label: "Address Line 2", hasValue: !!result.address_line2 },
    { key: "city", label: "City", hasValue: !!result.city },
    { key: "state", label: "State", hasValue: !!result.state },
    { key: "zip_code", label: "Zip Code", hasValue: !!result.zip_code },
    { key: "country", label: "Country", hasValue: !!result.country },
    { key: "phone", label: "Phone", hasValue: !!result.phone },
    { key: "email", label: "Email", hasValue: !!result.email },
    { key: "employees", label: "Employees (as contacts)", hasValue: result.employees && result.employees.length > 0 },
  ].filter((field) => field.hasValue);

  const toggleField = (fieldKey: string) => {
    if (selectedFields.includes(fieldKey)) {
      setSelectedFields(selectedFields.filter((f) => f !== fieldKey));
    } else {
      setSelectedFields([...selectedFields, fieldKey]);
    }
  };

  const handleApply = async () => {
    if (selectedFields.length === 0) {
      alert("Please select at least one field to update");
      return;
    }

    setIsApplying(true);
    try {
      await onApply(selectedFields);
    } finally {
      setIsApplying(false);
    }
  };

  const getFieldValue = (key: string): string => {
    switch (key) {
      case "address_line1":
        return result.address_line1 || "";
      case "address_line2":
        return result.address_line2 || "";
      case "city":
        return result.city || "";
      case "state":
        return result.state || "";
      case "zip_code":
        return result.zip_code || "";
      case "country":
        return result.country || "";
      case "phone":
        return result.phone || "";
      case "email":
        return result.email || "";
      case "employees":
        return `${result.employees?.length || 0} employees`;
      default:
        return "";
    }
  };

  const getCurrentValue = (key: string): string => {
    if (!location) return "N/A";
    switch (key) {
      case "address_line1":
        return location.address_line1 || "";
      case "address_line2":
        return location.address_line2 || "";
      case "city":
        return location.city || "";
      case "state":
        return location.state || "";
      case "zip_code":
        return location.zip_code || "";
      case "country":
        return location.country || "";
      case "phone":
        return location.phone || "";
      case "email":
        return location.email || "";
      case "employees":
        return "N/A"; // Would need to fetch contacts
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-navy-200">
          <h2 className="text-xl font-heading font-semibold text-navy-900">
            Apply Scraped Updates
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-navy-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <p className="text-sm text-navy-600">
              Select which fields to update for <strong>{location?.name}</strong>
            </p>
          </div>

          <div className="space-y-3">
            {availableFields.map((field) => {
              const isSelected = selectedFields.includes(field.key);
              const newValue = getFieldValue(field.key);
              const currentValue = getCurrentValue(field.key);

              return (
                <div
                  key={field.key}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-gold-500 bg-gold-50"
                      : "border-navy-200 hover:border-navy-300"
                  }`}
                  onClick={() => toggleField(field.key)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleField(field.key)}
                      className="mt-1 w-4 h-4 text-gold-600 border-navy-300 rounded focus:ring-gold-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <label className="font-medium text-navy-900 cursor-pointer">
                          {field.label}
                        </label>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-gold-600" />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-navy-500 mb-1">Current:</p>
                          <p className="text-navy-700 bg-navy-50 p-2 rounded">
                            {currentValue || <span className="text-navy-400">Empty</span>}
                          </p>
                        </div>
                        <div>
                          <p className="text-navy-500 mb-1">New:</p>
                          <p className="text-gold-700 bg-gold-50 p-2 rounded font-medium">
                            {newValue}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-navy-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-navy-700 border border-navy-300 rounded-lg hover:bg-navy-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isApplying || selectedFields.length === 0}
            className="px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? "Applying..." : `Apply ${selectedFields.length} Update${selectedFields.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
