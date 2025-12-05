import { createClient } from './server';
import { createAdminClient } from './admin';
import type { Subscription } from './types';

export async function getUserSubscription(
  userId: string
): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data;
}

export async function startTrial(userId: string): Promise<boolean> {
  // Use admin client to bypass RLS for trial operations
  const supabase = createAdminClient();
  
  // Call the database function to start trial
  const { error } = await supabase.rpc('start_trial', {
    user_uuid: userId,
  });

  if (error) {
    console.error('Error starting trial:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return false;
  }

  return true;
}

export async function checkTrialStatus(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Call the database function to check trial status
  const { data, error } = await supabase.rpc('check_trial_status', {
    user_uuid: userId,
  });

  if (error) {
    console.error('Error checking trial status:', error);
    return false;
  }

  return data || false;
}

export async function isTrialExpired(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: user } = await supabase
    .from('users')
    .select('trial_expires_at')
    .eq('id', userId)
    .single();

  if (!user || !user.trial_expires_at) {
    return true;
  }

  return new Date(user.trial_expires_at) < new Date();
}

