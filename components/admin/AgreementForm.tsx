"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Agreement, AgreementType, AgreementStatus } from "@/lib/supabase/types";
import { FileText } from "lucide-react";

interface AgreementFormProps {
  locationId: string;
  accountId: string;
  agreement?: Agreement;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AgreementForm({
  locationId,
  accountId,
  agreement,
  onSuccess,
  onCancel,
}: AgreementFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    agreement_type: (agreement?.agreement_type || "partnership") as AgreementType,
    title: agreement?.title || "",
    start_date: agreement?.start_date || "",
    end_date: agreement?.end_date || "",
    terms: agreement?.terms || "",
    revenue_share_percentage: agreement?.revenue_share_percentage?.toString() || "",
    monthly_fee: agreement?.monthly_fee?.toString() || "",
    status: (agreement?.status || "draft") as AgreementStatus,
    notes: agreement?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = agreement
        ? `/api/admin/agreements/${agreement.id}`
        : "/api/admin/agreements";
      const method = agreement ? "PATCH" : "POST";

      const requestBody: any = {
        location_id: locationId,
        account_id: accountId,
        agreement_type: formData.agreement_type,
        title: formData.title,
        status: formData.status,
      };

      // Add optional fields only if they have values
      if (formData.start_date) {
        requestBody.start_date = formData.start_date;
      }
      if (formData.end_date) {
        requestBody.end_date = formData.end_date;
      }
      if (formData.terms) {
        requestBody.terms = formData.terms;
      }
      if (formData.revenue_share_percentage) {
        requestBody.revenue_share_percentage = parseFloat(formData.revenue_share_percentage);
      }
      if (formData.monthly_fee) {
        requestBody.monthly_fee = parseFloat(formData.monthly_fee);
      }
      if (formData.notes) {
        requestBody.notes = formData.notes;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save agreement");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Agreement Title *
          </label>
          <input
            id="title"
            type="text"
            required
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            placeholder="e.g., Partnership Agreement"
          />
        </div>

        <div>
          <label
            htmlFor="agreement_type"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Agreement Type *
          </label>
          <select
            id="agreement_type"
            required
            value={formData.agreement_type}
            onChange={(e) =>
              setFormData({
                ...formData,
                agreement_type: e.target.value as AgreementType,
              })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          >
            <option value="partnership">Partnership</option>
            <option value="vendor">Vendor</option>
            <option value="referral">Referral</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Status *
          </label>
          <select
            id="status"
            required
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as AgreementStatus,
              })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="start_date"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Start Date
          </label>
          <input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="end_date"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            End Date
          </label>
          <input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) =>
              setFormData({ ...formData, end_date: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="revenue_share_percentage"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Revenue Share Percentage
          </label>
          <input
            id="revenue_share_percentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.revenue_share_percentage}
            onChange={(e) =>
              setFormData({ ...formData, revenue_share_percentage: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            placeholder="0.00"
          />
        </div>

        <div>
          <label
            htmlFor="monthly_fee"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Monthly Fee
          </label>
          <input
            id="monthly_fee"
            type="number"
            step="0.01"
            min="0"
            value={formData.monthly_fee}
            onChange={(e) =>
              setFormData({ ...formData, monthly_fee: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            placeholder="0.00"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="terms"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Terms
          </label>
          <textarea
            id="terms"
            rows={4}
            value={formData.terms}
            onChange={(e) =>
              setFormData({ ...formData, terms: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            placeholder="Enter agreement terms..."
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            placeholder="Additional notes..."
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? "Saving..." : agreement ? "Update Agreement" : "Create Agreement"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

