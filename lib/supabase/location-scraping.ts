import { createAdminClient } from './admin';
import type {
  LocationScrapingJob,
  LocationScrapingResult,
  LocationScrapingCredentials,
  LocationScrapingSource,
  LocationScrapingJobStatus,
} from './types';

/**
 * Create a new location scraping job
 */
export async function createLocationScrapingJob(
  searchQuery: string,
  source: LocationScrapingSource,
  userId: string
): Promise<LocationScrapingJob | null> {
  const supabase = createAdminClient();
  
  const { data, error } = await (supabase
    .from('location_scraping_jobs') as any)
    .insert({
      search_query: searchQuery,
      source: source,
      status: 'pending',
      results_count: 0,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating location scraping job:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error hint:', error.hint);
    // Throw error so API can return proper error message
    throw new Error(`Database error: ${error.message || error.code || 'Unknown error'}. Make sure migration 026_create_location_scraping.sql has been run.`);
  }

  return data;
}

/**
 * Get a location scraping job by ID
 */
export async function getLocationScrapingJob(jobId: string): Promise<LocationScrapingJob | null> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('location_scraping_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    console.error('Error fetching location scraping job:', error);
    return null;
  }

  return data;
}

/**
 * Get all location scraping jobs
 */
export async function getLocationScrapingJobs(
  limit: number = 50,
  offset: number = 0
): Promise<LocationScrapingJob[]> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('location_scraping_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching location scraping jobs:', error);
    return [];
  }

  return data || [];
}

/**
 * Update location scraping job status
 */
export async function updateLocationScrapingJob(
  jobId: string,
  updates: Partial<{
    status: LocationScrapingJobStatus;
    results_count: number;
    error_message: string | null;
  }>
): Promise<boolean> {
  const supabase = createAdminClient();
  
  const { error } = await (supabase
    .from('location_scraping_jobs') as any)
    .update(updates)
    .eq('id', jobId);

  if (error) {
    console.error('Error updating location scraping job:', error);
    return false;
  }

  return true;
}

/**
 * Create a location scraping result
 */
export async function createLocationScrapingResult(
  result: Omit<LocationScrapingResult, 'id' | 'scraped_at'>
): Promise<LocationScrapingResult | null> {
  const supabase = createAdminClient();
  
  const { data, error } = await (supabase
    .from('location_scraping_results') as any)
    .insert(result)
    .select()
    .single();

  if (error) {
    console.error('Error creating location scraping result:', error);
    return null;
  }

  return data;
}

/**
 * Get location scraping results
 */
export async function getLocationScrapingResults(filters?: {
  job_id?: string;
  source?: LocationScrapingSource;
  matched_location_id?: string | null;
  matched_account_id?: string | null;
  limit?: number;
  offset?: number;
}): Promise<LocationScrapingResult[]> {
  const supabase = createAdminClient();
  
  let query = supabase
    .from('location_scraping_results')
    .select('*')
    .order('scraped_at', { ascending: false });

  if (filters?.job_id) {
    query = query.eq('job_id', filters.job_id);
  }
  if (filters?.source) {
    query = query.eq('source', filters.source);
  }
  if (filters?.matched_location_id !== undefined) {
    if (filters.matched_location_id === null) {
      query = query.is('matched_location_id', null);
    } else if (filters.matched_location_id === 'any') {
      query = query.not('matched_location_id', 'is', null);
    } else {
      query = query.eq('matched_location_id', filters.matched_location_id);
    }
  }
  if (filters?.matched_account_id !== undefined) {
    if (filters.matched_account_id === null) {
      query = query.is('matched_account_id', null);
    } else if (filters.matched_account_id === 'any') {
      query = query.not('matched_account_id', 'is', null);
    } else {
      query = query.eq('matched_account_id', filters.matched_account_id);
    }
  }

  const limit = filters?.limit || 100;
  const offset = filters?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching location scraping results:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a location scraping result by ID
 */
export async function getLocationScrapingResult(resultId: string): Promise<LocationScrapingResult | null> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('location_scraping_results')
    .select('*')
    .eq('id', resultId)
    .single();

  if (error) {
    console.error('Error fetching location scraping result:', error);
    return null;
  }

  return data;
}

/**
 * Match a scraping result to a location or account
 */
export async function matchResultToLocation(
  resultId: string,
  locationId?: string | null,
  accountId?: string | null
): Promise<boolean> {
  const supabase = createAdminClient();
  
  const updates: Partial<LocationScrapingResult> = {};
  if (locationId !== undefined) {
    updates.matched_location_id = locationId;
  }
  if (accountId !== undefined) {
    updates.matched_account_id = accountId;
  }

  const { error } = await (supabase
    .from('location_scraping_results') as any)
    .update(updates)
    .eq('id', resultId);

  if (error) {
    console.error('Error matching result to location:', error);
    return false;
  }

  return true;
}

/**
 * Apply scraped data to a location
 */
export async function applyScrapedDataToLocation(
  resultId: string,
  locationId: string,
  fields: string[]
): Promise<boolean> {
  const supabase = createAdminClient();
  
  // Get the scraping result
  const result = await getLocationScrapingResult(resultId);
  if (!result) {
    console.error('Scraping result not found:', resultId);
    return false;
  }

  // Get the location
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single();

  if (locationError || !location) {
    console.error('Location not found:', locationId);
    return false;
  }

  // Build update object based on requested fields
  const updates: Record<string, any> = {};
  
  if (fields.includes('address_line1') && result.address_line1) {
    updates.address_line1 = result.address_line1;
  }
  if (fields.includes('address_line2') && result.address_line2) {
    updates.address_line2 = result.address_line2;
  }
  if (fields.includes('city') && result.city) {
    updates.city = result.city;
  }
  if (fields.includes('state') && result.state) {
    updates.state = result.state;
  }
  if (fields.includes('zip_code') && result.zip_code) {
    updates.zip_code = result.zip_code;
  }
  if (fields.includes('country') && result.country) {
    updates.country = result.country;
  }
  if (fields.includes('phone') && result.phone) {
    updates.phone = result.phone;
  }
  if (fields.includes('email') && result.email) {
    updates.email = result.email;
  }

  // Update location
  const { error: updateError } = await (supabase
    .from('locations') as any)
    .update(updates)
    .eq('id', locationId);

  if (updateError) {
    console.error('Error applying scraped data to location:', updateError);
    return false;
  }

  // If employees are requested, create location contacts
  if (fields.includes('employees') && result.employees && result.employees.length > 0) {
    for (const employee of result.employees) {
      if (employee.name) {
        await (supabase.from('location_contacts') as any).insert({
          location_id: locationId,
          name: employee.name,
          email: employee.email || null,
          phone: employee.phone || null,
          title: employee.title || null,
          role: 'other',
          is_primary: false,
        }).catch((err: any) => {
          // Ignore duplicate errors
          console.log('Could not add employee contact:', err);
        });
      }
    }
  }

  return true;
}

/**
 * Get location scraping credentials
 */
export async function getLocationScrapingCredentials(
  service?: string
): Promise<LocationScrapingCredentials[]> {
  const supabase = createAdminClient();
  
  let query = supabase
    .from('location_scraping_credentials')
    .select('*')
    .eq('is_active', true);

  if (service) {
    query = query.eq('service', service);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching location scraping credentials:', error);
    return [];
  }

  return data || [];
}

/**
 * Create or update location scraping credentials
 */
export async function upsertLocationScrapingCredentials(
  service: string,
  apiKey: string
): Promise<LocationScrapingCredentials | null> {
  const supabase = createAdminClient();
  
  // First, deactivate any existing active credentials for this service
  await (supabase
    .from('location_scraping_credentials') as any)
    .update({ is_active: false })
    .eq('service', service)
    .eq('is_active', true);

  // Insert new active credentials
  const { data, error } = await (supabase
    .from('location_scraping_credentials') as any)
    .insert({
      service: service as any,
      api_key: apiKey,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating location scraping credentials:', error);
    return null;
  }

  return data;
}

/**
 * Delete location scraping credentials
 */
export async function deleteLocationScrapingCredentials(credentialId: string): Promise<boolean> {
  const supabase = createAdminClient();
  
  const { error } = await supabase
    .from('location_scraping_credentials')
    .delete()
    .eq('id', credentialId);

  if (error) {
    console.error('Error deleting location scraping credentials:', error);
    return false;
  }

  return true;
}
