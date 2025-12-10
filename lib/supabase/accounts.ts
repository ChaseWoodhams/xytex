import { createAdminClient } from './admin';
import type { Account, AccountStatus } from './types';

export interface AccountFilters {
  status?: AccountStatus;
  industry?: string;
  search?: string;
}

export async function getAccounts(
  filters?: AccountFilters
): Promise<Account[]> {
  const supabase = createAdminClient();
  let query = supabase.from('accounts').select('*');

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  // Note: deal_stage filter removed as the column was dropped in migration 004

  if (filters?.industry) {
    query = query.eq('industry', filters.industry);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,primary_contact_name.ilike.%${filters.search}%,primary_contact_email.ilike.%${filters.search}%`);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching accounts:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      fullError: error
    });
    throw error;
  }

  const accounts = data || [];
  console.log(`[getAccounts] Found ${accounts.length} accounts`);
  return accounts;
}

export async function getAccountById(id: string): Promise<Account | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching account:', error);
    return null;
  }

  return data;
}

export async function createAccount(
  accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>
): Promise<Account | null> {
  const supabase = createAdminClient();
  
  // deal_stage was removed from the database schema, so we don't need to destructure it
  // Keep account_type as it should exist (migration 010 adds it)
  const dbAccountData = accountData;
  
  const { data, error } = await (supabase
    .from('accounts') as any)
    .insert(dbAccountData)
    .select()
    .single();

  if (error) {
    console.error('Error creating account:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      fullError: error
    });
    throw new Error(error.message || 'Failed to create account');
  }

  // For single-location accounts: ensure clinic name = account name (no duplication)
  if (data && data.account_type === 'single_location' && data.udf_clinic_name !== data.name) {
    await (supabase.from('accounts') as any)
      .update({ udf_clinic_name: data.name })
      .eq('id', data.id);
    data.udf_clinic_name = data.name;
  }

  // Automatically create a location for single-location accounts
  if (data && data.account_type === 'single_location') {
    try {
      // Use dynamic import to avoid circular dependency
      const { createLocation } = await import('./locations');
      
      const locationData = {
        account_id: data.id,
        name: data.name, // Use account name as location name (same as clinic name)
        address_line1: data.udf_address_line1 || null,
        address_line2: data.udf_address_line2 || null,
        city: data.udf_city || null,
        state: data.udf_state || null,
        zip_code: data.udf_zipcode || null,
        country: data.udf_country_code || 'USA',
        phone: data.udf_phone || data.primary_contact_phone || null,
        email: data.udf_email || data.primary_contact_email || null,
        contact_name: data.primary_contact_name || null,
        contact_title: null,
        is_primary: true, // Single location is always primary
        status: 'active' as const,
        notes: data.notes || null,
        sage_code: null, // Location sage code is separate from account sage code
      };

      const location = await createLocation(locationData);
      if (location) {
        console.log(`[createAccount] Auto-created location ${location.id} for single-location account ${data.id}`);
      } else {
        console.error(`[createAccount] Failed to auto-create location for account ${data.id}`);
        // Don't fail account creation if location creation fails, but log it
      }
    } catch (locationError: any) {
      console.error('Error auto-creating location for single-location account:', locationError);
      // Don't fail account creation if location creation fails
    }
  }

  return data;
}

export async function updateAccount(
  id: string,
  updates: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at' | 'created_by'>>
): Promise<Account | null> {
  const supabase = createAdminClient();
  const { data, error } = await (supabase
    .from('accounts') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating account:', error);
    return null;
  }

  // For single-location accounts: ensure clinic name = account name (no duplication)
  if (data && data.account_type === 'single_location' && data.udf_clinic_name !== data.name) {
    await (supabase.from('accounts') as any)
      .update({ udf_clinic_name: data.name })
      .eq('id', id);
    data.udf_clinic_name = data.name;
  }

  // If this is a single-location account, sync the location with account data
  if (data && data.account_type === 'single_location') {
    try {
      // Use dynamic import to avoid circular dependency
      const { getLocationsByAccount } = await import('./locations');
      const existingLocations = await getLocationsByAccount(id);
      const primaryLocation = existingLocations.find(loc => loc.is_primary) || existingLocations[0];
      
      if (primaryLocation) {
        // Update the existing location with account data
        const { updateLocation } = await import('./locations');
        await updateLocation(primaryLocation.id, {
          name: data.name, // Keep location name in sync with account name (same as clinic name)
          address_line1: data.udf_address_line1 || null,
          address_line2: data.udf_address_line2 || null,
          city: data.udf_city || null,
          state: data.udf_state || null,
          zip_code: data.udf_zipcode || null,
          country: data.udf_country_code || 'USA',
          phone: data.udf_phone || data.primary_contact_phone || null,
          email: data.udf_email || data.primary_contact_email || null,
          contact_name: data.primary_contact_name || null,
          notes: data.notes || null,
        });
        console.log(`[updateAccount] Synced location ${primaryLocation.id} with account ${id} data`);
      } else {
        // No location exists yet, create one
        const { createLocation } = await import('./locations');
        const locationData = {
          account_id: id,
          name: data.name,
          address_line1: data.udf_address_line1 || null,
          address_line2: data.udf_address_line2 || null,
          city: data.udf_city || null,
          state: data.udf_state || null,
          zip_code: data.udf_zipcode || null,
          country: data.udf_country_code || 'USA',
          phone: data.udf_phone || data.primary_contact_phone || null,
          email: data.udf_email || data.primary_contact_email || null,
          contact_name: data.primary_contact_name || null,
          contact_title: null,
          is_primary: true,
          status: 'active' as const,
          notes: data.notes || null,
          sage_code: null,
        };
        await createLocation(locationData);
        console.log(`[updateAccount] Auto-created location for single-location account ${id}`);
      }
    } catch (locationError: any) {
      console.error('Error syncing location for single-location account:', locationError);
      // Don't fail account update if location sync fails
    }
  }

  return data;
}

export async function deleteAccount(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  
  try {
    // First, verify the account exists and get its details
    const accountQuery = await supabase
      .from('accounts')
      .select('id, name, created_by')
      .eq('id', id)
      .single();
    
    const { data: existingAccount, error: fetchError } = accountQuery;

    if (fetchError) {
      console.error('Error fetching account before deletion:', {
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        code: fetchError.code,
        fullError: fetchError
      });
      throw new Error(`Failed to fetch account: ${fetchError.message}`);
    }

    if (!existingAccount || !('id' in existingAccount)) {
      console.error(`Account with id ${id} not found`);
      throw new Error(`Account with id ${id} not found`);
    }

    const accountData = existingAccount as { id: string; name: string; created_by: string | null };

    // Check if created_by references a valid user (this shouldn't block deletion, but helps with debugging)
    if (accountData.created_by) {
      const { data: userCheck } = await supabase
        .from('users')
        .select('id')
        .eq('id', accountData.created_by)
        .single();
      
      if (!userCheck) {
        console.warn(`Account ${id} has invalid created_by reference: ${accountData.created_by}`);
        // This shouldn't prevent deletion, but we log it for debugging
      }
    }

    // Delete related data first to avoid any constraint issues
    // Note: These should cascade automatically, but we'll delete them explicitly to be safe
    try {
      // Delete locations (should cascade, but explicit deletion is safer)
      await supabase
        .from('locations')
        .delete()
        .eq('account_id', id);
      
      // Delete agreements (should cascade, but explicit deletion is safer)
      await supabase
        .from('agreements')
        .delete()
        .eq('account_id', id);
      
      // Delete activities (should cascade, but explicit deletion is safer)
      await supabase
        .from('activities')
        .delete()
        .eq('account_id', id);
      
      // Delete notes (should cascade, but explicit deletion is safer)
      await supabase
        .from('notes')
        .delete()
        .eq('account_id', id);
    } catch (relatedDataError: unknown) {
      const errorMessage = relatedDataError instanceof Error ? relatedDataError.message : 'Unknown error';
      console.warn('Error deleting related data (may not exist):', errorMessage);
      // Continue with account deletion even if related data deletion fails
    }

    // Delete the account and return the deleted row to verify deletion
    const { data: deletedData, error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error deleting account:', {
        accountId: id,
        accountName: accountData.name,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      });
      throw new Error(`Failed to delete account: ${error.message}${error.hint ? ` (${error.hint})` : ''}`);
    }

    // Verify that a row was actually deleted
    if (!deletedData || deletedData.length === 0) {
      console.error(`Failed to delete account ${id}: No rows were deleted`);
      throw new Error(`Failed to delete account ${id}: No rows were deleted`);
    }

    console.log(`Successfully deleted account ${id} (${accountData.name})`);
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error in deleteAccount:', {
      accountId: id,
      error: errorMessage,
      stack: errorStack
    });
    throw error; // Re-throw to allow API route to handle it
  }
}
