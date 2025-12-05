import { createAdminClient } from './admin';
import type { Agreement, AgreementType, AgreementStatus } from './types';

export type AgreementStatusIndicator = 'green' | 'yellow' | 'red' | 'none';

export interface AgreementStatusInfo {
  status: AgreementStatusIndicator;
  startDate: string | null;
  endDate: string | null;
  daysUntilRenewal: number | null;
}

export async function getAgreementsByAccount(accountId: string): Promise<Agreement[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('agreements')
      .select('*')
      .eq('corporate_account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agreements:', JSON.stringify(error, null, 2));
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching agreements:', err);
    return [];
  }
}

/**
 * Calculate agreement status indicator based on dates
 * Green: signed in last 12 months
 * Yellow: 3 months away from renewal (9 months since start, or end_date within 3 months)
 * Red: past 12 month window
 */
export function calculateAgreementStatus(
  startDate: string | null,
  endDate: string | null
): AgreementStatusInfo {
  if (!startDate) {
    return { status: 'none', startDate: null, endDate: null, daysUntilRenewal: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  // Calculate months since start date
  const monthsSinceStart = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  
  // For annual agreements, renewal is 12 months from start
  const renewalDate = new Date(start);
  renewalDate.setMonth(renewalDate.getMonth() + 12);
  
  // Calculate days until renewal
  const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Use end_date if available, otherwise calculate from start_date
  let effectiveEndDate = endDate ? new Date(endDate) : renewalDate;
  effectiveEndDate.setHours(0, 0, 0, 0);
  
  // Check if past 12 months
  if (monthsSinceStart > 12) {
    return {
      status: 'red',
      startDate,
      endDate,
      daysUntilRenewal: daysUntilRenewal < 0 ? daysUntilRenewal : null,
    };
  }
  
  // Check if within 3 months of renewal (9-12 months since start, or end_date within 3 months)
  const daysUntilEffectiveEnd = Math.ceil((effectiveEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (monthsSinceStart >= 9 || daysUntilEffectiveEnd <= 90) {
    return {
      status: 'yellow',
      startDate,
      endDate,
      daysUntilRenewal: daysUntilEffectiveEnd > 0 ? daysUntilEffectiveEnd : null,
    };
  }
  
  // Within last 12 months and not close to renewal
  return {
    status: 'green',
    startDate,
    endDate,
    daysUntilRenewal: daysUntilRenewal > 0 ? daysUntilRenewal : null,
  };
}

/**
 * Get location agreement health summary for multiple accounts
 * Returns a summary showing the health of all locations under each account
 */
export interface LocationAgreementHealth {
  total: number;
  green: number;
  yellow: number;
  red: number;
  none: number;
  worstStatus: AgreementStatusIndicator;
}

export async function getLocationAgreementHealthByAccounts(
  accountIds: string[]
): Promise<Record<string, LocationAgreementHealth>> {
  if (accountIds.length === 0) {
    return {};
  }

  try {
    const supabase = createAdminClient();
    
    // Get all locations for these accounts
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('id, corporate_account_id')
      .in('corporate_account_id', accountIds);

    if (locationsError) {
      console.error('Error fetching locations:', JSON.stringify(locationsError, null, 2));
      return {};
    }

    if (!locations || locations.length === 0) {
      // No locations, return empty health for all accounts
      const health: Record<string, LocationAgreementHealth> = {};
      accountIds.forEach(accountId => {
        health[accountId] = {
          total: 0,
          green: 0,
          yellow: 0,
          red: 0,
          none: 0,
          worstStatus: 'none',
        };
      });
      return health;
    }

    const locationIds = locations.map(l => l.id);
    
    // Get all agreements for these locations
    const { data: agreements, error: agreementsError } = await supabase
      .from('agreements')
      .select('location_id, start_date, end_date, status')
      .in('location_id', locationIds)
      .eq('status', 'active')
      .order('start_date', { ascending: false });

    if (agreementsError) {
      console.error('Error fetching agreements:', JSON.stringify(agreementsError, null, 2));
      return {};
    }

    // Calculate status for each location
    const locationStatuses: Record<string, AgreementStatusIndicator> = {};
    
    // Group agreements by location (get most recent)
    const locationAgreements: Record<string, { start_date: string | null; end_date: string | null }> = {};
    if (agreements) {
      agreements.forEach((agreement) => {
        const locationId = agreement.location_id;
        if (locationId && !locationAgreements[locationId]) {
          locationAgreements[locationId] = {
            start_date: agreement.start_date,
            end_date: agreement.end_date,
          };
        }
      });
    }

    // Calculate status for each location
    locationIds.forEach((locationId) => {
      const agreement = locationAgreements[locationId];
      if (agreement) {
        const statusInfo = calculateAgreementStatus(agreement.start_date, agreement.end_date);
        locationStatuses[locationId] = statusInfo.status;
      } else {
        locationStatuses[locationId] = 'none';
      }
    });

    // Group by account and calculate health summary
    const health: Record<string, LocationAgreementHealth> = {};
    
    accountIds.forEach((accountId) => {
      const accountLocations = locations.filter(l => l.corporate_account_id === accountId);
      const summary: LocationAgreementHealth = {
        total: accountLocations.length,
        green: 0,
        yellow: 0,
        red: 0,
        none: 0,
        worstStatus: 'none',
      };

      accountLocations.forEach((location) => {
        const status = locationStatuses[location.id] || 'none';
        summary[status]++;
      });

      // Determine worst status (red > yellow > green > none)
      if (summary.red > 0) {
        summary.worstStatus = 'red';
      } else if (summary.yellow > 0) {
        summary.worstStatus = 'yellow';
      } else if (summary.green > 0) {
        summary.worstStatus = 'green';
      }

      health[accountId] = summary;
    });

    return health;
  } catch (err) {
    console.error('Unexpected error fetching location agreement health:', err);
    return {};
  }
}

/**
 * Get agreement statuses for multiple locations
 * Returns a map of location ID to agreement status info
 */
export async function getAgreementStatusesByLocations(
  locationIds: string[]
): Promise<Record<string, AgreementStatusInfo>> {
  if (locationIds.length === 0) {
    return {};
  }

  try {
    const supabase = createAdminClient();
    
    // Get most recent active agreement for each location
    const { data, error } = await supabase
      .from('agreements')
      .select('location_id, start_date, end_date, status')
      .in('location_id', locationIds)
      .eq('status', 'active')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching location agreement statuses:', JSON.stringify(error, null, 2));
      return {};
    }

    // Group by location and get most recent
    const locationAgreements: Record<string, { start_date: string | null; end_date: string | null }> = {};
    
    if (data) {
      data.forEach((agreement) => {
        const locationId = agreement.location_id;
        if (locationId && !locationAgreements[locationId]) {
          locationAgreements[locationId] = {
            start_date: agreement.start_date,
            end_date: agreement.end_date,
          };
        }
      });
    }

    // Calculate status for each location
    const statuses: Record<string, AgreementStatusInfo> = {};
    locationIds.forEach((locationId) => {
      const agreement = locationAgreements[locationId];
      if (agreement) {
        statuses[locationId] = calculateAgreementStatus(
          agreement.start_date,
          agreement.end_date
        );
      } else {
        statuses[locationId] = { status: 'none', startDate: null, endDate: null, daysUntilRenewal: null };
      }
    });

    return statuses;
  } catch (err) {
    console.error('Unexpected error fetching location agreement statuses:', err);
    return {};
  }
}

export async function getAgreementsByLocation(locationId: string): Promise<Agreement[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('agreements')
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agreements:', JSON.stringify(error, null, 2));
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching agreements by location:', err);
    return [];
  }
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

/**
 * Get agreements expiring within the next N days
 * Returns agreements with their location and account info
 */
export interface ExpiringAgreement {
  agreement: Agreement;
  daysUntilExpiry: number;
  location_name: string | null;
  account_name: string;
  account_id: string;
}

export async function getExpiringAgreements(days: number = 90): Promise<ExpiringAgreement[]> {
  try {
    const supabase = createAdminClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    // Get active agreements with end_date within the range
    const { data: agreements, error } = await supabase
      .from('agreements')
      .select('*')
      .eq('status', 'active')
      .not('end_date', 'is', null)
      .gte('end_date', today.toISOString().split('T')[0])
      .lte('end_date', futureDate.toISOString().split('T')[0])
      .order('end_date', { ascending: true });

    if (error) {
      console.error('Error fetching expiring agreements:', JSON.stringify(error, null, 2));
      return [];
    }

    if (!agreements || agreements.length === 0) {
      return [];
    }

    // Get account and location info for each agreement
    const accountIds = [...new Set(agreements.map(a => a.corporate_account_id))];
    const locationIds = [...new Set(agreements.map(a => a.location_id).filter(Boolean) as string[])];

    const [accountsResult, locationsResult] = await Promise.all([
      supabase.from('corporate_accounts').select('id, name').in('id', accountIds),
      locationIds.length > 0 
        ? supabase.from('locations').select('id, name').in('id', locationIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const accounts = accountsResult.data || [];
    const locations = locationsResult.data || [];

    const accountMap = new Map(accounts.map(a => [a.id, a.name]));
    const locationMap = new Map(locations.map(l => [l.id, l.name]));

    return agreements.map(agreement => {
      const endDate = new Date(agreement.end_date!);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        agreement,
        daysUntilExpiry,
        location_name: agreement.location_id ? locationMap.get(agreement.location_id) || null : null,
        account_name: accountMap.get(agreement.corporate_account_id) || 'Unknown',
        account_id: agreement.corporate_account_id,
      };
    });
  } catch (err) {
    console.error('Unexpected error fetching expiring agreements:', err);
    return [];
  }
}

