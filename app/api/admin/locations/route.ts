import { createClient } from '@/lib/supabase/server';
import { createLocation, getLocationsByAccount } from '@/lib/supabase/locations';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';
import { logChange } from '@/lib/supabase/change-log';

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
    const accountId = searchParams.get('accountId');

    if (accountId) {
      // Return locations for specific account
      const locations = await getLocationsByAccount(accountId);
      return NextResponse.json(locations);
    }

    // Return all locations
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching locations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch locations' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const location = await createLocation(body);

    if (!location) {
      return NextResponse.json(
        { error: 'Failed to create location' },
        { status: 500 }
      );
    }

    // Log the change
    await logChange({
      actionType: 'create_location',
      entityType: 'location',
      entityId: location.id,
      entityName: location.name || 'Unknown Location',
      description: `Created new location "${location.name || 'Unknown'}"`,
      details: {
        locationId: location.id,
        locationName: location.name,
        accountId: location.account_id,
        clinicCode: location.clinic_code,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error: any) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

