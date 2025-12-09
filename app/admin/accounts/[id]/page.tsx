import { getAccountById } from "@/lib/supabase/accounts";
import { getLocationsByAccount } from "@/lib/supabase/locations";
import { getAgreementsByAccount, getAgreementsByLocation } from "@/lib/supabase/agreements";
import { getActivitiesByAccount } from "@/lib/supabase/activities";
import { getNotesByAccount } from "@/lib/supabase/notes";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AccountDetailView from "@/components/admin/AccountDetailView";
import type { Location, Agreement, Activity, Note } from "@/lib/supabase/types";

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

  const account = await getAccountById(id);
  if (!account) {
    notFound();
  }

  // Fetch data with error handling to prevent crashes
  let locations: Location[] = [];
  let accountAgreements: Agreement[] = [];
  let activities: Activity[] = [];
  let notes: Note[] = [];

  try {
    [locations, accountAgreements, activities, notes] = await Promise.all([
      getLocationsByAccount(id),
      getAgreementsByAccount(id),
      getActivitiesByAccount(id),
      getNotesByAccount(id, user.id),
    ]);
  } catch (error) {
    console.error('Error fetching account data:', error);
    // Continue with empty arrays if fetch fails - don't crash the page
    // Individual fetches will log their own errors
  }

  // Fetch agreements for each location
  const locationAgreementsMap = new Map<string, Agreement[]>();
  await Promise.all(
    locations.map(async (location) => {
      const agreements = await getAgreementsByLocation(location.id);
      locationAgreementsMap.set(location.id, agreements);
    })
  );

  return (
    <AccountDetailView
      account={account}
      locations={locations}
      agreements={accountAgreements}
      locationAgreementsMap={locationAgreementsMap}
      activities={activities}
      notes={notes}
      currentUserId={user.id}
    />
  );
}

