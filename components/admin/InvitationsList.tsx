"use client";

import { useState, useEffect } from "react";
import type { Invitation } from "@/lib/supabase/types";
import { Mail, Clock, CheckCircle2, XCircle, AlertCircle, Trash2 } from "lucide-react";

interface InvitationsListProps {
  initialInvitations: Invitation[];
}

export default function InvitationsList({ initialInvitations }: InvitationsListProps) {
  const [invitations, setInvitations] = useState(initialInvitations);
  const [loading, setLoading] = useState(false);

  const refreshInvitations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/invitations");
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (error) {
      console.error("Error refreshing invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/invitations?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        refreshInvitations();
      } else {
        alert("Failed to cancel invitation");
      }
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      alert("An error occurred");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "expired":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Mail className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInviteLink = (token: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    return `${baseUrl}/invite/accept?token=${token}`;
  };

  const copyInviteLink = (token: string) => {
    const link = getInviteLink(token);
    navigator.clipboard.writeText(link);
    alert("Invitation link copied to clipboard!");
  };

  if (invitations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <Mail className="w-16 h-16 text-navy-300 mx-auto mb-4" />
        <h3 className="text-xl font-heading font-semibold text-navy-900 mb-2">
          No Invitations Yet
        </h3>
        <p className="text-navy-600 mb-6">
          Start inviting team members to join the CRM
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-navy-50">
            <tr>
              <th className="text-left py-3 px-6 text-sm font-semibold text-navy-700">
                Email
              </th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-navy-700">
                Role
              </th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-navy-700">
                Status
              </th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-navy-700">
                Expires
              </th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-navy-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {invitations.map((invitation) => (
              <tr key={invitation.id} className="hover:bg-cream-50">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-navy-400" />
                    <span className="text-navy-900">{invitation.email}</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="px-2 py-1 text-xs font-semibold bg-navy-100 text-navy-700 rounded-full capitalize">
                    {invitation.role.replace("_", " ")}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(invitation.status)}
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        invitation.status
                      )}`}
                    >
                      {invitation.status}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-navy-600">
                  {formatDate(invitation.expires_at)}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    {invitation.status === "pending" && (
                      <>
                        <button
                          onClick={() => copyInviteLink(invitation.token)}
                          className="text-sm text-gold-600 hover:text-gold-700 font-medium"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => handleCancel(invitation.id)}
                          className="p-1 text-navy-400 hover:text-red-600 transition-colors"
                          title="Cancel invitation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {invitation.status === "accepted" && invitation.accepted_at && (
                      <span className="text-xs text-navy-500">
                        Accepted {formatDate(invitation.accepted_at)}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

