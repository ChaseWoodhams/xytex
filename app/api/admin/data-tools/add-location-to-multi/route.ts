import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';
import { getLocationById, getLocationsByAccount } from '@/lib/supabase/locations';
import { getAccountById, updateAccount } from '@/lib/supabase/accounts';

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
    const { locationId, targetAccountId } = body;

    if (!locationId || !targetAccountId) {
      return NextResponse.json(
        { error: 'Location ID and target account ID are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Get the location
    const location = await getLocationById(locationId);
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Get the source account
    const sourceAccount = await getAccountById(location.account_id);
    if (!sourceAccount) {
      return NextResponse.json({ error: 'Source account not found' }, { status: 404 });
    }

    // Get the target account
    const targetAccount = await getAccountById(targetAccountId);
    if (!targetAccount) {
      return NextResponse.json({ error: 'Target account not found' }, { status: 404 });
    }

    if (targetAccount.account_type !== 'multi_location') {
      return NextResponse.json(
        { error: 'Target account must be a multi-location account' },
        { status: 400 }
      );
    }

    // Check if source account has only one location
    const sourceLocations = await getLocationsByAccount(sourceAccount.id);
    if (sourceLocations.length !== 1) {
      return NextResponse.json(
        { error: 'Source account must have exactly one location' },
        { status: 400 }
      );
    }

    // Move the location to the target account
    const { error: updateError } = await adminClient
      .from('locations')
      .update({ account_id: targetAccountId })
      .eq('id', locationId);

    if (updateError) {
      console.error('Error moving location:', updateError);
      return NextResponse.json(
        { error: `Failed to move location: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Delete the source account (it's now empty)
    const { error: deleteError } = await adminClient
      .from('accounts')
      .delete()
      .eq('id', sourceAccount.id);

    if (deleteError) {
      console.error('Error deleting source account:', deleteError);
      // Don't fail the operation if account deletion fails - location was moved successfully
    }

    // Get updated location count
    const targetLocations = await getLocationsByAccount(targetAccountId);

    return NextResponse.json({
      success: true,
      locationCount: targetLocations.length,
    });
  } catch (error: any) {
    console.error('Error adding location to multi-location account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add location' },
      { status: 500 }
    );
  }
}

