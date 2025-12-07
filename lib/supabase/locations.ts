import { createAdminClient } from './admin';
import type { Location, LocationStatus } from './types';

export async function getLocationsByAccount(accountId: string): Promise<Location[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('corporate_account_id', accountId)
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
  
  // If this is marked as primary, unset other primary locations for this account
  if (locationData.is_primary) {
    await (supabase
      .from('locations') as any)
      .update({ is_primary: false })
      .eq('corporate_account_id', locationData.corporate_account_id)
      .eq('is_primary', true);
  }

  const { data, error } = await (supabase
    .from('locations') as any)
    .insert(locationData)
    .select()
    .single();

  if (error) {
    console.error('Error creating location:', error);
    return null;
  }

  return data;
}

export async function updateLocation(
  id: string,
  updates: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at' | 'corporate_account_id'>>
): Promise<Location | null> {
  const supabase = createAdminClient();
  
  // If setting as primary, unset other primary locations
  if (updates.is_primary === true) {
    const location = await getLocationById(id);
    if (location) {
      await (supabase
        .from('locations') as any)
        .update({ is_primary: false })
        .eq('corporate_account_id', location.corporate_account_id)
        .eq('is_primary', true)
        .neq('id', id);
    }
  }

  const { data, error } = await (supabase
    .from('locations') as any)
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

