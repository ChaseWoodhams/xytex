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

  // First, get all account IDs from this upload batch
  const { data: accountsToDelete, error: accountsFetchError } = await supabase
    .from('accounts')
    .select('id')
    .eq('upload_batch_id', uploadId);

  if (accountsFetchError) {
    console.error('Error fetching accounts for deletion:', accountsFetchError);
  }

  const accountIds = (accountsToDelete as { id: string }[] | null)?.map(acc => acc.id) || [];

  // Delete all locations associated with accounts from this upload batch
  // (cascade should handle this, but let's be explicit)
  if (accountIds.length > 0) {
    const { error: locationDeleteError } = await supabase
      .from('locations')
      .delete()
      .in('account_id', accountIds);

    if (locationDeleteError) {
      console.error('Error deleting locations:', locationDeleteError);
      // Continue anyway - the account deletion might cascade
    }
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
  // Grouping field — optional, allows multiple rows to create one multi-location account
  { key: 'parent_org', label: 'Parent Org / Account Group', required: false, group: 'grouping' },
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
  // Grouping field — if set, rows with the same parent_org form a single multi-location account
  parent_org?: string | null;
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
): Promise<{ success: boolean; created: Account[]; errors: string[]; accountCount: number; locationCount: number }> {
  // Check if any rows use parent_org grouping
  const hasGrouping = accounts.some(a => a.parent_org && a.parent_org.trim() !== '');
  
  if (hasGrouping) {
    return bulkCreateGroupedAccounts(accounts, uploadBatchId, listName, createdBy);
  }

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
        upload_batch_id: null,
        upload_list_name: null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: locationError } = await (supabase.from('locations') as any)
        .insert(locationToInsert);

      if (locationError) {
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
  return { success: errors.length === 0, created, errors, accountCount: created.length, locationCount: created.length };
}

/**
 * Creates accounts grouped by parent_org. Rows that share the same parent_org
 * value become a single multi-location account with multiple locations.
 * Rows without parent_org are created as single-location accounts.
 */
async function bulkCreateGroupedAccounts(
  accounts: BulkAccountData[],
  uploadBatchId: string,
  listName: string,
  createdBy: string
): Promise<{ success: boolean; created: Account[]; errors: string[]; accountCount: number; locationCount: number }> {
  const supabase = createAdminClient();
  const created: Account[] = [];
  const errors: string[] = [];
  let totalLocations = 0;

  // Group rows by parent_org; rows without it go into their own group
  const groups = new Map<string, { rows: BulkAccountData[]; originalIndices: number[] }>();
  const ungrouped: { row: BulkAccountData; index: number }[] = [];

  accounts.forEach((acc, i) => {
    const groupKey = acc.parent_org?.trim();
    if (groupKey) {
      const existing = groups.get(groupKey) || { rows: [], originalIndices: [] };
      existing.rows.push(acc);
      existing.originalIndices.push(i);
      groups.set(groupKey, existing);
    } else {
      ungrouped.push({ row: acc, index: i });
    }
  });

  console.log(`[bulkCreateGroupedAccounts] ${groups.size} groups, ${ungrouped.length} ungrouped rows`);

  // Create grouped (multi-location) accounts
  for (const [groupName, group] of groups) {
    const firstRow = group.rows[0];
    const isMulti = group.rows.length > 1;

    try {
      const accountToInsert = {
        name: groupName,
        website: firstRow.website?.trim() || null,
        industry: firstRow.industry?.trim() || null,
        primary_contact_name: firstRow.primary_contact_name?.trim() || null,
        primary_contact_email: firstRow.primary_contact_email?.trim() || null,
        primary_contact_phone: firstRow.primary_contact_phone?.trim() || null,
        notes: firstRow.notes?.trim() || null,
        sage_code: firstRow.sage_code?.trim() || null,
        status: 'active' as const,
        account_type: isMulti ? 'multi_location' as const : 'single_location' as const,
        upload_batch_id: uploadBatchId,
        upload_list_name: listName,
        created_by: createdBy,
        udf_address_line1: firstRow.address_line1?.trim() || null,
        udf_city: firstRow.city?.trim() || null,
        udf_state: firstRow.state?.trim() || null,
        udf_zipcode: firstRow.zip_code?.trim() || null,
        udf_country_code: firstRow.country?.trim() || null,
        udf_phone: firstRow.phone?.trim() || null,
        udf_email: firstRow.email?.trim() || null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: accountData, error: accountError } = await (supabase.from('accounts') as any)
        .insert(accountToInsert)
        .select()
        .single();

      if (accountError) {
        const rowNums = group.originalIndices.map(i => i + 1).join(', ');
        errors.push(`Group "${groupName}" (rows ${rowNums}): ${accountError.message}`);
        continue;
      }

      if (!accountData) {
        errors.push(`Group "${groupName}": Account creation returned no data`);
        continue;
      }

      // Create a location for each row in the group
      for (let j = 0; j < group.rows.length; j++) {
        const row = group.rows[j];
        const rowIndex = group.originalIndices[j];
        const locationName = row.name?.trim() || groupName;

        const locationToInsert = {
          account_id: accountData.id,
          name: locationName,
          address_line1: row.address_line1?.trim() || null,
          address_line2: row.address_line2?.trim() || null,
          city: row.city?.trim() || null,
          state: row.state?.trim() || null,
          zip_code: row.zip_code?.trim() || null,
          country: row.country?.trim() || 'USA',
          phone: row.phone?.trim() || null,
          email: row.email?.trim() || null,
          contact_name: row.primary_contact_name?.trim() || null,
          is_primary: j === 0,
          status: 'active' as const,
          upload_batch_id: null,
          upload_list_name: null,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: locationError } = await (supabase.from('locations') as any)
          .insert(locationToInsert);

        if (locationError) {
          errors.push(`Row ${rowIndex + 1} (${locationName}): Location failed: ${locationError.message}`);
        } else {
          totalLocations++;
        }
      }

      created.push(accountData);
    } catch (error: any) {
      errors.push(`Group "${groupName}": ${error.message || 'Unknown error'}`);
    }
  }

  // Create ungrouped (single-location) accounts
  for (const { row, index } of ungrouped) {
    if (!row.name || row.name.trim() === '') {
      errors.push(`Row ${index + 1}: Account name is required`);
      continue;
    }

    try {
      const accountToInsert = {
        name: row.name.trim(),
        website: row.website?.trim() || null,
        industry: row.industry?.trim() || null,
        primary_contact_name: row.primary_contact_name?.trim() || null,
        primary_contact_email: row.primary_contact_email?.trim() || null,
        primary_contact_phone: row.primary_contact_phone?.trim() || null,
        notes: row.notes?.trim() || null,
        sage_code: row.sage_code?.trim() || null,
        status: 'active' as const,
        account_type: 'single_location' as const,
        upload_batch_id: uploadBatchId,
        upload_list_name: listName,
        created_by: createdBy,
        udf_address_line1: row.address_line1?.trim() || null,
        udf_city: row.city?.trim() || null,
        udf_state: row.state?.trim() || null,
        udf_zipcode: row.zip_code?.trim() || null,
        udf_country_code: row.country?.trim() || null,
        udf_phone: row.phone?.trim() || null,
        udf_email: row.email?.trim() || null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: accountData, error: accountError } = await (supabase.from('accounts') as any)
        .insert(accountToInsert)
        .select()
        .single();

      if (accountError) {
        errors.push(`Row ${index + 1} (${row.name}): ${accountError.message}`);
        continue;
      }

      const locationToInsert = {
        account_id: accountData.id,
        name: row.name.trim(),
        address_line1: row.address_line1?.trim() || null,
        address_line2: row.address_line2?.trim() || null,
        city: row.city?.trim() || null,
        state: row.state?.trim() || null,
        zip_code: row.zip_code?.trim() || null,
        country: row.country?.trim() || 'USA',
        phone: row.phone?.trim() || null,
        email: row.email?.trim() || null,
        contact_name: row.primary_contact_name?.trim() || null,
        is_primary: true,
        status: 'active' as const,
        upload_batch_id: null,
        upload_list_name: null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: locationError } = await (supabase.from('locations') as any)
        .insert(locationToInsert);

      if (locationError) {
        errors.push(`Row ${index + 1} (${row.name}): Location failed: ${locationError.message}`);
      } else {
        totalLocations++;
      }

      created.push(accountData);
    } catch (error: any) {
      errors.push(`Row ${index + 1} (${row.name}): ${error.message || 'Unknown error'}`);
    }
  }

  console.log(`[bulkCreateGroupedAccounts] ${created.length} accounts, ${totalLocations} locations, ${errors.length} errors`);
  return { success: errors.length === 0, created, errors, accountCount: created.length, locationCount: totalLocations };
}

