import { createClient } from './server';
import { createAdminClient } from './admin';
import type { User } from './types';

export async function getUserById(id: string): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  return getUserById(authUser.id);
}

export async function createUserProfile(
  userId: string,
  email: string,
  fullName?: string,
  phone?: string,
  role: 'customer' | 'bd_team' | 'admin' = 'customer'
): Promise<User | null> {
  // Use admin client to bypass RLS for user creation
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      full_name: fullName || null,
      phone: phone || null,
      role,
      subscription_status: 'free_trial',
      trial_started_at: new Date().toISOString(),
      trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return null;
  }

  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }

  return data;
}

