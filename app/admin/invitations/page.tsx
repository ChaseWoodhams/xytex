import { createClient } from "@/lib/supabase/server";
import { getAllInvitations } from "@/lib/supabase/invitations";
import { canAccessAdmin } from "@/lib/utils/roles";
import { getCurrentUser } from "@/lib/supabase/users";
import { notFound } from "next/navigation";
import InvitationsList from "@/components/admin/InvitationsList";
import InviteTeamMember from "@/components/admin/InviteTeamMember";

export default async function InvitationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const userProfile = await getCurrentUser();
  if (!canAccessAdmin(userProfile)) {
    notFound();
  }

  const invitations = await getAllInvitations();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading font-bold text-navy-900 mb-2">
            Team Invitations
          </h1>
          <p className="text-navy-600">
            Invite team members to join the Xytex CRM
          </p>
        </div>
        <InviteTeamMember />
      </div>

      <InvitationsList initialInvitations={invitations} />
    </div>
  );
}

