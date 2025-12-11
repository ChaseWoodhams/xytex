"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Account, AccountStatus, AccountType } from "@/lib/supabase/types";
import { Loader2 } from "lucide-react";
import { STATES_AND_PROVINCES, COUNTRY_CODES, INDUSTRIES } from "@/lib/utils/form-data";

interface AccountFormProps {
  account?: Account;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Determine initial values for dropdowns
  const initialIndustry = account?.industry || "";
  const initialState = account?.udf_state || "";
  const initialCountryCode = account?.udf_country_code || "";
  
  // Check if initial values are in dropdown options, otherwise use "other" with custom value
  const industryInOptions = INDUSTRIES.some(i => i.value === initialIndustry);
  const stateInOptions = STATES_AND_PROVINCES.some(s => s.value === initialState);
  const countryInOptions = COUNTRY_CODES.some(c => c.value === initialCountryCode);
  
  const [formData, setFormData] = useState({
    name: account?.name || "",
    website: account?.website || "",
    industry: industryInOptions ? initialIndustry : (initialIndustry ? "other" : ""),
    industryOther: industryInOptions ? "" : initialIndustry,
    annual_revenue: account?.annual_revenue?.toString() || "",
    employee_count: account?.employee_count?.toString() || "",
    status: account?.status || ("active" as AccountStatus),
    account_type: account?.account_type || ("single_location" as AccountType),
    primary_contact_name: account?.primary_contact_name || "",
    primary_contact_email: account?.primary_contact_email || "",
    primary_contact_phone: account?.primary_contact_phone || "",
    notes: account?.notes || (account?.udf_notes || ""), // Consolidate notes
    sage_code: account?.sage_code || "",
    // For single location: clinic name = account name (no duplication)
    // For multi location: clinic name is separate (first location's name)
    udf_clinic_name: account?.account_type === 'single_location' 
      ? (account?.name || "") // Single location: use account name
      : (account?.udf_clinic_name || ""), // Multi location: use stored clinic name
    udf_shipto_name: account?.udf_shipto_name || "",
    udf_address_line1: account?.udf_address_line1 || "",
    udf_address_line2: account?.udf_address_line2 || "",
    udf_address_line3: account?.udf_address_line3 || "",
    udf_city: account?.udf_city || "",
    udf_state: stateInOptions ? initialState : (initialState ? "OTHER" : ""),
    udf_stateOther: stateInOptions ? "" : initialState,
    udf_zipcode: account?.udf_zipcode || "",
    udf_fax: account?.udf_fax || "",
    udf_country_code: countryInOptions ? initialCountryCode : (initialCountryCode ? "OTHER" : ""),
    udf_country_codeOther: countryInOptions ? "" : initialCountryCode,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Normalize website URL - add https:// if missing but value provided
      let website = formData.website?.trim() || null;
      if (website && !website.match(/^https?:\/\//i)) {
        website = `https://${website}`;
      }
      // Set to null if empty string
      if (website === '') {
        website = null;
      }

      // Handle "Other" options - use the custom value if "other" is selected
      const industry = formData.industry === "other" ? formData.industryOther : formData.industry;
      const state = formData.udf_state === "OTHER" ? formData.udf_stateOther : formData.udf_state;
      const countryCode = formData.udf_country_code === "OTHER" || (formData.udf_country_code === "" && formData.udf_country_codeOther)
        ? formData.udf_country_codeOther 
        : formData.udf_country_code;

      // For single-location accounts, clinic name = account name (no duplication)
      // For multi-location accounts, clinic name is separate (first location's name)
      const clinicName = formData.account_type === 'single_location' 
        ? formData.name  // Single location: clinic name = account name
        : (formData.udf_clinic_name || null); // Multi-location: use provided clinic name

      const payload = {
        name: formData.name,
        website,
        industry: industry || null,
        annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null,
        employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
        status: formData.status,
        account_type: formData.account_type,
        primary_contact_name: formData.primary_contact_name || null,
        primary_contact_email: formData.primary_contact_email || null,
        primary_contact_phone: formData.primary_contact_phone || null,
        notes: formData.notes || null,
        sage_code: formData.sage_code || null,
        udf_clinic_name: clinicName,
        udf_shipto_name: formData.udf_shipto_name || null,
        udf_address_line1: formData.udf_address_line1 || null,
        udf_address_line2: formData.udf_address_line2 || null,
        udf_address_line3: formData.udf_address_line3 || null,
        udf_city: formData.udf_city || null,
        udf_state: state || null,
        udf_zipcode: formData.udf_zipcode || null,
        udf_fax: formData.udf_fax || null,
        udf_country_code: countryCode || null,
        // Note: udf_phone, udf_email, and udf_notes are removed (consolidated)
      };

      const url = account
        ? `/api/admin/accounts/${account.id}`
        : "/api/admin/accounts";
      const method = account ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save account");
      }

      const data = await response.json();
      
      // If onSuccess callback is provided, call it (for inline editing)
      // Otherwise, navigate to the accounts list (for new accounts) so user can see the new account
      if (onSuccess) {
        onSuccess();
        router.refresh(); // Refresh after callback
      } else {
        // For new accounts, navigate to accounts list
        // The page is configured with dynamic rendering, so it will automatically fetch fresh data
        router.push('/admin/accounts');
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Section 1: Basic Information */}
      <div>
        <h3 className="text-lg font-heading font-semibold text-navy-900 mb-4">
          Basic Information
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-navy-700 mb-2">
              Account Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

          {!account && (
            <div>
              <label htmlFor="account_type" className="block text-sm font-medium text-navy-700 mb-2">
                Account Type *
              </label>
              <select
                id="account_type"
                required
                value={formData.account_type}
                onChange={(e) => {
                  const newAccountType = e.target.value as AccountType;
                  // When switching account types, update clinic name accordingly
                  const updatedClinicName = newAccountType === 'single_location' 
                    ? formData.name  // Single location: clinic name = account name
                    : formData.udf_clinic_name; // Multi location: keep existing or empty
                  
                  setFormData({ 
                    ...formData, 
                    account_type: newAccountType,
                    udf_clinic_name: updatedClinicName
                  });
                }}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
              >
                <option value="single_location">Single Location</option>
                <option value="multi_location">Multi Location</option>
              </select>
              <p className="mt-1 text-xs text-navy-500">
                Select whether this account will have one location or multiple locations
              </p>
            </div>
          )}

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-navy-700 mb-2">
              Website
            </label>
            <input
              id="website"
              type="text"
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
            <p className="mt-1 text-xs text-navy-500">
              Optional - Include http:// or https://
            </p>
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-navy-700 mb-2">
              Industry
            </label>
            <select
              id="industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value, industryOther: "" })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            >
              <option value="">Select an industry...</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry.value} value={industry.value}>
                  {industry.label}
                </option>
              ))}
            </select>
            {formData.industry === "other" && (
              <input
                type="text"
                placeholder="Specify industry..."
                value={formData.industryOther}
                onChange={(e) => setFormData({ ...formData, industryOther: e.target.value })}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none mt-2"
              />
            )}
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-navy-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as AccountStatus })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Primary Contact */}
      <div className="border-t border-navy-200 pt-6">
        <h3 className="text-lg font-heading font-semibold text-navy-900 mb-4">
          Primary Contact
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="primary_contact_name" className="block text-sm font-medium text-navy-700 mb-2">
              Contact Name
            </label>
            <input
              id="primary_contact_name"
              type="text"
              value={formData.primary_contact_name}
              onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="primary_contact_email" className="block text-sm font-medium text-navy-700 mb-2">
              Contact Email
            </label>
            <input
              id="primary_contact_email"
              type="email"
              value={formData.primary_contact_email}
              onChange={(e) => setFormData({ ...formData, primary_contact_email: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="primary_contact_phone" className="block text-sm font-medium text-navy-700 mb-2">
              Contact Phone
            </label>
            <input
              id="primary_contact_phone"
              type="tel"
              value={formData.primary_contact_phone}
              onChange={(e) => setFormData({ ...formData, primary_contact_phone: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Address Information */}
      <div className="border-t border-navy-200 pt-6">
        <h3 className="text-lg font-heading font-semibold text-navy-900 mb-4">
          Address Information
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="udf_address_line1" className="block text-sm font-medium text-navy-700 mb-2">
              Address Line 1
            </label>
            <input
              id="udf_address_line1"
              type="text"
              value={formData.udf_address_line1}
              onChange={(e) => setFormData({ ...formData, udf_address_line1: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="udf_address_line2" className="block text-sm font-medium text-navy-700 mb-2">
              Address Line 2
            </label>
            <input
              id="udf_address_line2"
              type="text"
              value={formData.udf_address_line2}
              onChange={(e) => setFormData({ ...formData, udf_address_line2: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="udf_address_line3" className="block text-sm font-medium text-navy-700 mb-2">
              Address Line 3
            </label>
            <input
              id="udf_address_line3"
              type="text"
              value={formData.udf_address_line3}
              onChange={(e) => setFormData({ ...formData, udf_address_line3: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="udf_city" className="block text-sm font-medium text-navy-700 mb-2">
              City
            </label>
            <input
              id="udf_city"
              type="text"
              value={formData.udf_city}
              onChange={(e) => setFormData({ ...formData, udf_city: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="udf_state" className="block text-sm font-medium text-navy-700 mb-2">
              State / Province
            </label>
            <select
              id="udf_state"
              value={formData.udf_state}
              onChange={(e) => setFormData({ ...formData, udf_state: e.target.value, udf_stateOther: "" })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            >
              <option value="">Select state/province...</option>
              <optgroup label="US States">
                {STATES_AND_PROVINCES.filter(s => s.category === 'US State').map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Canadian Provinces">
                {STATES_AND_PROVINCES.filter(s => s.category === 'Canadian Province').map((province) => (
                  <option key={province.value} value={province.value}>
                    {province.label}
                  </option>
                ))}
              </optgroup>
              <option value="OTHER">Other</option>
            </select>
            {formData.udf_state === "OTHER" && (
              <input
                type="text"
                placeholder="Enter state/province..."
                value={formData.udf_stateOther}
                onChange={(e) => setFormData({ ...formData, udf_stateOther: e.target.value })}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none mt-2"
              />
            )}
          </div>

          <div>
            <label htmlFor="udf_zipcode" className="block text-sm font-medium text-navy-700 mb-2">
              Zipcode / Postal Code
            </label>
            <input
              id="udf_zipcode"
              type="text"
              value={formData.udf_zipcode}
              onChange={(e) => setFormData({ ...formData, udf_zipcode: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="udf_country_code" className="block text-sm font-medium text-navy-700 mb-2">
              Country Code
            </label>
            <select
              id="udf_country_code"
              value={formData.udf_country_code}
              onChange={(e) => {
                if (e.target.value === "OTHER") {
                  setFormData({ ...formData, udf_country_code: "OTHER", udf_country_codeOther: formData.udf_country_codeOther || "" });
                } else {
                  setFormData({ ...formData, udf_country_code: e.target.value, udf_country_codeOther: "" });
                }
              }}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            >
              <option value="">Select country...</option>
              {COUNTRY_CODES.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
              <option value="OTHER">Other</option>
            </select>
            {formData.udf_country_code === "OTHER" && (
              <input
                type="text"
                placeholder="Enter country code (e.g., XX)"
                value={formData.udf_country_codeOther}
                onChange={(e) => setFormData({ ...formData, udf_country_codeOther: e.target.value })}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none mt-2"
              />
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Additional Details */}
      <div className="border-t border-navy-200 pt-6">
        <h3 className="text-lg font-heading font-semibold text-navy-900 mb-4">
          Additional Details
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="sage_code" className="block text-sm font-medium text-navy-700 mb-2">
              Sage Code
            </label>
            <input
              id="sage_code"
              type="text"
              value={formData.sage_code}
              onChange={(e) => setFormData({ ...formData, sage_code: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
              placeholder="Enter Sage code..."
            />
          </div>

          {/* Clinic Name - Only show for multi-location accounts */}
          {formData.account_type === 'multi_location' && (
            <div>
              <label htmlFor="udf_clinic_name" className="block text-sm font-medium text-navy-700 mb-2">
                Clinic Name
              </label>
              <input
                id="udf_clinic_name"
                type="text"
                value={formData.udf_clinic_name}
                onChange={(e) => setFormData({ ...formData, udf_clinic_name: e.target.value })}
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
                placeholder="Enter clinic name (first location name)"
              />
              <p className="mt-1 text-xs text-navy-500">
                For multi-location accounts, this should be the first location's clinic name
              </p>
            </div>
          )}

          <div>
            <label htmlFor="udf_shipto_name" className="block text-sm font-medium text-navy-700 mb-2">
              Ship To Name
            </label>
            <input
              id="udf_shipto_name"
              type="text"
              value={formData.udf_shipto_name}
              onChange={(e) => setFormData({ ...formData, udf_shipto_name: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="annual_revenue" className="block text-sm font-medium text-navy-700 mb-2">
              Annual Revenue
            </label>
            <input
              id="annual_revenue"
              type="number"
              step="0.01"
              value={formData.annual_revenue}
              onChange={(e) => setFormData({ ...formData, annual_revenue: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="employee_count" className="block text-sm font-medium text-navy-700 mb-2">
              Employee Count
            </label>
            <input
              id="employee_count"
              type="number"
              value={formData.employee_count}
              onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="udf_fax" className="block text-sm font-medium text-navy-700 mb-2">
              Fax
            </label>
            <input
              id="udf_fax"
              type="tel"
              value={formData.udf_fax}
              onChange={(e) => setFormData({ ...formData, udf_fax: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section 5: Notes */}
      <div className="border-t border-navy-200 pt-6">
        <h3 className="text-lg font-heading font-semibold text-navy-900 mb-4">
          Notes
        </h3>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-navy-700 mb-2">
            Account Notes
          </label>
          <textarea
            id="notes"
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            placeholder="Enter any additional notes about this account..."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            account ? "Update Account" : "Create Account"
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            if (onCancel) {
              onCancel();
            } else {
              router.back();
            }
          }}
          className="btn btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
