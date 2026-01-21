"use client";

import { useEffect, useState } from "react";
import InvitationsList from "@/components/admin/InvitationsList";
import InviteTeamMember from "@/components/admin/InviteTeamMember";
import type { Invitation } from "@/lib/supabase/types";

export default function InvitationsTab() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInvitations() {
      try {
        const response = await fetch("/api/admin/invitations");
        if (response.ok) {
          const data = await response.json();
          setInvitations(data);
        }
      } catch (error) {
        console.error('[InvitationsTab] Error loading invitations:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadInvitations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-navy-900 mb-1">
            Team Invitations
          </h2>
          <p className="text-navy-600">
            Invite team members to join the Xytex CRM
          </p>
        </div>
        <InviteTeamMember />
      </div>

      {!isLoading && <InvitationsList initialInvitations={invitations} />}
    </div>
  );
}
