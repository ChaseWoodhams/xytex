import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';
import { getLocationById, getLocationsByAccount, createLocation } from '@/lib/supabase/locations';
import { getAccountById, createAccount, updateAccount } from '@/lib/supabase/accounts';
import { logChange } from '@/lib/supabase/change-log';

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
    const { locationId } = body;

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
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

    if (sourceAccount.account_type !== 'multi_location') {
      return NextResponse.json(
        { error: 'Source account must be a multi-location account' },
        { status: 400 }
      );
    }

    // Check how many locations the account has
    const sourceLocations = await getLocationsByAccount(sourceAccount.id);
    if (sourceLocations.length <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove the last location from a multi-location account' },
        { status: 400 }
      );
    }

    // Create a new single-location account
    const newAccount = await createAccount({
      name: location.name || 'New Account',
      website: null,
      industry: sourceAccount.industry,
      annual_revenue: sourceAccount.annual_revenue,
      employee_count: sourceAccount.employee_count,
      status: sourceAccount.status,
      account_type: 'single_location',
      primary_contact_name: location.contact_name || sourceAccount.primary_contact_name,
      primary_contact_email: location.email || sourceAccount.primary_contact_email,
      primary_contact_phone: location.phone || sourceAccount.primary_contact_phone,
      notes: location.notes || sourceAccount.notes,
      sage_code: null, // New account gets new sage code
      udf_clinic_name: location.name || null,
      udf_shipto_name: null,
      udf_address_line1: location.address_line1 || null,
      udf_address_line2: location.address_line2 || null,
      udf_address_line3: null,
      udf_city: location.city || null,
      udf_state: location.state || null,
      udf_zipcode: location.zip_code || null,
      udf_fax: null,
      udf_notes: location.notes || null,
      udf_phone: location.phone || null,
      udf_email: location.email || null,
      udf_country_code: location.country || 'US',
      upload_batch_id: null,
      upload_list_name: null,
      pending_contract_sent: location.pending_contract_sent || false,
      created_by: user.id,
    });

    if (!newAccount) {
      return NextResponse.json(
        { error: 'Failed to create new account' },
        { status: 500 }
      );
    }

    // Move the location to the new account
    const { error: updateError } = await adminClient
      .from('locations')
      .update({ 
        account_id: newAccount.id,
        is_primary: true, // Single location is always primary
      })
      .eq('id', locationId);

    if (updateError) {
      console.error('Error moving location:', updateError);
      // Try to clean up the new account if location move failed
      await adminClient.from('accounts').delete().eq('id', newAccount.id);
      return NextResponse.json(
        { error: `Failed to move location: ${updateError.message}` },
        { status: 500 }
      );
    }

    // If the source account now has only one location, convert it to single_location
    const remainingLocations = await getLocationsByAccount(sourceAccount.id);
    if (remainingLocations.length === 1) {
      await updateAccount(sourceAccount.id, {
        account_type: 'single_location',
      });
    }

    // Log the change
    await logChange({
      actionType: 'remove_location',
      entityType: 'location',
      entityId: locationId,
      entityName: location.name || 'Unknown Location',
      description: `Removed location "${location.name || 'Unknown'}" from multi-location account "${sourceAccount.name}" and created new single-location account "${newAccount.name}"`,
      details: {
        locationId: locationId,
        locationName: location.name,
        sourceAccountId: sourceAccount.id,
        sourceAccountName: sourceAccount.name,
        newAccountId: newAccount.id,
        accountName: newAccount.name,
      },
    });

    return NextResponse.json({
      success: true,
      accountName: newAccount.name,
      accountId: newAccount.id,
    });
  } catch (error: any) {
    console.error('Error removing location from multi-location account:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove location' },
      { status: 500 }
    );
  }
}

