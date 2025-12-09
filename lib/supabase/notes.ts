import { createAdminClient } from './admin';
import type { Note } from './types';

export async function getNotesByAccount(accountId: string, userId?: string): Promise<Note[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('notes')
    .select('*')
    .eq('account_id', accountId);

  // RLS policies already handle privacy filtering, but we can add additional client-side filtering if needed
  // The RLS policy allows: (NOT is_private) OR (is_private AND created_by = auth.uid())
  // So we don't need to duplicate this logic here, but we can filter for non-private notes if no userId
  if (!userId) {
    query = query.eq('is_private', false);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    const errorDetails = {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      accountId,
      userId,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    };
    console.error('Error fetching notes by account:', errorDetails);
    // Create a new error with more details to ensure it serializes properly
    const enhancedError = new Error(
      `Failed to fetch notes for account ${accountId}: ${error.message || 'Unknown error'}`
    );
    (enhancedError as any).originalError = error;
    (enhancedError as any).code = error.code;
    throw enhancedError;
  }

  return data || [];
}

export async function getNotesByLocation(locationId: string, userId?: string): Promise<Note[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('notes')
    .select('*')
    .eq('location_id', locationId);

  // RLS policies already handle privacy filtering, but we can add additional client-side filtering if needed
  // The RLS policy allows: (NOT is_private) OR (is_private AND created_by = auth.uid())
  // So we don't need to duplicate this logic here, but we can filter for non-private notes if no userId
  if (!userId) {
    query = query.eq('is_private', false);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    const errorDetails = {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      locationId,
      userId,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    };
    console.error('Error fetching notes by location:', errorDetails);
    // Create a new error with more details to ensure it serializes properly
    const enhancedError = new Error(
      `Failed to fetch notes for location ${locationId}: ${error.message || 'Unknown error'}`
    );
    (enhancedError as any).originalError = error;
    (enhancedError as any).code = error.code;
    throw enhancedError;
  }

  return data || [];
}

export async function createNote(
  noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>
): Promise<Note | null> {
  const supabase = createAdminClient();
  const { data, error } = await (supabase
    .from('notes') as any)
    .insert(noteData)
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error);
    return null;
  }

  return data;
}

export async function updateNote(
  id: string,
  updates: Partial<Omit<Note, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'account_id'>>
): Promise<Note | null> {
  const supabase = createAdminClient();
  const { data, error } = await (supabase
    .from('notes') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating note:', error);
    return null;
  }

  return data;
}

export async function deleteNote(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting note:', error);
    return false;
  }

  return true;
}

