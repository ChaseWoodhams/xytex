import { createAdminClient } from './admin';
import type { Note } from './types';

export async function getNotesByAccount(accountId: string, userId?: string): Promise<Note[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('notes')
    .select('*')
    .eq('corporate_account_id', accountId);

  // Filter out private notes that don't belong to the user
  if (userId) {
    query = query.or(`is_private.eq.false,is_private.eq.true.and.created_by.eq.${userId}`);
  } else {
    query = query.eq('is_private', false);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }

  return data || [];
}

export async function getNotesByLocation(locationId: string, userId?: string): Promise<Note[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from('notes')
    .select('*')
    .eq('location_id', locationId);

  // Filter out private notes that don't belong to the user
  if (userId) {
    query = query.or(`is_private.eq.false,is_private.eq.true.and.created_by.eq.${userId}`);
  } else {
    query = query.eq('is_private', false);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
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
  updates: Partial<Omit<Note, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'corporate_account_id'>>
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

