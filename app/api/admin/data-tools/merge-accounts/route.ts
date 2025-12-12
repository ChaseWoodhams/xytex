import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';

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

    const { accountIds } = await request.json();

    if (!Array.isArray(accountIds) || accountIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 account IDs are required' },
        { status: 400 }
      );
    }

    // Use admin client for database operations
    const adminClient = createAdminClient();

    // Get all accounts to merge
    const { data: accounts, error: accountsError } = await adminClient
      .from('accounts')
      .select('*')
      .in('id', accountIds)
      .eq('account_type', 'single_location');

    if (accountsError) {
      throw accountsError;
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: 'No valid single-location accounts found to merge' },
        { status: 400 }
      );
    }

    if (accounts.length !== accountIds.length) {
      return NextResponse.json(
        { error: 'Some accounts are not single-location accounts or do not exist' },
        { status: 400 }
      );
    }

    // Use the first account as the primary account (keep this one, merge others into it)
    const primaryAccount = accounts[0];
    const accountsToDeleteIds = accounts.slice(1).map(acc => acc.id);

    // Get ALL locations for ALL accounts being merged (including primary account)
    const { data: allLocations, error: locationsError } = await adminClient
      .from('locations')
      .select('*')
      .in('account_id', accountIds);

    if (locationsError) {
      throw locationsError;
    }

    // For single-location accounts, check if location data is in UDF fields
    // and create locations from UDF fields if they don't exist in locations table
    const accountsNeedingLocations = accounts.filter(acc => {
      const hasLocationInTable = allLocations?.some(loc => loc.account_id === acc.id);
      const hasUdfLocationData = acc.udf_address_line1 || acc.udf_city || acc.udf_state;
      return !hasLocationInTable && hasUdfLocationData;
    });

    // Create locations from UDF fields for accounts that need them
    for (const account of accountsNeedingLocations) {
      const { error: createLocationError } = await adminClient
        .from('locations')
        .insert({
          account_id: account.id, // Temporarily assign to original account
          name: account.name,
          address_line1: account.udf_address_line1 || null,
          address_line2: account.udf_address_line2 || null,
          city: account.udf_city || null,
          state: account.udf_state || null,
          zip_code: account.udf_zipcode || null,
          phone: account.udf_phone || null,
          email: account.primary_contact_email || null,
          contact_name: account.primary_contact_name || null,
          is_primary: true,
          status: 'active',
        });

      if (createLocationError) {
        console.warn(`Failed to create location from UDF fields for account ${account.id}:`, createLocationError);
      }
    }

    // Re-fetch locations after creating from UDF fields
    const { data: updatedLocations, error: updatedLocationsError } = await adminClient
      .from('locations')
      .select('*')
      .in('account_id', accountIds);

    if (updatedLocationsError) {
      throw updatedLocationsError;
    }

    const locationsToReassign = updatedLocations?.filter(
      loc => accountsToDeleteIds.includes(loc.account_id)
    ) || [];

    // Reassign all locations from merged accounts to primary account
    if (locationsToReassign.length > 0) {
      const locationIds = locationsToReassign.map(loc => loc.id);
      const { error: updateLocationsError } = await adminClient
        .from('locations')
        .update({ account_id: primaryAccount.id })
        .in('id', locationIds);

      if (updateLocationsError) {
        throw updateLocationsError;
      }
    }

    // Reassign agreements from merged accounts to primary account
    // Check if there are any agreements to reassign
    const { data: agreementsToReassign } = await adminClient
      .from('agreements')
      .select('id')
      .in('account_id', accountsToDeleteIds)
      .limit(1);

    if (agreementsToReassign && agreementsToReassign.length > 0) {
      const { error: updateAgreementsError } = await adminClient
        .from('agreements')
        .update({ account_id: primaryAccount.id })
        .in('account_id', accountsToDeleteIds);

      if (updateAgreementsError) {
        throw updateAgreementsError;
      }
    }

    // Reassign activities from merged accounts to primary account
    const { data: activitiesToReassign } = await adminClient
      .from('activities')
      .select('id')
      .in('account_id', accountsToDeleteIds)
      .limit(1);

    if (activitiesToReassign && activitiesToReassign.length > 0) {
      const { error: updateActivitiesError } = await adminClient
        .from('activities')
        .update({ account_id: primaryAccount.id })
        .in('account_id', accountsToDeleteIds);

      if (updateActivitiesError) {
        throw updateActivitiesError;
      }
    }

    // Reassign notes from merged accounts to primary account
    const { data: notesToReassign } = await adminClient
      .from('notes')
      .select('id')
      .in('account_id', accountsToDeleteIds)
      .limit(1);

    if (notesToReassign && notesToReassign.length > 0) {
      const { error: updateNotesError } = await adminClient
        .from('notes')
        .update({ account_id: primaryAccount.id })
        .in('account_id', accountsToDeleteIds);

      if (updateNotesError) {
        throw updateNotesError;
      }
    }

    // Note: location_contacts don't need to be updated - they reference location_id,
    // which stays the same. The locations are just reassigned to a different account_id.

    // Update primary account to multi-location
    const { error: updateAccountError } = await adminClient
      .from('accounts')
      .update({
        account_type: 'multi_location',
        updated_at: new Date().toISOString(),
      })
      .eq('id', primaryAccount.id);

    if (updateAccountError) {
      throw updateAccountError;
    }

    // Delete the merged accounts (locations and related data already reassigned)
    const { error: deleteAccountsError } = await adminClient
      .from('accounts')
      .delete()
      .in('id', accountsToDeleteIds);

    if (deleteAccountsError) {
      throw deleteAccountsError;
    }

    // Verify all locations are now associated with the primary account
    const { data: finalLocations, error: finalLocationsError } = await adminClient
      .from('locations')
      .select('id, name, account_id')
      .eq('account_id', primaryAccount.id);

    if (finalLocationsError) {
      throw finalLocationsError;
    }

    // Verify counts for debugging
    const { data: finalAgreements } = await adminClient
      .from('agreements')
      .select('id', { count: 'exact' })
      .eq('account_id', primaryAccount.id);

    const { data: finalActivities } = await adminClient
      .from('activities')
      .select('id', { count: 'exact' })
      .eq('account_id', primaryAccount.id);

    const { data: finalNotes } = await adminClient
      .from('notes')
      .select('id', { count: 'exact' })
      .eq('account_id', primaryAccount.id);

    return NextResponse.json({
      success: true,
      mergedAccountId: primaryAccount.id,
      mergedAccountName: primaryAccount.name,
      locationCount: finalLocations?.length || 0,
      accountsMerged: accounts.length,
      agreementsCount: finalAgreements?.length || 0,
      activitiesCount: finalActivities?.length || 0,
      notesCount: finalNotes?.length || 0,
    });
  } catch (error: any) {
    console.error('Error merging accounts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to merge accounts' },
      { status: 500 }
    );
  }
}

