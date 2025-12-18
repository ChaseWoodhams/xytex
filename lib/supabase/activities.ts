import { createAdminClient } from './admin';
import type { Activity, ActivityType } from './types';

export async function getActivitiesByAccount(accountId: string): Promise<Activity[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('account_id', accountId)
      .order('activity_date', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      // Return empty array instead of throwing to prevent page crashes
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception in getActivitiesByAccount:', err);
    // Return empty array instead of throwing to prevent page crashes
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
      console.error('Error fetching activities by location:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      // Return empty array instead of throwing to prevent page crashes
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception in getActivitiesByLocation:', err);
    // Return empty array instead of throwing to prevent page crashes
    return [];
  }
}

export async function createActivity(
  activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>
): Promise<Activity | null> {
  const supabase = createAdminClient();
  const { data, error } = await (supabase
    .from('activities') as any)
    .insert(activityData)
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
  updates: Partial<Omit<Activity, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'account_id'>>
): Promise<Activity | null> {
  const supabase = createAdminClient();
  const { data, error } = await (supabase
    .from('activities') as any)
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

