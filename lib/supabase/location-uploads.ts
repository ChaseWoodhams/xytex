import { createAdminClient } from './admin';
import type { LocationUpload, Location } from './types';

export async function getLocationUploadsByAccount(accountId: string): Promise<LocationUpload[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('location_uploads')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching location uploads:', error);
    throw new Error(`Failed to fetch location uploads: ${error.message}`);
  }

  return data || [];
}

export async function getLocationUploadById(id: string): Promise<LocationUpload | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('location_uploads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching location upload:', error);
    return null;
  }

  return data;
}

export async function createLocationUpload(
  uploadData: Omit<LocationUpload, 'id' | 'created_at' | 'updated_at' | 'reverted_at' | 'reverted_by' | 'status'>
): Promise<LocationUpload | null> {
  const supabase = createAdminClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('location_uploads') as any)
    .insert({
      ...uploadData,
      status: 'completed',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating location upload:', error);
    return null;
  }

  return data;
}

export async function revertLocationUpload(
  uploadId: string,
  revertedBy: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  const supabase = createAdminClient();
  
  // Get the upload record first
  const upload = await getLocationUploadById(uploadId);
  if (!upload) {
    return { success: false, deletedCount: 0, error: 'Upload not found' };
  }

  if (upload.status === 'reverted') {
    return { success: false, deletedCount: 0, error: 'Upload has already been reverted' };
  }

  // Delete all locations associated with this upload batch
  const { data: deletedLocations, error: deleteError } = await supabase
    .from('locations')
    .delete()
    .eq('upload_batch_id', uploadId)
    .select('id');

  if (deleteError) {
    console.error('Error deleting locations:', deleteError);
    return { success: false, deletedCount: 0, error: `Failed to delete locations: ${deleteError.message}` };
  }

  const deletedCount = deletedLocations?.length || 0;

  // Update the upload record to mark it as reverted
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase.from('location_uploads') as any)
    .update({
      status: 'reverted',
      reverted_at: new Date().toISOString(),
      reverted_by: revertedBy,
      location_count: 0,
    })
    .eq('id', uploadId);

  if (updateError) {
    console.error('Error updating upload status:', updateError);
    return { success: false, deletedCount, error: `Locations deleted but failed to update upload record: ${updateError.message}` };
  }

  return { success: true, deletedCount };
}

export async function getLocationsByUploadBatch(uploadBatchId: string): Promise<Location[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('upload_batch_id', uploadBatchId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching locations by batch:', error);
    throw new Error(`Failed to fetch locations: ${error.message}`);
  }

  return data || [];
}

// Define the expected CSV column mappings
export const LOCATION_CSV_FIELDS = [
  { key: 'name', label: 'Location Name', required: true },
  { key: 'address_line1', label: 'Address Line 1', required: false },
  { key: 'address_line2', label: 'Address Line 2', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'zip_code', label: 'ZIP Code', required: false },
  { key: 'country', label: 'Country', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'contact_name', label: 'Contact Name', required: false },
  { key: 'contact_title', label: 'Contact Title', required: false },
  { key: 'notes', label: 'Notes', required: false },
  { key: 'clinic_code', label: 'Clinic Code', required: false },
  { key: 'sage_code', label: 'Sage Code', required: false },
] as const;

export type LocationCsvFieldKey = typeof LOCATION_CSV_FIELDS[number]['key'];

export interface BulkLocationData {
  name: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string;
  phone?: string | null;
  email?: string | null;
  contact_name?: string | null;
  contact_title?: string | null;
  notes?: string | null;
  clinic_code?: string | null;
  sage_code?: string | null;
}

export async function bulkCreateLocations(
  accountId: string,
  locations: BulkLocationData[],
  uploadBatchId: string,
  listName: string
): Promise<{ success: boolean; created: Location[]; errors: string[] }> {
  const supabase = createAdminClient();
  const created: Location[] = [];
  const errors: string[] = [];

  // Get existing locations to determine clinic code numbers
  const { data: existingLocations } = await supabase
    .from('locations')
    .select('id')
    .eq('account_id', accountId);

  let locationIndex = existingLocations?.length || 0;

  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    
    if (!loc.name || loc.name.trim() === '') {
      errors.push(`Row ${i + 1}: Location name is required`);
      continue;
    }

    // Generate clinic code
    locationIndex++;
    const paddedNumber = locationIndex.toString().padStart(3, '0');
    const accountIdentifier = accountId.replace(/-/g, '').substring(0, 6).toUpperCase();
    const clinicCode = loc.clinic_code || `XYB-${accountIdentifier}-${paddedNumber}`;

    const locationToInsert = {
      account_id: accountId,
      name: loc.name.trim(),
      address_line1: loc.address_line1?.trim() || null,
      address_line2: loc.address_line2?.trim() || null,
      city: loc.city?.trim() || null,
      state: loc.state?.trim() || null,
      zip_code: loc.zip_code?.trim() || null,
      country: loc.country?.trim() || 'USA',
      phone: loc.phone?.trim() || null,
      email: loc.email?.trim() || null,
      contact_name: loc.contact_name?.trim() || null,
      contact_title: loc.contact_title?.trim() || null,
      notes: loc.notes?.trim() || null,
      clinic_code: clinicCode,
      sage_code: loc.sage_code?.trim() || null,
      is_primary: false,
      status: 'active' as const,
      upload_batch_id: uploadBatchId,
      upload_list_name: listName,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('locations') as any)
      .insert(locationToInsert)
      .select()
      .single();

    if (error) {
      errors.push(`Row ${i + 1} (${loc.name}): ${error.message}`);
      locationIndex--; // Revert the index increment since this location wasn't created
    } else if (data) {
      created.push(data);
    }
  }

  return { success: errors.length === 0, created, errors };
}

