"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Location, LocationStatus } from "@/lib/supabase/types";
import { MapPin } from "lucide-react";

interface LocationFormProps {
  accountId: string;
  location?: Location;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function LocationForm({
  accountId,
  location,
  onSuccess,
  onCancel,
}: LocationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: location?.name || "",
    address_line1: location?.address_line1 || "",
    address_line2: location?.address_line2 || "",
    city: location?.city || "",
    state: location?.state || "",
    zip_code: location?.zip_code || "",
    country: location?.country || "USA",
    phone: location?.phone || "",
    email: location?.email || "",
    contact_name: location?.contact_name || "",
    contact_title: location?.contact_title || "",
    is_primary: location?.is_primary || false,
    status: (location?.status || "active") as LocationStatus,
    notes: location?.notes || "",
    sage_code: location?.sage_code || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = location
        ? `/api/admin/locations/${location.id}`
        : "/api/admin/locations";
      const method = location ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          account_id: accountId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save location");
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
            htmlFor="name"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Location Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>

        {location && location.clinic_code && (
          <div>
            <label
              htmlFor="clinic_code"
              className="block text-sm font-medium text-navy-700 mb-2"
            >
              Clinic Code
            </label>
            <input
              id="clinic_code"
              type="text"
              value={location.clinic_code}
              disabled
              className="w-full px-4 py-2 border border-navy-200 rounded-lg bg-navy-50 text-navy-600 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-navy-500">
              Auto-generated when location is created
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="sage_code"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Sage Code
          </label>
          <input
            id="sage_code"
            type="text"
            value={formData.sage_code}
            onChange={(e) =>
              setFormData({ ...formData, sage_code: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            placeholder="Enter Sage code..."
          />
        </div>

        <div>
          <label
            htmlFor="address_line1"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Address Line 1
          </label>
          <input
            id="address_line1"
            type="text"
            value={formData.address_line1}
            onChange={(e) =>
              setFormData({ ...formData, address_line1: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="address_line2"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Address Line 2
          </label>
          <input
            id="address_line2"
            type="text"
            value={formData.address_line2}
            onChange={(e) =>
              setFormData({ ...formData, address_line2: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            City
          </label>
          <input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) =>
              setFormData({ ...formData, city: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="state"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            State
          </label>
          <input
            id="state"
            type="text"
            value={formData.state}
            onChange={(e) =>
              setFormData({ ...formData, state: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="zip_code"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            ZIP Code
          </label>
          <input
            id="zip_code"
            type="text"
            value={formData.zip_code}
            onChange={(e) =>
              setFormData({ ...formData, zip_code: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="country"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Country
          </label>
          <input
            id="country"
            type="text"
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="contact_name"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Contact Name
          </label>
          <input
            id="contact_name"
            type="text"
            value={formData.contact_name}
            onChange={(e) =>
              setFormData({ ...formData, contact_name: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="contact_title"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Contact Title
          </label>
          <input
            id="contact_title"
            type="text"
            value={formData.contact_title}
            onChange={(e) =>
              setFormData({ ...formData, contact_title: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as LocationStatus,
              })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_primary}
              onChange={(e) =>
                setFormData({ ...formData, is_primary: e.target.checked })
              }
              className="w-4 h-4 text-gold-600 border-navy-300 rounded focus:ring-gold-500"
            />
            <span className="text-sm font-medium text-navy-700">
              Primary Location
            </span>
          </label>
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
            rows={4}
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? "Saving..." : location ? "Update Location" : "Create Location"}
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

