"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, Filter, RotateCcw } from "lucide-react";

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  type: "checkbox" | "range";
}

const filterGroups: FilterGroup[] = [
  {
    id: "ethnicity",
    label: "Ethnicity",
    type: "checkbox",
    options: [
      { label: "Caucasian", value: "caucasian" },
      { label: "African American", value: "african-american" },
      { label: "Hispanic/Latino", value: "hispanic" },
      { label: "Asian", value: "asian" },
      { label: "Middle Eastern", value: "middle-eastern" },
      { label: "Mixed", value: "mixed" },
    ],
  },
  {
    id: "hairColor",
    label: "Hair Color",
    type: "checkbox",
    options: [
      { label: "Black", value: "black" },
      { label: "Brown", value: "brown" },
      { label: "Blonde", value: "blonde" },
      { label: "Red", value: "red" },
    ],
  },
  {
    id: "eyeColor",
    label: "Eye Color",
    type: "checkbox",
    options: [
      { label: "Brown", value: "brown" },
      { label: "Blue", value: "blue" },
      { label: "Green", value: "green" },
      { label: "Hazel", value: "hazel" },
    ],
  },
  {
    id: "height",
    label: "Height",
    type: "checkbox",
    options: [
      { label: "Under 5'8\"", value: "under-68" },
      { label: "5'8\" - 5'11\"", value: "68-71" },
      { label: "6'0\" - 6'2\"", value: "72-74" },
      { label: "Over 6'2\"", value: "over-74" },
    ],
  },
  {
    id: "cmvStatus",
    label: "CMV Status",
    type: "checkbox",
    options: [
      { label: "CMV Negative", value: "negative" },
      { label: "CMV Positive", value: "positive" },
    ],
  },
  {
    id: "availability",
    label: "Availability",
    type: "checkbox",
    options: [
      { label: "New Donors", value: "new" },
      { label: "Popular", value: "popular" },
      { label: "Exclusive", value: "exclusive" },
    ],
  },
];

interface DonorFiltersProps {
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filterId: string, values: string[]) => void;
  onClearAll: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function DonorFilters({
  selectedFilters,
  onFilterChange,
  onClearAll,
  isMobileOpen,
  onMobileClose,
}: DonorFiltersProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    filterGroups.map((g) => g.id)
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleOptionToggle = (groupId: string, value: string) => {
    const currentValues = selectedFilters[groupId] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    onFilterChange(groupId, newValues);
  };

  const totalFilters = Object.values(selectedFilters).flat().length;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-navy-100">
        <h3 className="text-lg font-heading font-semibold text-navy-900 flex items-center gap-2">
          <Filter className="w-5 h-5 text-gold-500" />
          Filters
          {totalFilters > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-gold-500 text-white text-xs font-medium rounded-full">
              {totalFilters}
            </span>
          )}
        </h3>
        {totalFilters > 0 && (
          <button
            onClick={onClearAll}
            className="text-sm text-gold-600 hover:text-gold-700 flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Filter Groups */}
      {filterGroups.map((group) => (
        <div key={group.id} className="border-b border-navy-100 pb-4">
          <button
            onClick={() => toggleGroup(group.id)}
            className="w-full flex items-center justify-between py-2 text-left"
          >
            <span className="font-medium text-navy-900">{group.label}</span>
            <ChevronDown
              className={`w-5 h-5 text-navy-400 transition-transform ${
                expandedGroups.includes(group.id) ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {expandedGroups.includes(group.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-2">
                  {group.options.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={(selectedFilters[group.id] || []).includes(
                          option.value
                        )}
                        onChange={() =>
                          handleOptionToggle(group.id, option.value)
                        }
                        className="w-4 h-4 rounded border-navy-300 text-gold-500 focus:ring-gold-500"
                      />
                      <span className="text-sm text-navy-700 group-hover:text-navy-900">
                        {option.label}
                      </span>
                      {option.count !== undefined && (
                        <span className="ml-auto text-xs text-navy-400">
                          ({option.count})
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-md">
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-navy-900/50 z-40 lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading font-semibold text-navy-900">
                    Filter Donors
                  </h2>
                  <button
                    onClick={onMobileClose}
                    className="p-2 hover:bg-cream-100 rounded-lg"
                  >
                    <X className="w-6 h-6 text-navy-600" />
                  </button>
                </div>
                <FilterContent />
                <button
                  onClick={onMobileClose}
                  className="w-full mt-6 btn btn-primary"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

