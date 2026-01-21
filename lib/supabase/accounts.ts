import { createAdminClient } from './admin';
import type { Account, AccountStatus } from './types';

export type CountryFilter = 'US' | 'CA' | 'UK' | 'INTL';

export interface AccountFilters {
  status?: AccountStatus;
  industry?: string;
  search?: string;
  country?: CountryFilter; // Filter by country
  accountType?: 'single_location' | 'multi_location'; // Filter by account type
  sortByStatus?: 'red' | 'yellow' | 'green'; // Sort by document status
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
  documentStatus: 'red' | 'yellow' | 'green';
  pendingContractCount: number; // Number of locations with pending contracts (for multi-location) or 1/0 for single-location
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
    const search = filters.search;
    query = query.or(
      `name.ilike.%${search}%,primary_contact_name.ilike.%${search}%,primary_contact_email.ilike.%${search}%,sage_code.ilike.%${search}%`
    );
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

// Type definitions for internal use
type LocationData = { 
  id: string; 
  account_id: string; 
  city: string | null; 
  state: string | null; 
  country: string | null; 
  address_line1: string | null; 
  zip_code: string | null; 
  license_document_url: string | null;
  agreement_document_url: string | null;
  updated_at: string;
  pending_contract_sent: boolean;
};

type AgreementData = { 
  id: string; 
  account_id: string; 
  location_id: string | null; 
  signed_date: string | null; 
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  status: string;
};

/**
 * Calculate document status for an account based on contracts and licenses
 * - Red: No contracts AND no licenses (neither account-level nor location-level)
 * - Yellow: Account OR any location has at least one document, but not all locations have both contract AND license
 *   OR if any contract is pending (pending_contract_sent = true)
 * - Green: ALL locations have BOTH a contract AND a license (and no contracts are pending)
 */
function calculateDocumentStatus(
  locations: LocationData[],
  agreementsByLocation: Map<string, AgreementData[]>,
  accountAgreements: AgreementData[] = [],
  accountPendingContractSent: boolean = false
): 'red' | 'yellow' | 'green' {
  // Check for pending contracts first - if any are pending, always return yellow
  if (accountPendingContractSent) {
    return 'yellow';
  }
  
  // Check if any location has a pending contract
  const hasPendingLocationContract = locations.some(loc => loc.pending_contract_sent);
  if (hasPendingLocationContract) {
    return 'yellow';
  }

  // Handle accounts with no locations
  if (locations.length === 0) {
    // If account has agreements even without locations, it's at least yellow
    if (accountAgreements.length > 0) {
      return 'yellow';
    }
    return 'red';
  }

  // Get all location IDs for this account
  const locationIds = new Set(locations.map(loc => loc.id));
  
  // Check if account has any agreements (account-level agreements apply to all locations)
  // An agreement is account-level if it has no location_id, or if it's linked to any location in this account
  const hasAccountLevelAgreements = accountAgreements.some(ag => 
    !ag.location_id || locationIds.has(ag.location_id)
  );

  // Helper to check if a location has a contract
  const hasContract = (locationId: string, agreementDocUrl: string | null): boolean => {
    // Check if location has agreement_document_url
    const hasAgreementDoc = agreementDocUrl != null && agreementDocUrl.trim() !== '';
    // Check if location has agreements in the agreements table (location-specific)
    const locationAgreements = agreementsByLocation.get(locationId) || [];
    const hasLocationAgreements = locationAgreements.length > 0;
    // Account-level agreements apply to all locations
    return hasAgreementDoc || hasLocationAgreements || hasAccountLevelAgreements;
  };

  // Helper to check if a location has a license
  const hasLicense = (licenseDocUrl: string | null): boolean => {
    return licenseDocUrl != null && licenseDocUrl.trim() !== '';
  };

  // Check each location for contracts and licenses
  let hasAnyContract = false;
  let hasAnyLicense = false;
  let allLocationsComplete = true;

  for (const location of locations) {
    const locationHasContract = hasContract(location.id, location.agreement_document_url);
    const locationHasLicense = hasLicense(location.license_document_url);

    if (locationHasContract) hasAnyContract = true;
    if (locationHasLicense) hasAnyLicense = true;

    // A location is complete if it has both contract AND license
    if (!locationHasContract || !locationHasLicense) {
      allLocationsComplete = false;
    }
  }

  // Debug logging for Acorn Fertility
  const isAcorn = locations.some(loc => loc.agreement_document_url && loc.agreement_document_url.includes('Acorn'));
  if (isAcorn || hasAccountLevelAgreements) {
    console.log(`[Status Calc Detail] hasAnyContract=${hasAnyContract}, hasAnyLicense=${hasAnyLicense}, allLocationsComplete=${allLocationsComplete}, hasAccountLevelAgreements=${hasAccountLevelAgreements}`);
  }

  // Red: No contracts AND no licenses
  if (!hasAnyContract && !hasAnyLicense) {
    return 'red';
  }

  // Green: All locations have both contract AND license
  if (allLocationsComplete) {
    return 'green';
  }

  // Yellow: At least one document exists but not all locations are complete
  return 'yellow';
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

  if (filters?.accountType) {
    baseQuery = baseQuery.eq('account_type', filters.accountType);
  }

  if (filters?.search) {
    const search = filters.search;
    baseQuery = baseQuery.or(
      `name.ilike.%${search}%,primary_contact_name.ilike.%${search}%,primary_contact_email.ilike.%${search}%,sage_code.ilike.%${search}%`
    );
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

  const accountsData = allAccounts as Account[];
  const accountIds = accountsData.map(acc => acc.id);

  // Batch size for queries (PostgreSQL has limits on .in() array size)
  const BATCH_SIZE = 100; // PostgreSQL typically handles up to ~1000 items, but we'll use 100 to be safe

  // Get all locations for these accounts in batches
  let locations: any[] = [];
  
  for (let i = 0; i < accountIds.length; i += BATCH_SIZE) {
    const batch = accountIds.slice(i, i + BATCH_SIZE);
    const { data: batchLocations, error: locationsError } = await supabase
      .from('locations')
      .select('id, account_id, city, state, country, address_line1, zip_code, license_document_url, agreement_document_url, updated_at, pending_contract_sent')
      .in('account_id', batch);

    if (locationsError) {
      console.error(`Error fetching locations batch ${i / BATCH_SIZE + 1}:`, locationsError);
    } else {
      locations = locations.concat(batchLocations || []);
    }
  }

  const locationsData = (locations || []) as LocationData[];

  // Get all agreements for these accounts
  // Agreements can be linked by account_id OR location_id
  const locationIds = locationsData.map(loc => loc.id);
  type AgreementData = { 
    id: string; 
    account_id: string; 
    location_id: string | null; 
    signed_date: string | null; 
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    status: string;
  };
  
  // Fetch agreements by account_id in batches
  let agreements: AgreementData[] = [];
  
  if (accountIds.length > 0) {
    for (let i = 0; i < accountIds.length; i += BATCH_SIZE) {
      const batch = accountIds.slice(i, i + BATCH_SIZE);
      const { data: batchAgreements, error: agreementsByAccountError } = await supabase
        .from('agreements')
        .select('id, account_id, location_id, signed_date, start_date, end_date, created_at, status')
        .in('account_id', batch);

      if (agreementsByAccountError) {
        console.error(`Error fetching agreements batch ${i / BATCH_SIZE + 1}:`, agreementsByAccountError);
      } else {
        agreements = agreements.concat((batchAgreements || []) as AgreementData[]);
      }
    }
  }

  // Group locations by account_id
  const locationsByAccount = new Map<string, LocationData[]>();
  locationsData.forEach(loc => {
    if (!locationsByAccount.has(loc.account_id)) {
      locationsByAccount.set(loc.account_id, []);
    }
    locationsByAccount.get(loc.account_id)!.push(loc);
  });

  // Group agreements by location_id and by account_id
  const agreementsByLocation = new Map<string, AgreementData[]>();
  const agreementsByAccount = new Map<string, AgreementData[]>();
  
  agreements.forEach(agreement => {
    // Group by account_id (primary grouping)
    if (!agreementsByAccount.has(agreement.account_id)) {
      agreementsByAccount.set(agreement.account_id, []);
    }
    agreementsByAccount.get(agreement.account_id)!.push(agreement);
    
    // Also group by location_id if it exists (for document status calculation)
    if (agreement.location_id) {
      if (!agreementsByLocation.has(agreement.location_id)) {
        agreementsByLocation.set(agreement.location_id, []);
      }
      agreementsByLocation.get(agreement.location_id)!.push(agreement);
    }
  });
  

  // Build enriched accounts with metadata for ALL accounts
  const enrichedAccounts: AccountWithMetadata[] = accountsData.map(account => {
    const accountLocations = locationsByAccount.get(account.id) || [];
    const accountAgreements = agreementsByAccount.get(account.id) || [];
    
    // Check for contracts: agreements table OR agreement_document_url on any location
    const hasAgreementsInTable = accountAgreements.length > 0;
    const hasAgreementDocuments = accountLocations.some(loc => {
      const url = loc.agreement_document_url;
      return url != null && typeof url === 'string' && url.trim().length > 0;
    });
    const hasContracts = hasAgreementsInTable || hasAgreementDocuments;
    
    // Check for licenses (any location has license_document_url)
    const hasLicenses = accountLocations.some(loc => {
      const url = loc.license_document_url;
      return url != null && typeof url === 'string' && url.trim().length > 0;
    });
    
      // Get most recent contract date from multiple sources:
      // 1. Agreements with signed_date
      // 2. Agreements with start_date (if no signed_date)
      // 3. Agreements with end_date (if no signed_date or start_date)
      // 4. Agreements with created_at (if no other date)
      // 5. Locations with agreement_document_url (use updated_at when document was uploaded)
      const contractDates: { date: string; source: string }[] = [];
      
      // Collect dates from agreements
      accountAgreements.forEach(ag => {
        if (ag.signed_date) {
          contractDates.push({ date: ag.signed_date, source: 'signed_date' });
        } else if (ag.start_date) {
          contractDates.push({ date: ag.start_date, source: 'start_date' });
        } else if (ag.end_date) {
          contractDates.push({ date: ag.end_date, source: 'end_date' });
        } else if (ag.created_at) {
          contractDates.push({ date: ag.created_at, source: 'created_at' });
        }
      });
      
      // Collect dates from locations with agreement_document_url
      accountLocations.forEach(loc => {
        if (loc.agreement_document_url && loc.updated_at) {
          contractDates.push({ date: loc.updated_at, source: 'location_updated_at' });
        }
      });
      
      // Sort by date (most recent first) and get the most recent
      const mostRecentContractDate = contractDates.length > 0
        ? contractDates.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA; // Most recent first
          })[0].date
        : null;

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

    // Calculate document status (pass account agreements and pending contract status)
    const documentStatus = calculateDocumentStatus(
      accountLocations, 
      agreementsByLocation, 
      accountAgreements,
      account.pending_contract_sent
    );
    
    // Calculate pending contract count
    // For single-location accounts: use account.pending_contract_sent (0 or 1)
    // For multi-location accounts: count locations with pending_contract_sent = true
    const isMultiLocation = account.account_type === 'multi_location' || accountLocations.length > 1;
    let pendingContractCount = 0;
    if (isMultiLocation) {
      // Count locations with pending contracts
      pendingContractCount = accountLocations.filter(loc => loc.pending_contract_sent).length;
    } else {
      // For single-location, use account-level pending_contract_sent
      pendingContractCount = account.pending_contract_sent ? 1 : 0;
    }
    
    // Debug: Log status calculation for Acorn Fertility specifically
    if (account.name === 'Acorn Fertility' || account.name.toLowerCase().includes('acorn')) {
      console.log(`[Status Calc] Account "${account.name}": status=${documentStatus}, locations=${accountLocations.length}, hasContracts=${hasContracts}, hasLicenses=${hasLicenses}`);
      console.log(`[Status Calc] Account agreements: ${accountAgreements.length}, location agreements map size: ${agreementsByLocation.size}`);
      accountLocations.forEach(loc => {
        const locAgreements = agreementsByLocation.get(loc.id) || [];
        console.log(`[Status Calc] Location "${loc.id}": agreement_doc_url=${loc.agreement_document_url ? 'yes' : 'no'}, license_doc_url=${loc.license_document_url ? 'yes' : 'no'}, agreements_in_table=${locAgreements.length}`);
      });
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
      documentStatus,
      pendingContractCount,
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

  // Apply all filters on ALL accounts, not just the page
  let filteredAccounts = enrichedAccounts;
  
  // Apply country filter first
  if (filters?.country) {
    filteredAccounts = filteredAccounts.filter(acc => accountMatchesCountryFilter(acc, filters.country!));
  }
  
  // Filter by document status if requested
  if (filters?.sortByStatus) {
    const filterStatus = filters.sortByStatus;
    const beforeCount = filteredAccounts.length;
    const statusCounts = {
      red: filteredAccounts.filter(acc => acc.documentStatus === 'red').length,
      yellow: filteredAccounts.filter(acc => acc.documentStatus === 'yellow').length,
      green: filteredAccounts.filter(acc => acc.documentStatus === 'green').length,
    };
    console.log(`[Status Filter] === FILTERING ===`);
    console.log(`[Status Filter] Filter parameter received: "${filterStatus}" (type: ${typeof filterStatus})`);
    console.log(`[Status Filter] Before filter: total=${beforeCount}, red=${statusCounts.red}, yellow=${statusCounts.yellow}, green=${statusCounts.green}`);
    
    // Verify a few accounts have the correct status before filtering
    const sampleAccounts = filteredAccounts.slice(0, 5);
    console.log(`[Status Filter] Sample accounts before filter:`);
    sampleAccounts.forEach(acc => {
      console.log(`  "${acc.name}": documentStatus="${acc.documentStatus}" (type: ${typeof acc.documentStatus})`);
    });
    
    filteredAccounts = filteredAccounts.filter(acc => {
      const matches = acc.documentStatus === filterStatus;
      if (!matches && sampleAccounts.includes(acc)) {
        console.log(`[Status Filter] Account "${acc.name}" filtered out: documentStatus="${acc.documentStatus}" !== filterStatus="${filterStatus}"`);
      }
      return matches;
    });
    
    console.log(`[Status Filter] After filter: ${filteredAccounts.length} accounts with status="${filterStatus}"`);
    if (filteredAccounts.length > 0) {
      console.log(`[Status Filter] First 5 filtered accounts with their actual statuses:`);
      filteredAccounts.slice(0, 5).forEach(acc => {
        console.log(`  "${acc.name}": documentStatus="${acc.documentStatus}"`);
      });
    } else {
      console.log(`[Status Filter] WARNING: No accounts found with status="${filterStatus}"`);
    }
    console.log(`[Status Filter] === END FILTERING ===`);
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
          pending_contract_sent: false,
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
          pending_contract_sent: false,
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
