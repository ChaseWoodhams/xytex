import { createAdminClient } from './admin';
import type { Note } from './types';

export async function getNotesByAccount(accountId: string, userId?: string): Promise<Note[]> {
  try {
    const supabase = createAdminClient();
    
    // Get only account-level notes (location_id is null)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('corporate_account_id', accountId)
      .is('location_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', JSON.stringify(error, null, 2));
      return [];
    }

    if (!data) {
      return [];
    }

    // Filter private notes on the client side if userId is provided
    if (userId) {
      return data.filter(note => !note.is_private || note.created_by === userId);
    } else {
      return data.filter(note => !note.is_private);
    }
  } catch (err) {
    console.error('Unexpected error fetching notes:', err);
    return [];
  }
}

export async function getNotesByLocation(locationId: string, userId?: string): Promise<Note[]> {
  try {
    const supabase = createAdminClient();
    
    // First, get all notes for the location
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes by location:', JSON.stringify(error, null, 2));
      return [];
    }

    if (!data) {
      return [];
    }

    // Filter private notes on the client side if userId is provided
    if (userId) {
      return data.filter(note => !note.is_private || note.created_by === userId);
    } else {
      return data.filter(note => !note.is_private);
    }
  } catch (err) {
    console.error('Unexpected error fetching notes by location:', err);
    return [];
  }
}

export async function createNote(
  noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>
): Promise<Note | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('notes')
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
  const { data, error } = await supabase
    .from('notes')
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

