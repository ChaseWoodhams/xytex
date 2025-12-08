import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgreementById, getAgreementsByLocation } from "@/lib/supabase/agreements";
import { getAccountById } from "@/lib/supabase/accounts";
import { getLocationById } from "@/lib/supabase/locations";
import AgreementDetailView from "@/components/admin/AgreementDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgreementDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const agreement = await getAgreementById(id);
  if (!agreement) {
    notFound();
  }

  const account = await getAccountById(agreement.account_id);
  if (!account) {
    notFound();
  }

  let location = null;
  let locationAgreements = [] as Awaited<ReturnType<typeof getAgreementsByLocation>>;

  if (agreement.location_id) {
    location = await getLocationById(agreement.location_id);
    locationAgreements = await getAgreementsByLocation(agreement.location_id);
  }

  return (
    <AgreementDetailView
      agreement={agreement}
      account={account}
      location={location}
      locationAgreements={locationAgreements}
    />
  );
}


