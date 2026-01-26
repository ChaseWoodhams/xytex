import { redirect } from "next/navigation";

export default async function InvitationsPage() {
  redirect("/admin/clinic-tools?tab=invitations");
}
