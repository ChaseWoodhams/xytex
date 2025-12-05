"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CorporateAccount, AccountStatus } from "@/lib/supabase/types";
import { Loader2 } from "lucide-react";

interface AccountFormProps {
  account?: CorporateAccount;
}

export default function AccountForm({ account }: AccountFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: account?.name || "",
    website: account?.website || "",
    industry: account?.industry || "",
    annual_revenue: account?.annual_revenue?.toString() || "",
    employee_count: account?.employee_count?.toString() || "",
    status: account?.status || ("active" as AccountStatus),
    primary_contact_name: account?.primary_contact_name || "",
    primary_contact_email: account?.primary_contact_email || "",
    primary_contact_phone: account?.primary_contact_phone || "",
    notes: account?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
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

      {account?.code && (
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            Account Code
          </label>
          <div className="px-4 py-2 bg-cream-50 border border-navy-200 rounded-lg">
            <span className="font-mono text-sm font-semibold text-gold-600">
              {account.code}
            </span>
          </div>
          <p className="mt-1 text-xs text-navy-500">
            This code is automatically generated and cannot be changed.
          </p>
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

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-navy-700 mb-2">
            Website
          </label>
          <input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
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

