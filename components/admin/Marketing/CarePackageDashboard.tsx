"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Filter, CheckCircle2, Circle } from "lucide-react";
import type {
  Account,
  CarePackageStatus,
} from "@/lib/supabase/types";

type ShipmentStatusFilter = CarePackageStatus | "all";

interface MarketingShipmentRow {
  id: string;
  request_id: string;
  account_id: string | null;
  location_id: string | null;
  label: string | null;
  recipient_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  quantity: number;
  status: CarePackageStatus;
  sent_at: string | null;
  materials_cost: number | null;
  shipping_cost: number | null;
  total_cost: number | null;
  created_at: string;
  account_name: string | null;
  location_name: string | null;
  requested_at: string;
  requested_by_name: string | null;
}

export default function CarePackageDashboard() {
  const [shipments, setShipments] = useState<MarketingShipmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingId, setIsSavingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<ShipmentStatusFilter>("requested");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountFilter, setAccountFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await fetch("/api/admin/accounts?page=1&pageSize=1000");
        if (!res.ok) return;
        const data = await res.json();
        const list: Account[] = Array.isArray(data) ? data : data.accounts;
        setAccounts(list || []);
      } catch (err) {
        console.error("[CarePackageDashboard] Error loading accounts", err);
      }
    }
    loadAccounts();
  }, []);

  const accountOptions = useMemo(
    () =>
      accounts
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((acc) => ({ value: acc.id, label: acc.name })),
    [accounts]
  );

  const loadShipments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL("/api/admin/care-packages/shipments", window.location.origin);
      if (statusFilter && statusFilter !== "all") {
        url.searchParams.set("status", statusFilter);
      }
      if (accountFilter) {
        url.searchParams.set("accountId", accountFilter);
      }
      const res = await fetch(url.toString());
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Failed to load care package shipments.");
        return;
      }
      const data: MarketingShipmentRow[] = await res.json();
      setShipments(data || []);
    } catch (err: any) {
      console.error("[CarePackageDashboard] Error loading shipments", err);
      setError(err.message || "Unexpected error loading shipments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, accountFilter]);

  const handleMarkSentToggle = async (shipment: MarketingShipmentRow) => {
    const newStatus: CarePackageStatus =
      shipment.status === "sent" ? "requested" : "sent";
    const newSentAt =
      newStatus === "sent" ? new Date().toISOString() : null;

    setIsSavingId(shipment.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/care-packages/shipments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: shipment.id,
          status: newStatus,
          sent_at: newSentAt,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Failed to update shipment.");
        return;
      }

      const updated = (await res.json()) as MarketingShipmentRow;
      setShipments((prev) =>
        prev.map((s) => (s.id === shipment.id ? { ...s, ...updated } : s))
      );
    } catch (err: any) {
      console.error("[CarePackageDashboard] Error updating status", err);
      setError(err.message || "Unexpected error updating status.");
    } finally {
      setIsSavingId(null);
    }
  };

  const handleCostChange = (
    shipmentId: string,
    field: "materials_cost" | "shipping_cost",
    value: string
  ) => {
    const numeric = value === "" ? null : Number(value);
    if (value !== "" && Number.isNaN(numeric)) {
      return;
    }

    setShipments((prev) =>
      prev.map((s) => {
        if (s.id !== shipmentId) return s;
        const next: MarketingShipmentRow = {
          ...s,
          [field]: numeric,
        } as MarketingShipmentRow;
        const materials = next.materials_cost ?? 0;
        const shipping = next.shipping_cost ?? 0;
        next.total_cost =
          next.materials_cost === null && next.shipping_cost === null
            ? null
            : materials + shipping;
        return next;
      })
    );
  };

  const handleSaveCosts = async (shipment: MarketingShipmentRow) => {
    setIsSavingId(shipment.id);
    setError(null);
    try {
      const res = await fetch("/api/admin/care-packages/shipments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: shipment.id,
          materials_cost: shipment.materials_cost,
          shipping_cost: shipment.shipping_cost,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Failed to save costs.");
        return;
      }

      const updated = (await res.json()) as MarketingShipmentRow;
      setShipments((prev) =>
        prev.map((s) => (s.id === shipment.id ? { ...s, ...updated } : s))
      );
    } catch (err: any) {
      console.error("[CarePackageDashboard] Error saving costs", err);
      setError(err.message || "Unexpected error saving costs.");
    } finally {
      setIsSavingId(null);
    }
  };

  const totalCostSummary = useMemo(() => {
    const total = shipments.reduce(
      (sum, s) => sum + (s.total_cost ?? 0),
      0
    );
    const sentTotal = shipments
      .filter((s) => s.status === "sent")
      .reduce((sum, s) => sum + (s.total_cost ?? 0), 0);
    return { total, sentTotal };
  }, [shipments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-navy-900 mb-1">
            Care package shipments
          </h1>
          <p className="text-navy-600">
            Marketing view of all care package shipments, with status and
            cost tracking.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-navy-700">
          <div className="flex flex-col items-end">
            <span className="font-medium">
              Total cost (all):{" "}
              <span className="tabular-nums">
                ${totalCostSummary.total.toFixed(2)}
              </span>
            </span>
            <span className="text-navy-500">
              Sent shipments:{" "}
              <span className="tabular-nums">
                ${totalCostSummary.sentTotal.toFixed(2)}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-navy-800">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ShipmentStatusFilter)
              }
              className="rounded-lg border border-navy-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            >
              <option value="requested">Requested</option>
              <option value="in_progress">In progress</option>
              <option value="sent">Sent</option>
              <option value="cancelled">Cancelled</option>
              <option value="all">All statuses</option>
            </select>

            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="rounded-lg border border-navy-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            >
              <option value="">All accounts</option>
              {accountOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={loadShipments}
              className="inline-flex items-center gap-2 text-sm text-navy-700 hover:text-navy-900"
            >
              <Loader2
                className={`w-4 h-4 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-10 text-center text-sm text-navy-600">
            Loading shipments...
          </div>
        ) : shipments.length === 0 ? (
          <div className="py-10 text-center text-sm text-navy-600">
            No shipments match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="text-left text-navy-500 border-b border-navy-100">
                  <th className="py-2 pr-3 font-medium">Account</th>
                  <th className="py-2 pr-3 font-medium">Location / Label</th>
                  <th className="py-2 pr-3 font-medium">Recipient / Address</th>
                  <th className="py-2 pr-3 font-medium">Qty</th>
                  <th className="py-2 pr-3 font-medium">Requested</th>
                  <th className="py-2 pr-3 font-medium">Sent</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium text-right">
                    Materials
                  </th>
                  <th className="py-2 pr-3 font-medium text-right">
                    Shipping
                  </th>
                  <th className="py-2 pr-3 font-medium text-right">
                    Total
                  </th>
                  <th className="py-2 pl-3 font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => {
                  const isSaving = isSavingId === s.id;
                  const statusChipClass =
                    s.status === "sent"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : s.status === "cancelled"
                      ? "bg-red-50 text-red-700 border-red-100"
                      : s.status === "in_progress"
                      ? "bg-sky-50 text-sky-700 border-sky-100"
                      : "bg-amber-50 text-amber-700 border-amber-100";

                  return (
                    <tr
                      key={s.id}
                      className="border-b border-navy-50 align-top"
                    >
                      <td className="py-2 pr-3">
                        <div className="max-w-[180px] truncate">
                          {s.account_name || (
                            <span className="text-navy-400">—</span>
                          )}
                        </div>
                        {s.requested_by_name && (
                          <div className="text-[11px] text-navy-400">
                            Requested by {s.requested_by_name}
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="max-w-[200px] truncate">
                          {s.location_name && (
                            <span className="font-medium">
                              {s.location_name}
                            </span>
                          )}
                          {s.location_name && s.label && " • "}
                          {s.label && (
                            <span className="text-navy-600">{s.label}</span>
                          )}
                          {!s.location_name && !s.label && (
                            <span className="text-navy-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="max-w-[260px] truncate">
                          {s.recipient_name && (
                            <span className="font-medium">
                              {s.recipient_name}
                            </span>
                          )}
                          {(s.address_line1 ||
                            s.address_line2 ||
                            s.city ||
                            s.state ||
                            s.zip_code) && (
                            <>
                              {s.recipient_name && " – "}
                              <span className="text-navy-600">
                                {[s.address_line1, s.address_line2]
                                  .filter(Boolean)
                                  .join(", ")}
                                {(s.city || s.state || s.zip_code) && (
                                  <>
                                    {" "}
                                    •{" "}
                                    {[s.city, s.state, s.zip_code]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </>
                                )}
                              </span>
                            </>
                          )}
                          {!s.recipient_name &&
                            !s.address_line1 &&
                            !s.city && (
                              <span className="text-navy-400">—</span>
                            )}
                        </div>
                      </td>
                      <td className="py-2 pr-3">{s.quantity}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {new Date(s.requested_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {s.sent_at
                          ? new Date(s.sent_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusChipClass}`}
                        >
                          {s.status === "sent" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Circle className="w-3 h-3" />
                          )}
                          <span className="capitalize">{s.status}</span>
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={
                            s.materials_cost !== null
                              ? s.materials_cost
                              : ""
                          }
                          onChange={(e) =>
                            handleCostChange(
                              s.id,
                              "materials_cost",
                              e.target.value
                            )
                          }
                          className="w-20 rounded-md border border-navy-200 px-2 py-1 text-right text-xs bg-white focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500"
                        />
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={
                            s.shipping_cost !== null
                              ? s.shipping_cost
                              : ""
                          }
                          onChange={(e) =>
                            handleCostChange(
                              s.id,
                              "shipping_cost",
                              e.target.value
                            )
                          }
                          className="w-20 rounded-md border border-navy-200 px-2 py-1 text-right text-xs bg-white focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500"
                        />
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {s.total_cost !== null
                          ? `$${(s.total_cost ?? 0).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="py-2 pl-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleMarkSentToggle(s)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1 rounded-full border border-navy-200 px-3 py-1 text-[11px] font-medium text-navy-700 hover:bg-navy-50 disabled:opacity-60"
                          >
                            {isSaving && (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            )}
                            <span>
                              {s.status === "sent"
                                ? "Mark unsent"
                                : "Mark sent"}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveCosts(s)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1 rounded-full bg-gold-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-gold-700 disabled:opacity-60"
                          >
                            {isSaving && (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            )}
                            <span>Save costs</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

