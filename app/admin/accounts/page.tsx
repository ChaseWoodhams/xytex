import { redirect } from "next/navigation";

export default async function AccountsPage() {
  redirect("/admin/clinic-tools?tab=accounts");
}
