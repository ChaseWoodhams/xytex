import { createAdminClient } from './admin';
import type { Location, LocationStatus } from './types';

/**
 * Get location counts for multiple accounts at once
 */
/**
 * Get all locations (both corporate and standalone)
 */
export async function getAllLocations(): Promise<Location[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all locations:', JSON.stringify(error, null, 2));
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching all locations:', err);
    return [];
  }
}

export async function getLocationCountsByAccounts(accountIds: string[]): Promise<Record<string, number>> {
  if (accountIds.length === 0) {
    return {};
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('locations')
      .select('corporate_account_id')
      .in('corporate_account_id', accountIds);

    if (error) {
      console.error('Error fetching location counts:', JSON.stringify(error, null, 2));
      return {};
    }

    // Count locations per account
    const counts: Record<string, number> = {};
    accountIds.forEach(id => {
      counts[id] = 0;
    });

    if (data) {
      data.forEach((location) => {
        const accountId = location.corporate_account_id;
        counts[accountId] = (counts[accountId] || 0) + 1;
      });
    }

    return counts;
  } catch (err) {
    console.error('Unexpected error fetching location counts:', err);
    return {};
  }
}

export async function getLocationsByAccount(accountId: string): Promise<Location[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('corporate_account_id', accountId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching locations:', JSON.stringify(error, null, 2));
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching locations:', err);
    return [];
  }
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
    await supabase
      .from('locations')
      .update({ is_primary: false })
      .eq('corporate_account_id', locationData.corporate_account_id)
      .eq('is_primary', true);
  }

  const { data, error } = await supabase
    .from('locations')
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
      await supabase
        .from('locations')
        .update({ is_primary: false })
        .eq('corporate_account_id', location.corporate_account_id)
        .eq('is_primary', true)
        .neq('id', id);
    }
  }

  const { data, error } = await supabase
    .from('locations')
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

