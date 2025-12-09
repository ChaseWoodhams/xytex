import { createAdminClient } from './admin';
import type { Account, DealStage, AccountStatus } from './types';

export interface AccountFilters {
  status?: AccountStatus;
  deal_stage?: DealStage;
  industry?: string;
  search?: string;
}

export async function getAccounts(
  filters?: AccountFilters
): Promise<Account[]> {
  const supabase = createAdminClient();
  let query = supabase.from('accounts').select('*');

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
    console.error('Error fetching accounts:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      fullError: error
    });
    throw error;
  }

  return data || [];
}

export async function getAccountById(id: string): Promise<Account | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching account:', error);
    return null;
  }

  return data;
}

export async function createAccount(
  accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>
): Promise<Account | null> {
  const supabase = createAdminClient();
  
  // Remove deal_stage as it was removed from the database schema
  // Keep account_type as it should exist (migration 010 adds it)
  const { deal_stage, ...dbAccountData } = accountData;
  
  const { data, error } = await (supabase
    .from('accounts') as any)
    .insert(dbAccountData)
    .select()
    .single();

  if (error) {
    console.error('Error creating account:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      fullError: error
    });
    throw new Error(error.message || 'Failed to create account');
  }

  return data;
}

export async function updateAccount(
  id: string,
  updates: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at' | 'created_by'>>
): Promise<Account | null> {
  const supabase = createAdminClient();
  const { data, error } = await (supabase
    .from('accounts') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating account:', error);
    return null;
  }

  return data;
}

export async function deleteAccount(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting account:', error);
    return false;
  }

  return true;
}

