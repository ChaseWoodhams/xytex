import { createAdminClient } from './admin';
import type { Activity, ActivityType, Database } from './types';

export async function getActivitiesByAccount(accountId: string): Promise<Activity[]> {
  try {
    const supabase = createAdminClient();
    // Get only account-level activities (location_id is null)
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('corporate_account_id', accountId)
      .is('location_id', null)
      .order('activity_date', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', JSON.stringify(error, null, 2));
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching activities:', err);
    return [];
  }
}

export async function getActivitiesByLocation(locationId: string): Promise<Activity[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('location_id', locationId)
      .order('activity_date', { ascending: false });

    if (error) {
      console.error('Error fetching activities by location:', JSON.stringify(error, null, 2));
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching activities by location:', err);
    return [];
  }
}

export async function createActivity(
  activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>
): Promise<Activity | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('activities')
    .insert(activityData as Database['public']['Tables']['activities']['Insert'])
    .select()
    .single();

  if (error) {
    console.error('Error creating activity:', error);
    return null;
  }

  return data;
}

export async function updateActivity(
  id: string,
  updates: Partial<Omit<Activity, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'corporate_account_id'>>
): Promise<Activity | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('activities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating activity:', error);
    return null;
  }

  return data;
}

export async function deleteActivity(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting activity:', error);
    return false;
  }

  return true;
}

