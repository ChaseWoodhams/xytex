import { createAdminClient } from './admin';
import type { AccountUpload, Account } from './types';

export async function getAccountUploads(): Promise<AccountUpload[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('account_uploads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching account uploads:', error);
    throw new Error(`Failed to fetch account uploads: ${error.message}`);
  }

  return data || [];
}

export async function getAccountUploadById(id: string): Promise<AccountUpload | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('account_uploads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching account upload:', error);
    return null;
  }

  return data;
}

export async function createAccountUpload(
  uploadData: Omit<AccountUpload, 'id' | 'created_at' | 'updated_at' | 'reverted_at' | 'reverted_by' | 'status'>
): Promise<AccountUpload | null> {
  const supabase = createAdminClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('account_uploads') as any)
    .insert({
      ...uploadData,
      status: 'completed',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating account upload:', error);
    return null;
  }

  return data;
}

export async function revertAccountUpload(
  uploadId: string,
  revertedBy: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  const supabase = createAdminClient();
  
  // Get the upload record first
  const upload = await getAccountUploadById(uploadId);
  if (!upload) {
    return { success: false, deletedCount: 0, error: 'Upload not found' };
  }

  if (upload.status === 'reverted') {
    return { success: false, deletedCount: 0, error: 'Upload has already been reverted' };
  }

  // First, delete all locations associated with accounts from this upload batch
  // (cascade should handle this, but let's be explicit)
  const { error: locDeleteError } = await supabase
    .from('locations')
    .delete()
    .in('account_id', 
      supabase
        .from('accounts')
        .select('id')
        .eq('upload_batch_id', uploadId)
    );

  if (locDeleteError) {
    console.error('Error deleting locations:', locDeleteError);
    // Continue anyway - the account deletion might cascade
  }

  // Delete all accounts associated with this upload batch
  const { data: deletedAccounts, error: deleteError } = await supabase
    .from('accounts')
    .delete()
    .eq('upload_batch_id', uploadId)
    .select('id');

  if (deleteError) {
    console.error('Error deleting accounts:', deleteError);
    return { success: false, deletedCount: 0, error: `Failed to delete accounts: ${deleteError.message}` };
  }

  const deletedCount = deletedAccounts?.length || 0;

  // Update the upload record to mark it as reverted
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase.from('account_uploads') as any)
    .update({
      status: 'reverted',
      reverted_at: new Date().toISOString(),
      reverted_by: revertedBy,
      account_count: 0,
    })
    .eq('id', uploadId);

  if (updateError) {
    console.error('Error updating upload status:', updateError);
    return { success: false, deletedCount, error: `Accounts deleted but failed to update upload record: ${updateError.message}` };
  }

  return { success: true, deletedCount };
}

// Define the expected CSV column mappings for bulk account+location creation
export const ACCOUNT_CSV_FIELDS = [
  // Account fields
  { key: 'name', label: 'Account/Location Name', required: true, group: 'account' },
  { key: 'website', label: 'Website', required: false, group: 'account' },
  { key: 'industry', label: 'Industry', required: false, group: 'account' },
  { key: 'primary_contact_name', label: 'Contact Name', required: false, group: 'account' },
  { key: 'primary_contact_email', label: 'Contact Email', required: false, group: 'account' },
  { key: 'primary_contact_phone', label: 'Contact Phone', required: false, group: 'account' },
  { key: 'notes', label: 'Notes', required: false, group: 'account' },
  { key: 'sage_code', label: 'Sage Code', required: false, group: 'account' },
  // Location/Address fields
  { key: 'address_line1', label: 'Address Line 1', required: false, group: 'location' },
  { key: 'address_line2', label: 'Address Line 2', required: false, group: 'location' },
  { key: 'city', label: 'City', required: false, group: 'location' },
  { key: 'state', label: 'State', required: false, group: 'location' },
  { key: 'zip_code', label: 'ZIP Code', required: false, group: 'location' },
  { key: 'country', label: 'Country', required: false, group: 'location' },
  { key: 'phone', label: 'Phone', required: false, group: 'location' },
  { key: 'email', label: 'Email', required: false, group: 'location' },
] as const;

export type AccountCsvFieldKey = typeof ACCOUNT_CSV_FIELDS[number]['key'];

export interface BulkAccountData {
  // Account fields
  name: string;
  website?: string | null;
  industry?: string | null;
  primary_contact_name?: string | null;
  primary_contact_email?: string | null;
  primary_contact_phone?: string | null;
  notes?: string | null;
  sage_code?: string | null;
  // Location fields
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
}

export async function bulkCreateAccounts(
  accounts: BulkAccountData[],
  uploadBatchId: string,
  listName: string,
  createdBy: string
): Promise<{ success: boolean; created: Account[]; errors: string[] }> {
  const supabase = createAdminClient();
  const created: Account[] = [];
  const errors: string[] = [];

  console.log(`[bulkCreateAccounts] Starting: ${accounts.length} accounts to process`);

  for (let i = 0; i < accounts.length; i++) {
    const acc = accounts[i];
    
    if (!acc.name || acc.name.trim() === '') {
      errors.push(`Row ${i + 1}: Account name is required`);
      continue;
    }

    try {
      if ((i + 1) % 10 === 0) {
        console.log(`[bulkCreateAccounts] Progress: ${i + 1}/${accounts.length} accounts processed`);
      }
      // Create the account
      const accountToInsert = {
        name: acc.name.trim(),
        website: acc.website?.trim() || null,
        industry: acc.industry?.trim() || null,
        primary_contact_name: acc.primary_contact_name?.trim() || null,
        primary_contact_email: acc.primary_contact_email?.trim() || null,
        primary_contact_phone: acc.primary_contact_phone?.trim() || null,
        notes: acc.notes?.trim() || null,
        sage_code: acc.sage_code?.trim() || null,
        status: 'active' as const,
        account_type: 'single_location' as const,
        upload_batch_id: uploadBatchId,
        upload_list_name: listName,
        created_by: createdBy,
        // Copy address fields to UDF fields for account-level address
        udf_address_line1: acc.address_line1?.trim() || null,
        udf_city: acc.city?.trim() || null,
        udf_state: acc.state?.trim() || null,
        udf_zipcode: acc.zip_code?.trim() || null,
        udf_country_code: acc.country?.trim() || null,
        udf_phone: acc.phone?.trim() || null,
        udf_email: acc.email?.trim() || null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: accountData, error: accountError } = await (supabase.from('accounts') as any)
        .insert(accountToInsert)
        .select()
        .single();

      if (accountError) {
        errors.push(`Row ${i + 1} (${acc.name}): ${accountError.message}`);
        continue;
      }

      if (!accountData) {
        errors.push(`Row ${i + 1} (${acc.name}): Account creation returned no data`);
        continue;
      }

      // Create the associated location
      // Note: upload_batch_id is null here because locations created as part of account uploads
      // are tracked via the account's upload_batch_id, not location_uploads
      const locationToInsert = {
        account_id: accountData.id,
        name: acc.name.trim(),
        address_line1: acc.address_line1?.trim() || null,
        address_line2: acc.address_line2?.trim() || null,
        city: acc.city?.trim() || null,
        state: acc.state?.trim() || null,
        zip_code: acc.zip_code?.trim() || null,
        country: acc.country?.trim() || 'USA',
        phone: acc.phone?.trim() || null,
        email: acc.email?.trim() || null,
        contact_name: acc.primary_contact_name?.trim() || null,
        is_primary: true,
        status: 'active' as const,
        upload_batch_id: null, // Locations from account uploads don't reference location_uploads
        upload_list_name: null, // Locations from account uploads don't have a separate list name
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: locationError } = await (supabase.from('locations') as any)
        .insert(locationToInsert);

      if (locationError) {
        // Log the error but don't fail - the account was created
        console.error(`Row ${i + 1}: Location creation failed:`, locationError);
        errors.push(`Row ${i + 1} (${acc.name}): Account created but location failed: ${locationError.message}`);
      }

      created.push(accountData);
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      console.error(`[bulkCreateAccounts] Error creating account ${i + 1} (${acc.name}):`, errorMsg);
      errors.push(`Row ${i + 1} (${acc.name}): ${errorMsg}`);
    }
  }

  console.log(`[bulkCreateAccounts] Completed: ${created.length} created, ${errors.length} errors`);
  return { success: errors.length === 0, created, errors };
}

