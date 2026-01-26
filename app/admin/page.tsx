import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  redirect("/admin/clinic-tools");
}

