"use client";

import { useState } from "react";
import { Mail, UserPlus, X, CheckCircle2, AlertCircle } from "lucide-react";
import type { UserRole } from "@/lib/supabase/types";

interface InviteTeamMemberProps {
  onInviteSent?: () => void;
}

export default function InviteTeamMember({ onInviteSent }: InviteTeamMemberProps) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("bd_team");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
          expiresInDays: 7,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send invitation");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setEmail("");
      setRole("bd_team");
      setLoading(false);

      if (onInviteSent) {
        onInviteSent();
      }

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
      }, 3000);

      // Refresh the page if we're on the invitations page
      if (window.location.pathname === "/admin/invitations") {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="btn btn-primary flex items-center gap-2"
      >
        <UserPlus className="w-5 h-5" />
        Invite Team Member
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-semibold text-navy-900">
          Invite Team Member
        </h2>
        <button
          onClick={() => {
            setShowForm(false);
            setEmail("");
            setRole("bd_team");
            setError(null);
            setSuccess(false);
          }}
          className="text-navy-400 hover:text-navy-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800">
              Invitation sent successfully!
            </p>
            <p className="text-sm text-green-700 mt-1">
              An invitation email has been sent to {email}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-navy-400" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="team.member@example.com"
              className="w-full pl-10 pr-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            Role *
          </label>
          <select
            id="role"
            required
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
          >
            <option value="bd_team">BD Team</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
          </select>
          <p className="mt-1 text-xs text-navy-600">
            {role === "admin"
              ? "Full access to all features and settings"
              : role === "bd_team"
              ? "Access to accounts, locations, agreements, and activities"
              : "Limited access to customer features"}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1"
          >
            {loading ? "Sending..." : "Send Invitation"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEmail("");
              setRole("bd_team");
              setError(null);
              setSuccess(false);
            }}
            disabled={loading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

