import { getCorporateAccountById } from "@/lib/supabase/corporate-accounts";
import { getLocationsByAccount } from "@/lib/supabase/locations";
import { getAgreementsByAccount, getAgreementStatusesByLocations } from "@/lib/supabase/agreements";
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

  // Use Promise.allSettled to prevent one error from crashing the entire page
  const [locationsResult, agreementsResult, activitiesResult, notesResult] = await Promise.allSettled([
    getLocationsByAccount(id),
    getAgreementsByAccount(id),
    getActivitiesByAccount(id),
    getNotesByAccount(id, user.id),
  ]);

  const locations = locationsResult.status === 'fulfilled' ? locationsResult.value : [];
  const agreements = agreementsResult.status === 'fulfilled' ? agreementsResult.value : [];
  const activities = activitiesResult.status === 'fulfilled' ? activitiesResult.value : [];
  const notes = notesResult.status === 'fulfilled' ? notesResult.value : [];

  // Get agreement statuses for all locations
  const locationIds = locations.map(loc => loc.id);
  const locationAgreementStatuses = await getAgreementStatusesByLocations(locationIds);

  // Log any errors for debugging
  if (locationsResult.status === 'rejected') {
    console.error('Error loading locations:', locationsResult.reason);
  }
  if (agreementsResult.status === 'rejected') {
    console.error('Error loading agreements:', agreementsResult.reason);
  }
  if (activitiesResult.status === 'rejected') {
    console.error('Error loading activities:', activitiesResult.reason);
  }
  if (notesResult.status === 'rejected') {
    console.error('Error loading notes:', notesResult.reason);
  }

  return (
    <AccountDetailView
      account={account}
      locations={locations}
      agreements={agreements}
      activities={activities}
      notes={notes}
      currentUserId={user.id}
      locationAgreementStatuses={locationAgreementStatuses}
    />
  );
}

