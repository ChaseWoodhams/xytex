import { getLocationById, getLocationsByAccount } from "@/lib/supabase/locations";
import { getAccountById } from "@/lib/supabase/accounts";
import { getAgreementsByLocation } from "@/lib/supabase/agreements";
import { getNotesByLocation } from "@/lib/supabase/notes";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import LocationDetailView from "@/components/admin/LocationDetailView";
import type { Note } from "@/lib/supabase/types";

export default async function LocationDetailPage({
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

  const location = await getLocationById(id);
  if (!location) {
    notFound();
  }

  const account = await getAccountById(location.account_id);
  if (!account) {
    notFound();
  }

  // Get all locations for the account to determine if it's multi-location
  const allLocations = await getLocationsByAccount(account.id);
  // Use account_type if set, otherwise fallback to location count
  const isMultiLocation = account.account_type === 'multi_location' || allLocations.length > 1;

  // Get agreements for this location (only if multi-location account)
  const agreements = isMultiLocation ? await getAgreementsByLocation(id) : [];

  // Get notes for this location
  let notes: Note[] = [];
  try {
    notes = await getNotesByLocation(id, user.id);
  } catch (error) {
    console.error('Error fetching location notes:', error);
  }

  return (
    <LocationDetailView
      location={location}
      account={account}
      agreements={agreements}
      isMultiLocation={isMultiLocation}
      notes={notes}
      currentUserId={user.id}
    />
  );
}
