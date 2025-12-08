import { createAdminClient } from './admin';
import type { Location } from './types';

export async function getLocationsByAccount(accountId: string): Promise<Location[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('account_id', accountId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching locations:', error);
    throw error;
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

export async function createLocation(
  locationData: Omit<Location, 'id' | 'created_at' | 'updated_at'>
): Promise<Location | null> {
  const supabase = createAdminClient();
  
  // Check if this account already has locations
  const existingLocations = await getLocationsByAccount(locationData.account_id);
  
  // If this is marked as primary, unset other primary locations for this account
  if (locationData.is_primary) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('locations') as any)
      .update({ is_primary: false })
      .eq('account_id', locationData.account_id)
      .eq('is_primary', true);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('locations') as any)
    .insert(locationData)
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

