"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Account, DealStage, AccountStatus, AccountType } from "@/lib/supabase/types";
import { Loader2 } from "lucide-react";

interface AccountFormProps {
  account?: Account;
}

export default function AccountForm({ account }: AccountFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: account?.name || "",
    website: account?.website || "",
    industry: account?.industry || "",
    deal_stage: account?.deal_stage || ("prospect" as DealStage),
    annual_revenue: account?.annual_revenue?.toString() || "",
    employee_count: account?.employee_count?.toString() || "",
    status: account?.status || ("active" as AccountStatus),
    account_type: account?.account_type || ("single_location" as AccountType),
    primary_contact_name: account?.primary_contact_name || "",
    primary_contact_email: account?.primary_contact_email || "",
    primary_contact_phone: account?.primary_contact_phone || "",
    notes: account?.notes || "",
    udf_clinic_code: account?.udf_clinic_code || "",
    udf_clinic_name: account?.udf_clinic_name || "",
    udf_shipto_name: account?.udf_shipto_name || "",
    udf_address_line1: account?.udf_address_line1 || "",
    udf_address_line2: account?.udf_address_line2 || "",
    udf_address_line3: account?.udf_address_line3 || "",
    udf_city: account?.udf_city || "",
    udf_state: account?.udf_state || "",
    udf_zipcode: account?.udf_zipcode || "",
    udf_fax: account?.udf_fax || "",
    udf_notes: account?.udf_notes || "",
    udf_phone: account?.udf_phone || "",
    udf_email: account?.udf_email || "",
    udf_country_code: account?.udf_country_code || "",
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

      const payload = {
        ...formData,
        website,
        annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null,
        employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
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
      router.push(`/admin/accounts/${data.id}`);
      router.refresh();
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
              onChange={(e) => setFormData({ ...formData, account_type: e.target.value as AccountType })}
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
          <input
            id="industry"
            type="text"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>

        <div>
          <label htmlFor="deal_stage" className="block text-sm font-medium text-navy-700 mb-2">
            Deal Stage
          </label>
          <select
            id="deal_stage"
            value={formData.deal_stage}
            onChange={(e) => setFormData({ ...formData, deal_stage: e.target.value as DealStage })}
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          >
            <option value="prospect">Prospect</option>
            <option value="qualified">Qualified</option>
            <option value="negotiation">Negotiation</option>
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
          </select>
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

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-navy-700 mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          rows={4}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
        />
      </div>

      <div className="border-t border-navy-200 pt-6">
        <h3 className="text-lg font-heading font-semibold text-navy-900 mb-4">
          Additional Information
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="udf_clinic_code" className="block text-sm font-medium text-navy-700 mb-2">
              Clinic Code
            </label>
            <input
              id="udf_clinic_code"
              type="text"
              value={formData.udf_clinic_code}
              onChange={(e) => setFormData({ ...formData, udf_clinic_code: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

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
            />
          </div>

          <div>
            <label htmlFor="udf_shipto_name" className="block text-sm font-medium text-navy-700 mb-2">
              Shipto Name
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
            <label htmlFor="udf_country_code" className="block text-sm font-medium text-navy-700 mb-2">
              Country Code
            </label>
            <input
              id="udf_country_code"
              type="text"
              value={formData.udf_country_code}
              onChange={(e) => setFormData({ ...formData, udf_country_code: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-navy-200 pt-6">
        <h3 className="text-lg font-heading font-semibold text-navy-900 mb-4">
          Address Information
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
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
              State
            </label>
            <input
              id="udf_state"
              type="text"
              value={formData.udf_state}
              onChange={(e) => setFormData({ ...formData, udf_state: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="udf_zipcode" className="block text-sm font-medium text-navy-700 mb-2">
              Zipcode
            </label>
            <input
              id="udf_zipcode"
              type="text"
              value={formData.udf_zipcode}
              onChange={(e) => setFormData({ ...formData, udf_zipcode: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-navy-200 pt-6">
        <h3 className="text-lg font-heading font-semibold text-navy-900 mb-4">
          Contact Information
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="udf_phone" className="block text-sm font-medium text-navy-700 mb-2">
              Phone
            </label>
            <input
              id="udf_phone"
              type="tel"
              value={formData.udf_phone}
              onChange={(e) => setFormData({ ...formData, udf_phone: e.target.value })}
              className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="udf_email" className="block text-sm font-medium text-navy-700 mb-2">
              Email
            </label>
            <input
              id="udf_email"
              type="email"
              value={formData.udf_email}
              onChange={(e) => setFormData({ ...formData, udf_email: e.target.value })}
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

      <div>
        <label htmlFor="udf_notes" className="block text-sm font-medium text-navy-700 mb-2">
          Additional Notes
        </label>
        <textarea
          id="udf_notes"
          rows={4}
          value={formData.udf_notes}
          onChange={(e) => setFormData({ ...formData, udf_notes: e.target.value })}
          className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
        />
      </div>

      <div className="flex gap-4">
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
          onClick={() => router.back()}
          className="btn btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

