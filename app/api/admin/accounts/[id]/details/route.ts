import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { getAccountById } from '@/lib/supabase/accounts';
import { getLocationsByAccount } from '@/lib/supabase/locations';
import { getAgreementsByAccount, getAgreementsByLocation } from '@/lib/supabase/agreements';
import { getActivitiesByAccount } from '@/lib/supabase/activities';
import { getNotesByAccount } from '@/lib/supabase/notes';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProfile = await getCurrentUser();
    if (!canAccessAdmin(userProfile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const account = await getAccountById(id);
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Fetch all related data
    const [locations, accountAgreements, activities, notes] = await Promise.all([
      getLocationsByAccount(id),
      getAgreementsByAccount(id),
      getActivitiesByAccount(id),
      getNotesByAccount(id, user.id),
    ]);

    // Fetch agreements for each location
    const locationAgreementsMap: Record<string, any[]> = {};
    await Promise.all(
      locations.map(async (location) => {
        const agreements = await getAgreementsByLocation(location.id);
        locationAgreementsMap[location.id] = agreements;
      })
    );

    return NextResponse.json({
      account,
      locations,
      agreements: accountAgreements,
      locationAgreementsMap,
      activities,
      notes,
    });
  } catch (error: any) {
    console.error('Error fetching account details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch account details' },
      { status: 500 }
    );
  }
}

