import { createAdminClient } from './admin';
import type { Location } from './types';
import { getAccountById } from './accounts';

export async function getLocationsByAccount(accountId: string): Promise<Location[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('account_id', accountId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    const errorDetails = {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    };
    console.error('Error fetching locations:', errorDetails);
    // Create a new error with more details to ensure it serializes properly
    const enhancedError = new Error(
      `Failed to fetch locations for account ${accountId}: ${error.message || 'Unknown error'}`
    );
    (enhancedError as any).originalError = error;
    (enhancedError as any).code = error.code;
    throw enhancedError;
  }

  return data || [];
}

export async function getLocationById(id: string): Promise<Location | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching location:', error);
    return null;
  }

  return data;
}

/**
 * Generate a unique clinic code for a location
 * Format: XYB-{ACCOUNT_ID_SHORT}-{location_number} (e.g., XYB-A1B2C3-001, XYB-A1B2C3-002)
 * Uses first 6 characters of account UUID to group locations by account
 * Only applies to locations, not accounts
 */
function generateClinicCode(
  accountId: string,
  existingLocations: Location[]
): string {
  // Get the next location number (1-indexed)
  const locationNumber = existingLocations.length + 1;
  const paddedNumber = locationNumber.toString().padStart(3, '0');
  
  // Use first 6 characters of account UUID (uppercase, no hyphens) as account identifier
  const accountIdentifier = accountId.replace(/-/g, '').substring(0, 6).toUpperCase();
  
  // Format: XYB-{ACCOUNT_ID_SHORT}-{LOCATION_NUMBER}
  return `XYB-${accountIdentifier}-${paddedNumber}`;
}

export async function createLocation(
  locationData: Omit<Location, 'id' | 'created_at' | 'updated_at' | 'clinic_code'> & { clinic_code?: string | null }
): Promise<Location | null> {
  const supabase = createAdminClient();
  
  // Check if this account already has locations
  const existingLocations = await getLocationsByAccount(locationData.account_id);
  
  // Auto-generate clinic code for locations only (not accounts)
  // Format: XYB-{ACCOUNT_ID_SHORT}-001, XYB-{ACCOUNT_ID_SHORT}-002, etc.
  let clinicCode = locationData.clinic_code || null;
  if (!clinicCode) {
    clinicCode = generateClinicCode(locationData.account_id, existingLocations);
  }
  
  // If this is marked as primary, unset other primary locations for this account
  if (locationData.is_primary) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('locations') as any)
      .update({ is_primary: false })
      .eq('account_id', locationData.account_id)
      .eq('is_primary', true);
  }

  // Prepare location data with auto-generated clinic code
  const locationToInsert = {
    ...locationData,
    clinic_code: clinicCode,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('locations') as any)
    .insert(locationToInsert)
    .select()
    .single();

  if (error) {
    console.error('Error creating location:', error);
    return null;
  }

  // If this is the second location (or more), convert account to multi_location
  if (existingLocations.length >= 1) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('accounts') as any)
      .update({ account_type: 'multi_location' })
      .eq('id', locationData.account_id);

    if (updateError) {
      console.error('Error updating account type:', updateError);
      // Don't fail the location creation if account update fails
    }
  }

  // If this is the first location for a multi-location account, set clinic name to this location's name
  if (existingLocations.length === 0) {
    const account = await getAccountById(locationData.account_id);
    if (account && account.account_type === 'multi_location' && !account.udf_clinic_name) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('accounts') as any)
        .update({ udf_clinic_name: locationData.name })
        .eq('id', locationData.account_id);
      console.log(`[createLocation] Set account clinic name to first location name: ${locationData.name}`);
    }
  }

  return data;
}

export async function updateLocation(
  id: string,
  updates: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at' | 'account_id'>>
): Promise<Location | null> {
  const supabase = createAdminClient();
  
  // If setting as primary, unset other primary locations
  if (updates.is_primary === true) {
    const location = await getLocationById(id);
    if (location) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('locations') as any)
        .update({ is_primary: false })
        .eq('account_id', location.account_id)
        .eq('is_primary', true)
        .neq('id', id);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('locations') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating location:', error);
    return null;
  }

  return data;
}

export async function deleteLocation(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting location:', error);
    return false;
  }

  return true;
}

