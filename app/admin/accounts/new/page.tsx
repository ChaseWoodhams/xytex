import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AccountForm from "@/components/admin/AccountForm";

export default async function NewAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-heading font-bold text-navy-900 mb-8">
        Create New Account
      </h1>
      <AccountForm />
    </div>
  );
}

