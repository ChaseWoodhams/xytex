import { createAdminClient } from './admin';
import type { Agreement } from './types';

/**
 * @deprecated Agreements are now location-only. Use getAgreementsByLocation instead.
 * This function aggregates agreements from all locations in an account.
 * For multi-location accounts, use this to get all location agreements.
 */
export async function getAgreementsByAccount(accountId: string): Promise<Agreement[]> {
  const supabase = createAdminClient();
  
  // Get all location IDs for this account
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id')
    .eq('account_id', accountId);

  if (locationsError) {
    console.error('Error fetching locations for account:', locationsError);
    throw locationsError;
  }

  if (!locations || locations.length === 0) {
    return [];
  }

  const locationIds: string[] = locations.map((loc: { id: string }) => loc.id);

  // Get all agreements for these locations
  const { data, error } = await supabase
    .from('agreements')
    .select('*')
    .in('location_id', locationIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching agreements by account:', error);
    throw error;
  }

  return data || [];
}

export async function getAgreementsByLocation(locationId: string): Promise<Agreement[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('agreements')
    .select('*')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching agreements:', error);
    throw error;
  }

  return data || [];
}

export async function getAgreementById(id: string): Promise<Agreement | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('agreements')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching agreement:', error);
    return null;
  }

  return data;
}

export async function createAgreement(
  agreementData: Omit<Agreement, 'id' | 'created_at' | 'updated_at'>
): Promise<Agreement | null> {
  // Enforce location_id requirement - agreements must be tied to locations only
  if (!agreementData.location_id) {
    console.error('Error creating agreement: location_id is required. Agreements must be associated with a location.');
    throw new Error('location_id is required. Agreements can only be created for locations, not accounts.');
  }

  const supabase = createAdminClient();
  const { data, error } = await (supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('agreements') as any)
    .insert(agreementData)
    .select()
    .single();

  if (error) {
    console.error('Error creating agreement:', error);
    return null;
  }

  return data;
}

export async function updateAgreement(
  id: string,
  updates: Partial<Omit<Agreement, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'account_id'>>
): Promise<Agreement | null> {
  const supabase = createAdminClient();
  const { data, error } = await (supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('agreements') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating agreement:', error);
    return null;
  }

  return data;
}

export async function deleteAgreement(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('agreements')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting agreement:', error);
    return false;
  }

  return true;
}

export async function uploadAgreementDocument(
  file: File | Blob,
  agreementId: string,
  fileName?: string
): Promise<string | null> {
  const supabase = createAdminClient();
  
  // Generate unique filename
  const originalName = file instanceof File ? file.name : 'document';
  const fileExt = originalName.split('.').pop() || 'pdf';
  const uniqueFileName = fileName || `${agreementId}-${Date.now()}.${fileExt}`;
  const filePath = `agreements/${uniqueFileName}`;

  // Convert File/Blob to ArrayBuffer for server-side upload
  const arrayBuffer = await file.arrayBuffer();

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('agreements')
    .upload(filePath, arrayBuffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: file instanceof File ? file.type : 'application/pdf',
    });

  if (uploadError) {
    console.error('Error uploading document:', uploadError);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('agreements')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Calculate agreement status for a location based on its agreements
 * Returns: 'active' | 'expired' | 'draft' | 'none'
 */
export function getLocationAgreementStatus(agreements: Agreement[]): {
  status: 'active' | 'expired' | 'draft' | 'none';
  activeCount: number;
  totalCount: number;
} {
  if (!agreements || agreements.length === 0) {
    return { status: 'none', activeCount: 0, totalCount: 0 };
  }

  const now = new Date();
  let hasActive = false;
  let hasExpired = false;
  let hasDraft = false;

  agreements.forEach((agreement) => {
    if (agreement.status === 'draft') {
      hasDraft = true;
    } else if (agreement.status === 'active') {
      const startDate = agreement.start_date ? new Date(agreement.start_date) : null;
      const endDate = agreement.end_date ? new Date(agreement.end_date) : null;

      if (startDate && now < startDate) {
        // Not started yet
        hasDraft = true;
      } else if (endDate && now > endDate) {
        // Expired
        hasExpired = true;
      } else {
        // Currently active
        hasActive = true;
      }
    }
  });

  const activeCount = agreements.filter((agreement) => {
    if (agreement.status !== 'active') return false;
    const startDate = agreement.start_date ? new Date(agreement.start_date) : null;
    const endDate = agreement.end_date ? new Date(agreement.end_date) : null;
    const now = new Date();
    return (!startDate || now >= startDate) && (!endDate || now <= endDate);
  }).length;

  if (hasActive) {
    return { status: 'active', activeCount, totalCount: agreements.length };
  } else if (hasExpired) {
    return { status: 'expired', activeCount: 0, totalCount: agreements.length };
  } else if (hasDraft) {
    return { status: 'draft', activeCount: 0, totalCount: agreements.length };
  }

  return { status: 'none', activeCount: 0, totalCount: agreements.length };
}

