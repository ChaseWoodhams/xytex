import { createClient } from './server';
import type {
  ScrapingCredentials,
  ScrapingJob,
  ScrapingResult,
  DonorIdListItem,
  ScrapingJobType,
  ScrapingJobStatus,
  ScrapingStatus,
} from './types';

// ==================== Scraping Credentials ====================

export async function getScrapingCredentials(): Promise<ScrapingCredentials | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase
    .from('scraping_credentials') as any)
    .select('*')
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No credentials found
      return null;
    }
    console.error('Error fetching scraping credentials:', error);
    throw error;
  }

  return data;
}

export async function createOrUpdateScrapingCredentials(
  email: string,
  password: string
): Promise<ScrapingCredentials> {
  const supabase = await createClient();
  
  // Check if credentials exist
  const existing = await getScrapingCredentials();
  
  if (existing) {
    // Update existing
    const { data, error } = await (supabase
      .from('scraping_credentials') as any)
      .update({
        xytex_email: email,
        xytex_password: password,
        is_active: true,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating scraping credentials:', error);
      throw error;
    }

    return data;
  } else {
    // Create new
    const { data, error } = await (supabase
      .from('scraping_credentials') as any)
      .insert({
        xytex_email: email,
        xytex_password: password,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating scraping credentials:', error);
      throw error;
    }

    return data;
  }
}

export async function updateScrapingCredentials(
  id: string,
  updates: Partial<Omit<ScrapingCredentials, 'id' | 'created_at' | 'updated_at'>>
): Promise<ScrapingCredentials> {
  const supabase = await createClient();
  const { data, error } = await (supabase
    .from('scraping_credentials') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating scraping credentials:', error);
    throw error;
  }

  return data;
}

export async function deleteScrapingCredentials(): Promise<void> {
  const supabase = await createClient();
  const { error } = await (supabase
    .from('scraping_credentials') as any)
    .update({ is_active: false })
    .eq('is_active', true);

  if (error) {
    console.error('Error deleting scraping credentials:', error);
    throw error;
  }
}

// ==================== Donor ID List ====================

export async function getDonorIdList(
  activeOnly: boolean = false
): Promise<DonorIdListItem[]> {
  const supabase = await createClient();
  let query = supabase.from('donor_id_list').select('*').order('donor_id');

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching donor ID list:', error);
    throw error;
  }

  return data || [];
}

export async function addDonorIds(donorIds: string[]): Promise<DonorIdListItem[]> {
  const supabase = await createClient();
  
  // Get existing IDs to avoid duplicates
  const existing = await getDonorIdList();
  const existingIds = new Set(existing.map((item) => item.donor_id));
  
  // Filter out duplicates
  const newIds = donorIds.filter((id) => !existingIds.has(id));
  
  if (newIds.length === 0) {
    return [];
  }

  const itemsToInsert = newIds.map((donorId) => ({
    donor_id: donorId,
    is_active: true,
  }));

  const { data, error } = await (supabase
    .from('donor_id_list') as any)
    .insert(itemsToInsert)
    .select();

  if (error) {
    console.error('Error adding donor IDs:', error);
    throw error;
  }

  return data || [];
}

export async function updateDonorIdListItem(
  id: string,
  updates: Partial<Omit<DonorIdListItem, 'id' | 'created_at'>>
): Promise<DonorIdListItem> {
  const supabase = await createClient();
  const { data, error } = await (supabase
    .from('donor_id_list') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating donor ID list item:', error);
    throw error;
  }

  return data;
}

export async function deleteDonorIdListItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await (supabase.from('donor_id_list') as any).delete().eq('id', id);

  if (error) {
    console.error('Error deleting donor ID list item:', error);
    throw error;
  }
}

// ==================== Scraping Jobs ====================

export async function createScrapingJob(
  jobType: ScrapingJobType,
  totalDonors: number,
  userId: string
): Promise<ScrapingJob> {
  const supabase = await createClient();
  const { data, error } = await (supabase
    .from('scraping_jobs') as any)
    .insert({
      job_type: jobType,
      status: 'pending',
      total_donors: totalDonors,
      processed_count: 0,
      success_count: 0,
      failed_count: 0,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating scraping job:', error);
    throw error;
  }

  return data;
}

export async function getScrapingJob(id: string): Promise<ScrapingJob | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase
    .from('scraping_jobs') as any)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching scraping job:', error);
    throw error;
  }

  return data;
}

export async function getScrapingJobs(
  limit: number = 50,
  offset: number = 0
): Promise<{ data: ScrapingJob[]; count: number }> {
  const supabase = await createClient();
  const { data, error, count } = await (supabase
    .from('scraping_jobs') as any)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching scraping jobs:', error);
    throw error;
  }

  return { data: data || [], count: count || 0 };
}

export async function updateScrapingJob(
  id: string,
  updates: Partial<Omit<ScrapingJob, 'id' | 'created_at' | 'updated_at' | 'created_by'>>
): Promise<ScrapingJob> {
  const supabase = await createClient();
  const { data, error } = await (supabase
    .from('scraping_jobs') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating scraping job:', error);
    throw error;
  }

  return data;
}

// ==================== Scraping Results ====================

export async function createScrapingResult(
  result: Omit<ScrapingResult, 'id' | 'scraped_at'>
): Promise<ScrapingResult> {
  const supabase = await createClient();
  const { data, error } = await (supabase
    .from('scraping_results') as any)
    .insert(result)
    .select()
    .single();

  if (error) {
    console.error('Error creating scraping result:', error);
    throw error;
  }

  return data;
}

export async function getScrapingResults(
  filters?: {
    donorId?: string;
    status?: ScrapingStatus;
    jobId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  },
  limit: number = 50,
  offset: number = 0
): Promise<{ data: ScrapingResult[]; count: number }> {
  const supabase = await createClient();
  let query = (supabase.from('scraping_results') as any).select('*', { count: 'exact' });

  if (filters) {
    if (filters.donorId) {
      query = query.eq('donor_id', filters.donorId);
    }
    if (filters.status) {
      query = query.eq('scrape_status', filters.status);
    }
    if (filters.jobId) {
      query = query.eq('job_id', filters.jobId);
    }
    if (filters.dateFrom) {
      query = query.gte('scraped_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('scraped_at', filters.dateTo);
    }
    if (filters.search) {
      query = query.or(
        `donor_id.ilike.%${filters.search}%,banner_message.ilike.%${filters.search}%`
      );
    }
  }

  const { data, error, count } = await query
    .order('scraped_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching scraping results:', error);
    throw error;
  }

  return { data: data || [], count: count || 0 };
}

export async function getLatestScrapingResult(
  donorId: string
): Promise<ScrapingResult | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase
    .from('scraping_results') as any)
    .select('*')
    .eq('donor_id', donorId)
    .eq('scrape_status', 'success')
    .order('scraped_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching latest scraping result:', error);
    return null;
  }

  return data;
}

export async function updateDonorIdListAfterScrape(
  donorId: string,
  success: boolean
): Promise<void> {
  const supabase = await createClient();
  
  // Find the donor ID list item
  const { data: listItem } = await (supabase
    .from('donor_id_list') as any)
    .select('*')
    .eq('donor_id', donorId)
    .single();

  if (!listItem) {
    return; // Donor ID not in list, skip update
  }

  const updates: any = {
    last_scraped_at: new Date().toISOString(),
  };

  if (success) {
    updates.last_successful_scrape_at = new Date().toISOString();
    updates.consecutive_failures = 0;
  } else {
    updates.consecutive_failures = (listItem.consecutive_failures || 0) + 1;
    // Auto-disable after 5 consecutive failures
    if (updates.consecutive_failures >= 5) {
      updates.is_active = false;
    }
  }

  await (supabase
    .from('donor_id_list') as any)
    .update(updates)
    .eq('id', listItem.id);
}
