"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Agreement, Account, Location } from "@/lib/supabase/types";
import { ArrowLeft, FileText, MapPin, Calendar, DollarSign, Percent, Loader2, Download } from "lucide-react";

interface AgreementDetailViewProps {
  agreement: Agreement;
  account: Account;
  location: Location | null;
  locationAgreements: Agreement[];
}

export default function AgreementDetailView({
  agreement: initialAgreement,
  account,
  location,
  locationAgreements,
}: AgreementDetailViewProps) {
  const router = useRouter();
  const [agreement, setAgreement] = useState(initialAgreement);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (field: keyof Agreement, value: any) => {
    setAgreement((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/agreements/${agreement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: agreement.status,
          start_date: agreement.start_date,
          end_date: agreement.end_date,
          revenue_share_percentage: agreement.revenue_share_percentage,
          monthly_fee: agreement.monthly_fee,
          terms: agreement.terms,
          notes: agreement.notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update agreement");
      }

      const updated = (await res.json()) as Agreement;
      setAgreement(updated);
      setSuccess("Agreement updated");
    } catch (err: any) {
      setError(err.message || "Failed to update agreement");
    } finally {
      setSaving(false);
    }
  };

  const sortedHistory = [...locationAgreements].sort((a, b) =>
    (b.start_date || "").localeCompare(a.start_date || "")
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-navy-600 hover:text-navy-900 mb-4 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-navy-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-gold-600" />
            {agreement.title || "Agreement"}
          </h1>
          <p className="mt-2 text-sm text-navy-600">
            Account:{" "}
            <Link
              href={`/admin/accounts/${agreement.account_id}`}
              className="text-gold-600 hover:text-gold-700 font-medium"
            >
              {account.name}
            </Link>
            {location && (
              <>
                {" "}
                · Location: <span className="font-medium">{location.name}</span>
              </>
            )}
          </p>
        </div>
        {agreement.document_url && (
          <a
            href={agreement.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gold-700 bg-gold-100 rounded-lg hover:bg-gold-200"
          >
            <Download className="w-4 h-4" />
            Download contract
          </a>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Editable Agreement Details */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-heading font-semibold text-navy-900 mb-2">Agreement details</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-navy-600 mb-1">Status</label>
              <select
                value={agreement.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-600 mb-1">Type</label>
              <input
                value={agreement.agreement_type}
                disabled
                className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm bg-cream-50 text-navy-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Start date
              </label>
              <input
                type="date"
                value={agreement.start_date ? agreement.start_date.substring(0, 10) : ""}
                onChange={(e) => handleChange("start_date", e.target.value || null)}
                className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                End date
              </label>
              <input
                type="date"
                value={agreement.end_date ? agreement.end_date.substring(0, 10) : ""}
                onChange={(e) => handleChange("end_date", e.target.value || null)}
                className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-600 mb-1 flex items-center gap-1">
                <Percent className="w-3 h-3" />
                Revenue share %
              </label>
              <input
                type="number"
                step="0.1"
                value={agreement.revenue_share_percentage ?? ""}
                onChange={(e) =>
                  handleChange(
                    "revenue_share_percentage",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-600 mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Monthly fee (USD)
              </label>
              <input
                type="number"
                step="1"
                value={agreement.monthly_fee ?? ""}
                onChange={(e) =>
                  handleChange("monthly_fee", e.target.value === "" ? null : Number(e.target.value))
                }
                className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-navy-600 mb-1">Key terms</label>
            <textarea
              rows={3}
              value={agreement.terms ?? ""}
              onChange={(e) => handleChange("terms", e.target.value || null)}
              className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-navy-600 mb-1">Internal notes</label>
            <textarea
              rows={3}
              value={agreement.notes ?? ""}
              onChange={(e) => handleChange("notes", e.target.value || null)}
              className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-600 text-white text-sm font-medium hover:bg-gold-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save changes
            </button>
          </div>
        </div>

        {/* Location info + history */}
        <div className="space-y-6">
          {location && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-sm font-heading font-semibold text-navy-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold-600" />
                Location
              </h2>
              <p className="font-heading text-navy-900">{location.name}</p>
              {location.address_line1 && (
                <p className="text-sm text-navy-600 mt-1">
                  {location.address_line1}
                  {location.address_line2 && `, ${location.address_line2}`}
                  <br />
                  {[location.city, location.state, location.zip_code].filter(Boolean).join(", ")}
                </p>
              )}
              {location.contact_name && (
                <p className="text-sm text-navy-600 mt-2">
                  <span className="font-medium">Contact:</span> {location.contact_name}
                  {location.contact_title && ` (${location.contact_title})`}
                </p>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-sm font-heading font-semibold text-navy-900 mb-3">
              All agreements for this location
            </h2>
            {sortedHistory.length === 0 ? (
              <p className="text-sm text-navy-600">
                No other agreements recorded for this location.
              </p>
            ) : (
              <div className="space-y-3">
                {sortedHistory.map((a) => (
                  <div
                    key={a.id}
                    className={`border rounded-lg p-3 text-xs ${
                      a.id === agreement.id ? "border-gold-400 bg-gold-50/40" : "border-navy-100"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-navy-900">
                        {a.title || "Agreement"}{" "}
                        {a.id === agreement.id && (
                          <span className="ml-1 px-2 py-0.5 rounded-full bg-gold-100 text-gold-700 text-[10px] font-semibold">
                            Current view
                          </span>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-navy-50 text-navy-700 capitalize">
                        {a.status}
                      </span>
                    </div>
                    <div className="mt-1 text-navy-600">
                      {a.start_date && (
                        <span>
                          Start: {new Date(a.start_date).toLocaleDateString()}
                        </span>
                      )}
                      {a.end_date && (
                        <span>
                          {" "}
                          · End: {new Date(a.end_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


