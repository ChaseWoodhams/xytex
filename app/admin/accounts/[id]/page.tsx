import { getCorporateAccountById } from "@/lib/supabase/corporate-accounts";
import { getLocationsByAccount } from "@/lib/supabase/locations";
import { getAgreementsByAccount } from "@/lib/supabase/agreements";
import { getActivitiesByAccount } from "@/lib/supabase/activities";
import { getNotesByAccount } from "@/lib/supabase/notes";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AccountDetailView from "@/components/admin/AccountDetailView";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const account = await getCorporateAccountById(id);
  if (!account) {
    notFound();
  }

  const [locations, agreements, activities, notes] = await Promise.all([
    getLocationsByAccount(id),
    getAgreementsByAccount(id),
    getActivitiesByAccount(id),
    getNotesByAccount(id, user.id),
  ]);

  return (
    <AccountDetailView
      account={account}
      locations={locations}
      agreements={agreements}
      activities={activities}
      notes={notes}
      currentUserId={user.id}
    />
  );
}

