import { createAdminClient } from './admin';
import type { Account, AccountStatus } from './types';

export type CountryFilter = 'US' | 'CA' | 'UK' | 'INTL';

export interface AccountFilters {
  status?: AccountStatus;
  industry?: string;
  search?: string;
  country?: CountryFilter; // Filter by country
  hasContracts?: boolean; // true = has contracts, false = no contracts, undefined = all
  hasLicenses?: boolean; // true = has licenses, false = no licenses, undefined = all
}

export interface PaginatedAccountsResult {
  accounts: Account[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AccountWithMetadata extends Account {
  locationCount: number;
  hasContracts: boolean;
  hasLicenses: boolean;
  mostRecentContractDate: string | null;
  locationCities: string[];
  locationStates: string[];
  locationCountries: string[];
  locationAddresses: string[];
  locationZipCodes: string[];
}

export async function getAccounts(
  filters?: AccountFilters
): Promise<Account[]> {
  const supabase = createAdminClient();
  let query = supabase.from('accounts').select('*');

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  // Note: deal_stage filter removed as the column was dropped in migration 004

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

  const accounts = data || [];
  console.log(`[getAccounts] Found ${accounts.length} accounts`);
  return accounts;
}

/**
 * Optimized function to get paginated accounts with metadata (location counts, contracts, licenses)
 * Uses efficient JOINs to avoid N+1 queries
 */
export async function getPaginatedAccountsWithMetadata(
  page: number = 1,
  pageSize: number = 50,
  filters?: AccountFilters
): Promise<PaginatedAccountsResult & { accounts: AccountWithMetadata[] }> {
  const supabase = createAdminClient();
  const offset = (page - 1) * pageSize;

  // Build base query with filters (but don't paginate yet - we need to filter by contracts/licenses first)
  let baseQuery = supabase.from('accounts').select('*');

  if (filters?.status) {
    baseQuery = baseQuery.eq('status', filters.status);
  }

  if (filters?.industry) {
    baseQuery = baseQuery.eq('industry', filters.industry);
  }

  if (filters?.search) {
    baseQuery = baseQuery.or(`name.ilike.%${filters.search}%,primary_contact_name.ilike.%${filters.search}%,primary_contact_email.ilike.%${filters.search}%`);
  }

  // Order by created_at (descending) - we'll paginate after filtering
  baseQuery = baseQuery.order('created_at', { ascending: false });

  // Fetch ALL accounts matching base filters first (we'll filter by contracts/licenses, then paginate)
  const { data: allAccounts, error: accountsError } = await baseQuery;

  if (accountsError) {
    console.error('Error fetching accounts:', accountsError);
    throw accountsError;
  }

  if (!allAccounts || allAccounts.length === 0) {
    return {
      accounts: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  const accountIds = allAccounts.map(acc => acc.id);

  // Get all locations for these accounts in one query
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id, account_id, city, state, country, address_line1, zip_code, license_document_url')
    .in('account_id', accountIds);

  if (locationsError) {
    console.error('Error fetching locations:', locationsError);
    // Continue with empty locations array
  }

  // Get all agreements for locations in these accounts
  const locationIds = locations?.map(loc => loc.id) || [];
  let agreements: any[] = [];
  
  if (locationIds.length > 0) {
    const { data: agreementsData, error: agreementsError } = await supabase
      .from('agreements')
      .select('id, location_id, signed_date, status')
      .in('location_id', locationIds)
      .order('signed_date', { ascending: false });

    if (agreementsError) {
      console.error('Error fetching agreements:', agreementsError);
    } else {
      agreements = agreementsData || [];
    }
  }

  // Group locations by account_id
  const locationsByAccount = new Map<string, typeof locations>();
  locations?.forEach(loc => {
    if (!locationsByAccount.has(loc.account_id)) {
      locationsByAccount.set(loc.account_id, []);
    }
    locationsByAccount.get(loc.account_id)!.push(loc);
  });

  // Group agreements by location_id, then by account_id
  const agreementsByLocation = new Map<string, typeof agreements>();
  agreements.forEach(agreement => {
    if (!agreementsByLocation.has(agreement.location_id)) {
      agreementsByLocation.set(agreement.location_id, []);
    }
    agreementsByLocation.get(agreement.location_id)!.push(agreement);
  });

  const agreementsByAccount = new Map<string, typeof agreements>();
  locations?.forEach(loc => {
    const locAgreements = agreementsByLocation.get(loc.id) || [];
    if (!agreementsByAccount.has(loc.account_id)) {
      agreementsByAccount.set(loc.account_id, []);
    }
    agreementsByAccount.get(loc.account_id)!.push(...locAgreements);
  });

  // Build enriched accounts with metadata for ALL accounts
  const enrichedAccounts: AccountWithMetadata[] = allAccounts.map(account => {
    const accountLocations = locationsByAccount.get(account.id) || [];
    const accountAgreements = agreementsByAccount.get(account.id) || [];
    
    // Check for contracts
    const hasContracts = accountAgreements.length > 0;
    
    // Check for licenses (any location has license_document_url)
    const hasLicenses = accountLocations.some(loc => loc.license_document_url != null && loc.license_document_url.trim() !== '');
    
    // Get most recent contract date
    const signedAgreements = accountAgreements
      .filter(ag => ag.signed_date)
      .sort((a, b) => {
        const dateA = new Date(a.signed_date).getTime();
        const dateB = new Date(b.signed_date).getTime();
        return dateB - dateA;
      });
    const mostRecentContractDate = signedAgreements.length > 0 ? signedAgreements[0].signed_date : null;

    // Collect unique cities, states, countries, addresses, zip codes
    const citySet = new Set<string>();
    const stateSet = new Set<string>();
    const countrySet = new Set<string>();
    const addressSet = new Set<string>();
    const zipSet = new Set<string>();

    accountLocations.forEach(loc => {
      if (loc.city) citySet.add(loc.city);
      if (loc.state) stateSet.add(loc.state);
      if (loc.country) countrySet.add(loc.country);
      if (loc.address_line1) addressSet.add(loc.address_line1);
      if (loc.zip_code) zipSet.add(loc.zip_code);
    });

    // Also check account-level country code
    if (account.udf_country_code) {
      countrySet.add(account.udf_country_code);
    }

    return {
      ...account,
      locationCount: accountLocations.length,
      hasContracts,
      hasLicenses,
      mostRecentContractDate,
      locationCities: Array.from(citySet),
      locationStates: Array.from(stateSet),
      locationCountries: Array.from(countrySet),
      locationAddresses: Array.from(addressSet),
      locationZipCodes: Array.from(zipSet),
    };
  });

  // Helper function to normalize country codes for filtering (matches client-side logic)
  const normalizeCountry = (country: string | null | undefined): CountryFilter | null => {
    if (!country || typeof country !== 'string' || !country.trim()) return null;
    const upperCountry = country.trim().toUpperCase();
    
    if (upperCountry === 'USA' || upperCountry === 'US' || upperCountry === 'UNITED STATES') {
      return 'US';
    }
    if (upperCountry === 'CA' || upperCountry === 'CAN' || upperCountry === 'CANADA') {
      return 'CA';
    }
    if (upperCountry === 'UK' || upperCountry === 'GB' || upperCountry === 'GBR' || 
        upperCountry === 'UNITED KINGDOM' || upperCountry === 'ENGLAND' || 
        upperCountry === 'SCOTLAND' || upperCountry === 'WALES' || 
        upperCountry === 'NORTHERN IRELAND') {
      return 'UK';
    }
    return 'INTL';
  };

  // Helper function to check if account matches country filter
  const accountMatchesCountryFilter = (account: AccountWithMetadata, filter: CountryFilter): boolean => {
    const isSingleLocation = !account.account_type || 
      account.account_type === 'single_location' || 
      account.locationCount <= 1;
    
    // If account has a country code, use it first (most reliable)
    if (account.udf_country_code && account.udf_country_code.trim()) {
      const normalizedAccountCountry = normalizeCountry(account.udf_country_code.trim());
      if (normalizedAccountCountry === filter) {
        return true;
      }
      // For single-location accounts, only use account country code
      if (isSingleLocation) {
        return false;
      }
    }
    
    // For multi-location accounts or when account country doesn't match, check location countries
    if (account.locationCountries && account.locationCountries.length > 0) {
      const normalizedLocationCountries = account.locationCountries
        .map(country => country ? normalizeCountry(country.trim()) : null)
        .filter((country): country is CountryFilter => country !== null);
      
      return normalizedLocationCountries.some(country => country === filter);
    }
    
    return false;
  };

  // Apply all filters (country, contracts, licenses) on ALL accounts, not just the page
  let filteredAccounts = enrichedAccounts;
  
  // Apply country filter first
  if (filters?.country) {
    filteredAccounts = filteredAccounts.filter(acc => accountMatchesCountryFilter(acc, filters.country!));
  }
  
  // Apply contract filter
  if (filters?.hasContracts !== undefined) {
    filteredAccounts = filteredAccounts.filter(acc => acc.hasContracts === filters.hasContracts);
  }
  
  // Apply license filter
  if (filters?.hasLicenses !== undefined) {
    filteredAccounts = filteredAccounts.filter(acc => acc.hasLicenses === filters.hasLicenses);
  }

  // Now paginate the filtered results
  const finalTotal = filteredAccounts.length;
  const finalTotalPages = Math.ceil(finalTotal / pageSize);
  const paginatedAccounts = filteredAccounts.slice(offset, offset + pageSize);

  return {
    accounts: paginatedAccounts,
    total: finalTotal,
    page,
    pageSize,
    totalPages: finalTotalPages,
  };
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
  
  // deal_stage was removed from the database schema, so we don't need to destructure it
  // Keep account_type as it should exist (migration 010 adds it)
  const dbAccountData = accountData;
  
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

  // For single-location accounts: ensure clinic name = account name (no duplication)
  if (data && data.account_type === 'single_location' && data.udf_clinic_name !== data.name) {
    await (supabase.from('accounts') as any)
      .update({ udf_clinic_name: data.name })
      .eq('id', data.id);
    data.udf_clinic_name = data.name;
  }

  // Automatically create a location for single-location accounts
  if (data && data.account_type === 'single_location') {
    try {
      // Use dynamic import to avoid circular dependency
      const { createLocation, getLocationsByAccount } = await import('./locations');
      
      // Check if location already exists (shouldn't happen for new accounts, but check anyway)
      const existingLocations = await getLocationsByAccount(data.id);
      if (existingLocations.length > 0) {
        console.log(`[createAccount] Location already exists for account ${data.id}, skipping auto-creation`);
      } else {
        // Normalize country code - default to 'US' if not provided
        let countryCode = data.udf_country_code || 'US';
        // Handle common variations
        if (countryCode.toUpperCase() === 'USA' || countryCode.toUpperCase() === 'UNITED STATES') {
          countryCode = 'US';
        }
        
        const locationData = {
          account_id: data.id,
          name: data.name, // Use account name as location name (same as clinic name)
          address_line1: data.udf_address_line1 || null,
          address_line2: data.udf_address_line2 || null,
          city: data.udf_city || null,
          state: data.udf_state || null,
          zip_code: data.udf_zipcode || null,
          country: countryCode,
          phone: data.primary_contact_phone || null,
          email: data.primary_contact_email || null,
          contact_name: data.primary_contact_name || null,
          contact_title: null,
          is_primary: true, // Single location is always primary
          status: 'active' as const,
          notes: data.notes || null,
          sage_code: null, // Location sage code is separate from account sage code
          agreement_document_url: null,
          license_document_url: null,
          upload_batch_id: null,
          upload_list_name: null,
        };

        const location = await createLocation(locationData);
        if (location) {
          console.log(`[createAccount] Auto-created location ${location.id} for single-location account ${data.id}`);
        } else {
          console.error(`[createAccount] Failed to auto-create location for account ${data.id} - createLocation returned null`);
          throw new Error('Location creation returned null');
        }
      }
    } catch (locationError: any) {
      console.error('Error auto-creating location for single-location account:', {
        accountId: data.id,
        error: locationError.message,
        stack: locationError.stack
      });
      // Don't fail account creation if location creation fails, but log it
      // The account was created successfully, location can be added manually if needed
    }
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

  // For single-location accounts: ensure clinic name = account name (no duplication)
  if (data && data.account_type === 'single_location' && data.udf_clinic_name !== data.name) {
    await (supabase.from('accounts') as any)
      .update({ udf_clinic_name: data.name })
      .eq('id', id);
    data.udf_clinic_name = data.name;
  }

  // If this is a single-location account, sync the location with account data
  if (data && data.account_type === 'single_location') {
    try {
      // Use dynamic import to avoid circular dependency
      const { getLocationsByAccount } = await import('./locations');
      const existingLocations = await getLocationsByAccount(id);
      const primaryLocation = existingLocations.find(loc => loc.is_primary) || existingLocations[0];
      
      if (primaryLocation) {
        // Update the existing location with account data
        const { updateLocation } = await import('./locations');
        
        // Normalize country code
        let countryCode = data.udf_country_code || 'US';
        if (countryCode.toUpperCase() === 'USA' || countryCode.toUpperCase() === 'UNITED STATES') {
          countryCode = 'US';
        }
        
        await updateLocation(primaryLocation.id, {
          name: data.name, // Keep location name in sync with account name (same as clinic name)
          address_line1: data.udf_address_line1 || null,
          address_line2: data.udf_address_line2 || null,
          city: data.udf_city || null,
          state: data.udf_state || null,
          zip_code: data.udf_zipcode || null,
          country: countryCode,
          phone: data.primary_contact_phone || null,
          email: data.primary_contact_email || null,
          contact_name: data.primary_contact_name || null,
          notes: data.notes || null,
        });
        console.log(`[updateAccount] Synced location ${primaryLocation.id} with account ${id} data`);
      } else {
        // No location exists yet, create one
        const { createLocation } = await import('./locations');
        
        // Normalize country code
        let countryCode = data.udf_country_code || 'US';
        if (countryCode.toUpperCase() === 'USA' || countryCode.toUpperCase() === 'UNITED STATES') {
          countryCode = 'US';
        }
        
        const locationData = {
          account_id: id,
          name: data.name,
          address_line1: data.udf_address_line1 || null,
          address_line2: data.udf_address_line2 || null,
          city: data.udf_city || null,
          state: data.udf_state || null,
          zip_code: data.udf_zipcode || null,
          country: countryCode,
          phone: data.primary_contact_phone || null,
          email: data.primary_contact_email || null,
          contact_name: data.primary_contact_name || null,
          contact_title: null,
          is_primary: true,
          status: 'active' as const,
          notes: data.notes || null,
          sage_code: null,
          agreement_document_url: null,
          license_document_url: null,
          upload_batch_id: null,
          upload_list_name: null,
        };
        const location = await createLocation(locationData);
        if (location) {
          console.log(`[updateAccount] Auto-created location ${location.id} for single-location account ${id}`);
        } else {
          console.error(`[updateAccount] Failed to auto-create location for account ${id}`);
        }
      }
    } catch (locationError: any) {
      console.error('Error syncing location for single-location account:', locationError);
      // Don't fail account update if location sync fails
    }
  }

  return data;
}

export async function deleteAccount(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  
  try {
    // First, verify the account exists and get its details
    const accountQuery = await supabase
      .from('accounts')
      .select('id, name, created_by')
      .eq('id', id)
      .single();
    
    const { data: existingAccount, error: fetchError } = accountQuery;

    if (fetchError) {
      console.error('Error fetching account before deletion:', {
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        code: fetchError.code,
        fullError: fetchError
      });
      throw new Error(`Failed to fetch account: ${fetchError.message}`);
    }

    if (!existingAccount || !('id' in existingAccount)) {
      console.error(`Account with id ${id} not found`);
      throw new Error(`Account with id ${id} not found`);
    }

    const accountData = existingAccount as { id: string; name: string; created_by: string | null };

    // Check if created_by references a valid user (this shouldn't block deletion, but helps with debugging)
    if (accountData.created_by) {
      const { data: userCheck } = await supabase
        .from('users')
        .select('id')
        .eq('id', accountData.created_by)
        .single();
      
      if (!userCheck) {
        console.warn(`Account ${id} has invalid created_by reference: ${accountData.created_by}`);
        // This shouldn't prevent deletion, but we log it for debugging
      }
    }

    // Delete related data first to avoid any constraint issues
    // Note: These should cascade automatically, but we'll delete them explicitly to be safe
    try {
      // Delete locations (should cascade, but explicit deletion is safer)
      await supabase
        .from('locations')
        .delete()
        .eq('account_id', id);
      
      // Delete agreements (should cascade, but explicit deletion is safer)
      await supabase
        .from('agreements')
        .delete()
        .eq('account_id', id);
      
      // Delete activities (should cascade, but explicit deletion is safer)
      await supabase
        .from('activities')
        .delete()
        .eq('account_id', id);
      
      // Delete notes (should cascade, but explicit deletion is safer)
      await supabase
        .from('notes')
        .delete()
        .eq('account_id', id);
    } catch (relatedDataError: unknown) {
      const errorMessage = relatedDataError instanceof Error ? relatedDataError.message : 'Unknown error';
      console.warn('Error deleting related data (may not exist):', errorMessage);
      // Continue with account deletion even if related data deletion fails
    }

    // Delete the account and return the deleted row to verify deletion
    const { data: deletedData, error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error deleting account:', {
        accountId: id,
        accountName: accountData.name,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      });
      throw new Error(`Failed to delete account: ${error.message}${error.hint ? ` (${error.hint})` : ''}`);
    }

    // Verify that a row was actually deleted
    if (!deletedData || deletedData.length === 0) {
      console.error(`Failed to delete account ${id}: No rows were deleted`);
      throw new Error(`Failed to delete account ${id}: No rows were deleted`);
    }

    console.log(`Successfully deleted account ${id} (${accountData.name})`);
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error in deleteAccount:', {
      accountId: id,
      error: errorMessage,
      stack: errorStack
    });
    throw error; // Re-throw to allow API route to handle it
  }
}
