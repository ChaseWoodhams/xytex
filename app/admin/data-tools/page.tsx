import { redirect } from "next/navigation";

export default async function DataToolsPage() {
  redirect("/admin/clinic-tools?tab=data-tools");
}
