import { createClient } from './server';
import type { MarketingDonor } from './types';

export interface MarketingDonorFilters {
  race?: string[];
  cmvStatus?: string[];
  yearOfBirth?: { min?: number; max?: number };
  search?: string;
}

export interface MarketingDonorSortOption {
  field: 'created_at' | 'name' | 'year_of_birth' | 'id';
  direction: 'asc' | 'desc';
}

export async function getMarketingDonors(
  filters?: MarketingDonorFilters,
  sort?: MarketingDonorSortOption,
  limit?: number,
  offset?: number
): Promise<{ data: MarketingDonor[]; count: number }> {
  const supabase = await createClient();
  let queryBuilder = supabase.from('marketing_donors').select('*', { count: 'exact' });

  // Apply filters
  if (filters) {
    if (filters.race && filters.race.length > 0) {
      queryBuilder = queryBuilder.in('race', filters.race);
    }
    if (filters.cmvStatus && filters.cmvStatus.length > 0) {
      queryBuilder = queryBuilder.in('cmv_status', filters.cmvStatus);
    }
    if (filters.yearOfBirth) {
      if (filters.yearOfBirth.min !== undefined) {
        queryBuilder = queryBuilder.gte('year_of_birth', filters.yearOfBirth.min);
      }
      if (filters.yearOfBirth.max !== undefined) {
        queryBuilder = queryBuilder.lte('year_of_birth', filters.yearOfBirth.max);
      }
    }
    if (filters.search) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${filters.search}%,id.ilike.%${filters.search}%,occupation.ilike.%${filters.search}%,education.ilike.%${filters.search}%`
      );
    }
  }

  // Apply sorting
  if (sort) {
    queryBuilder = queryBuilder.order(sort.field, {
      ascending: sort.direction === 'asc',
    });
  } else {
    queryBuilder = queryBuilder.order('created_at', { ascending: false });
  }

  // Apply pagination
  if (limit) {
    queryBuilder = queryBuilder.limit(limit);
  }
  if (offset) {
    queryBuilder = queryBuilder.range(offset, offset + (limit || 100) - 1);
  }

  const { data, error, count } = await queryBuilder;

  if (error) {
    console.error('Error fetching marketing donors:', error);
    throw error;
  }

  return { data: data || [], count: count || 0 };
}

export async function getMarketingDonorById(id: string): Promise<MarketingDonor | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('marketing_donors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching marketing donor:', error);
    return null;
  }

  return data;
}

export async function createMarketingDonor(
  donorData: Omit<MarketingDonor, 'created_at' | 'updated_at'>
): Promise<MarketingDonor> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to create marketing donors');
  }

  const { data, error } = await (supabase
    .from('marketing_donors') as any)
    .insert({
      ...donorData,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating marketing donor:', error);
    throw error;
  }

  return data;
}

export async function updateMarketingDonor(
  id: string,
  updates: Partial<Omit<MarketingDonor, 'id' | 'created_at' | 'updated_at' | 'created_by'>>
): Promise<MarketingDonor> {
  const supabase = await createClient();
  const { data, error } = await (supabase
    .from('marketing_donors') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating marketing donor:', error);
    throw error;
  }

  return data;
}

export async function deleteMarketingDonor(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('marketing_donors').delete().eq('id', id);

  if (error) {
    console.error('Error deleting marketing donor:', error);
    throw error;
  }
}
