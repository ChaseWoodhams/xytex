import { createAdminClient } from './admin';
import type { LocationContact, ContactRole } from './types';

/**
 * Get all contacts for a location
 */
export async function getLocationContacts(locationId: string): Promise<LocationContact[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('location_contacts')
    .select('*')
    .eq('location_id', locationId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching location contacts:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single contact by ID
 */
export async function getLocationContactById(id: string): Promise<LocationContact | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('location_contacts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching location contact:', error);
    return null;
  }

  return data;
}

/**
 * Create a new location contact
 */
export async function createLocationContact(
  contactData: Omit<LocationContact, 'id' | 'created_at' | 'updated_at'>
): Promise<LocationContact | null> {
  const supabase = createAdminClient();

  // If this contact is marked as primary, unset other primary contacts for this location
  if (contactData.is_primary) {
    await supabase
      .from('location_contacts')
      .update({ is_primary: false } as any)
      .eq('location_id', contactData.location_id)
      .eq('is_primary', true);
  }

  const { data, error } = await supabase
    .from('location_contacts')
    .insert(contactData)
    .select()
    .single();

  if (error) {
    console.error('Error creating location contact:', error);
    return null;
  }

  return data;
}

/**
 * Update a location contact
 */
export async function updateLocationContact(
  id: string,
  updates: Partial<Omit<LocationContact, 'id' | 'location_id' | 'created_at' | 'updated_at'>>
): Promise<LocationContact | null> {
  const supabase = createAdminClient();

  // If this contact is being set as primary, unset other primary contacts
  if (updates.is_primary === true) {
    const contact = await getLocationContactById(id);
    if (contact) {
      await supabase
        .from('location_contacts')
        .update({ is_primary: false } as any)
        .eq('location_id', contact.location_id)
        .eq('is_primary', true)
        .neq('id', id);
    }
  }

  const { data, error } = await supabase
    .from('location_contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating location contact:', error);
    return null;
  }

  return data;
}

/**
 * Delete a location contact
 */
export async function deleteLocationContact(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('location_contacts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting location contact:', error);
    return false;
  }

  return true;
}

