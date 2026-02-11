import { redirect } from "next/navigation";

/**
 * Legacy browse-donors page - deprecated.
 * App is now internal-only. Redirect to Marketing Tools (donor data) for internal use.
 */
export default function BrowseDonorsPage() {
  redirect("/admin/marketing-tools?tab=donors");
}
