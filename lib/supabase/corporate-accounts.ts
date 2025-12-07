import { createAdminClient } from './admin';
import type { CorporateAccount, DealStage, AccountStatus } from './types';

export interface CorporateAccountFilters {
  status?: AccountStatus;
  deal_stage?: DealStage;
  industry?: string;
  search?: string;
}

export async function getCorporateAccounts(
  filters?: CorporateAccountFilters
): Promise<CorporateAccount[]> {
  const supabase = createAdminClient();
  let query = supabase.from('corporate_accounts').select('*');

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.deal_stage) {
    query = query.eq('deal_stage', filters.deal_stage);
  }

  if (filters?.industry) {
    query = query.eq('industry', filters.industry);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,primary_contact_name.ilike.%${filters.search}%,primary_contact_email.ilike.%${filters.search}%`);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching corporate accounts:', error);
    throw error;
  }

  return data || [];
}

export async function getCorporateAccountById(id: string): Promise<CorporateAccount | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('corporate_accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching corporate account:', error);
    return null;
  }

  return data;
}

export async function createCorporateAccount(
  accountData: Omit<CorporateAccount, 'id' | 'created_at' | 'updated_at'>
): Promise<CorporateAccount | null> {
  const supabase = createAdminClient();
  const { data, error } = await (supabase
    .from('corporate_accounts') as any)
    .insert(accountData)
    .select()
    .single();

  if (error) {
    console.error('Error creating corporate account:', error);
    return null;
  }

  return data;
}

export async function updateCorporateAccount(
  id: string,
  updates: Partial<Omit<CorporateAccount, 'id' | 'created_at' | 'updated_at' | 'created_by'>>
): Promise<CorporateAccount | null> {
  const supabase = createAdminClient();
  const { data, error } = await (supabase
    .from('corporate_accounts') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating corporate account:', error);
    return null;
  }

  return data;
}

export async function deleteCorporateAccount(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('corporate_accounts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting corporate account:', error);
    return false;
  }

  return true;
}

