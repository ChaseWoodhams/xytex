import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Search locations with account information
    const { data: locations, error: locationsError } = await adminClient
      .from('locations')
      .select(`
        *,
        accounts!inner (
          id,
          name,
          account_type
        )
      `)
      .or(`name.ilike.%${query}%,address_line1.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%,zip_code.ilike.%${query}%`)
      .limit(100);

    if (locationsError) {
      console.error('Error searching locations:', locationsError);
      return NextResponse.json(
        { error: `Failed to search locations: ${locationsError.message}` },
        { status: 500 }
      );
    }

    // Also search by account name
    const { data: accounts, error: accountsError } = await adminClient
      .from('accounts')
      .select('id, name, account_type')
      .ilike('name', `%${query}%`)
      .limit(50);

    if (accountsError) {
      console.error('Error searching accounts:', accountsError);
    }

    // Get locations for matching accounts
    const accountIds = (accounts || []).map(acc => acc.id);
    let accountLocations: any[] = [];

    if (accountIds.length > 0) {
      const { data: locs, error: locsError } = await adminClient
        .from('locations')
        .select(`
          *,
          accounts!inner (
            id,
            name,
            account_type
          )
        `)
        .in('account_id', accountIds)
        .limit(100);

      if (!locsError && locs) {
        accountLocations = locs;
      }
    }

    // Combine and deduplicate locations
    const allLocations = [...(locations || []), ...accountLocations];
    const uniqueLocations = Array.from(
      new Map(allLocations.map(loc => [loc.id, loc])).values()
    );

    // Format response
    const formattedLocations = uniqueLocations.map((loc: any) => ({
      id: loc.id,
      account_id: loc.account_id,
      name: loc.name,
      address_line1: loc.address_line1,
      address_line2: loc.address_line2,
      city: loc.city,
      state: loc.state,
      zip_code: loc.zip_code,
      country: loc.country,
      phone: loc.phone,
      email: loc.email,
      contact_name: loc.contact_name,
      contact_title: loc.contact_title,
      is_primary: loc.is_primary,
      status: loc.status,
      notes: loc.notes,
      clinic_code: loc.clinic_code,
      sage_code: loc.sage_code,
      account_name: loc.accounts?.name || 'Unknown',
      account_type: loc.accounts?.account_type || 'single_location',
    }));

    return NextResponse.json({ locations: formattedLocations });
  } catch (error: any) {
    console.error('Error searching locations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search locations' },
      { status: 500 }
    );
  }
}

