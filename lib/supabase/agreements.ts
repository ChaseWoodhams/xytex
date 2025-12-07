import { createAdminClient } from './admin';
import type { Agreement, AgreementType, AgreementStatus } from './types';

export async function getAgreementsByAccount(accountId: string): Promise<Agreement[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('agreements')
    .select('*')
    .eq('corporate_account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching agreements:', error);
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
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('agreements')
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
  updates: Partial<Omit<Agreement, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'corporate_account_id'>>
): Promise<Agreement | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('agreements')
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
  const { data, error } = await supabase.storage
    .from('agreements')
    .upload(filePath, arrayBuffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: file instanceof File ? file.type : 'application/pdf',
    });

  if (error) {
    console.error('Error uploading document:', error);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('agreements')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

