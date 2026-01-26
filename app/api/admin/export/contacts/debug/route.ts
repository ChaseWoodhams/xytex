import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';

/**
 * Debug endpoint to verify data exists and queries work
 * Returns JSON with counts, samples, and query status
 */
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

    const adminClient = createAdminClient();
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      queries: {},
      errors: [],
    };

    // Test accounts query
    try {
      const { data: accountsData, error: accountsError } = await adminClient
        .from('accounts')
        .select('*')
        .limit(5);

      debugInfo.queries.accounts = {
        success: !accountsError,
        count: accountsData?.length || 0,
        error: accountsError ? {
          message: accountsError.message,
          code: accountsError.code,
          details: accountsError.details,
        } : null,
        sample: accountsData && accountsData.length > 0 ? accountsData[0] : null,
      };

      // Get total count
      const { count: totalAccounts } = await adminClient
        .from('accounts')
        .select('*', { count: 'exact', head: true });
      debugInfo.queries.accounts.totalCount = totalAccounts || 0;
    } catch (error: any) {
      debugInfo.errors.push({
        query: 'accounts',
        error: error.message,
        stack: error.stack,
      });
    }

    // Test locations query
    try {
      const { data: locationsData, error: locationsError } = await adminClient
        .from('locations')
        .select('*')
        .limit(5);

      debugInfo.queries.locations = {
        success: !locationsError,
        count: locationsData?.length || 0,
        error: locationsError ? {
          message: locationsError.message,
          code: locationsError.code,
          details: locationsError.details,
        } : null,
        sample: locationsData && locationsData.length > 0 ? locationsData[0] : null,
      };

      // Get total count
      const { count: totalLocations } = await adminClient
        .from('locations')
        .select('*', { count: 'exact', head: true });
      debugInfo.queries.locations.totalCount = totalLocations || 0;
    } catch (error: any) {
      debugInfo.errors.push({
        query: 'locations',
        error: error.message,
        stack: error.stack,
      });
    }

    // Test location_contacts query
    try {
      const { data: locationContactsData, error: locationContactsError } = await adminClient
        .from('location_contacts')
        .select('*')
        .limit(5);

      debugInfo.queries.location_contacts = {
        success: !locationContactsError,
        count: locationContactsData?.length || 0,
        error: locationContactsError ? {
          message: locationContactsError.message,
          code: locationContactsError.code,
          details: locationContactsError.details,
        } : null,
        sample: locationContactsData && locationContactsData.length > 0 ? locationContactsData[0] : null,
      };

      // Get total count
      const { count: totalLocationContacts } = await adminClient
        .from('location_contacts')
        .select('*', { count: 'exact', head: true });
      debugInfo.queries.location_contacts.totalCount = totalLocationContacts || 0;
    } catch (error: any) {
      debugInfo.errors.push({
        query: 'location_contacts',
        error: error.message,
        stack: error.stack,
      });
    }

    // Summary
    debugInfo.summary = {
      accountsTotal: debugInfo.queries.accounts?.totalCount || 0,
      locationsTotal: debugInfo.queries.locations?.totalCount || 0,
      locationContactsTotal: debugInfo.queries.location_contacts?.totalCount || 0,
      allQueriesSuccessful: 
        debugInfo.queries.accounts?.success &&
        debugInfo.queries.locations?.success &&
        debugInfo.queries.location_contacts?.success,
      hasErrors: debugInfo.errors.length > 0,
    };

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error: any) {
    console.error('[Export Debug] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
