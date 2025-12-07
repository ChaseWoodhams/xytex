import { createClient } from './server';
import type { Donor } from './types';

export interface DonorFilters {
  ethnicity?: string[];
  hairColor?: string[];
  eyeColor?: string[];
  cmvStatus?: string[];
  availability?: string[];
  minHeight?: number;
  maxHeight?: number;
  isNew?: boolean;
  isPopular?: boolean;
  isExclusive?: boolean;
}

export interface DonorSortOption {
  field: 'created_at' | 'height_inches' | 'age' | 'name';
  direction: 'asc' | 'desc';
}

export async function getAllDonors(): Promise<Donor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('donors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching donors:', error);
    throw error;
  }

  return data || [];
}

export async function getDonorById(id: string): Promise<Donor | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('donors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching donor:', error);
    return null;
  }

  return data;
}

export async function getFeaturedDonors(limit: number = 4): Promise<Donor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('donors')
    .select('*')
    .or('is_new.eq.true,is_popular.eq.true')
    .order('is_new', { ascending: false })
    .order('is_popular', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured donors:', error);
    throw error;
  }

  return data || [];
}

export async function searchDonors(
  query: string,
  filters?: DonorFilters,
  sort?: DonorSortOption
): Promise<Donor[]> {
  const supabase = await createClient();
  let queryBuilder = supabase.from('donors').select('*');

  // Apply search query
  if (query) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${query}%,id.ilike.%${query}%,ethnicity.ilike.%${query}%,education.ilike.%${query}%,occupation.ilike.%${query}%`
    );
  }

  // Apply filters
  if (filters) {
    if (filters.ethnicity && filters.ethnicity.length > 0) {
      queryBuilder = queryBuilder.in('ethnicity', filters.ethnicity);
    }
    if (filters.hairColor && filters.hairColor.length > 0) {
      queryBuilder = queryBuilder.in('hair_color', filters.hairColor);
    }
    if (filters.eyeColor && filters.eyeColor.length > 0) {
      queryBuilder = queryBuilder.in('eye_color', filters.eyeColor);
    }
    if (filters.cmvStatus && filters.cmvStatus.length > 0) {
      queryBuilder = queryBuilder.in('cmv_status', filters.cmvStatus);
    }
    if (filters.availability && filters.availability.length > 0) {
      queryBuilder = queryBuilder.in('availability', filters.availability);
    }
    if (filters.minHeight !== undefined) {
      queryBuilder = queryBuilder.gte('height_inches', filters.minHeight);
    }
    if (filters.maxHeight !== undefined) {
      queryBuilder = queryBuilder.lte('height_inches', filters.maxHeight);
    }
    if (filters.isNew !== undefined) {
      queryBuilder = queryBuilder.eq('is_new', filters.isNew);
    }
    if (filters.isPopular !== undefined) {
      queryBuilder = queryBuilder.eq('is_popular', filters.isPopular);
    }
    if (filters.isExclusive !== undefined) {
      queryBuilder = queryBuilder.eq('is_exclusive', filters.isExclusive);
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

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Error searching donors:', error);
    throw error;
  }

  return data || [];
}

export async function trackDonorView(userId: string, donorId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await (supabase.from('donor_views') as any).insert({
    user_id: userId,
    donor_id: donorId,
  });

  if (error) {
    console.error('Error tracking donor view:', error);
    // Don't throw - this is non-critical
  }
}

