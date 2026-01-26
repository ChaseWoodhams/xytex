import { createAdminClient } from './admin';
import type { Location, LocationVialSale } from './types';
import { getAccountById } from './accounts';

export async function getLocationsByAccount(accountId: string): Promise<Location[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('account_id', accountId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    const errorDetails = {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    };
    console.error('Error fetching locations:', errorDetails);
    // Create a new error with more details to ensure it serializes properly
    const enhancedError = new Error(
      `Failed to fetch locations for account ${accountId}: ${error.message || 'Unknown error'}`
    );
    (enhancedError as any).originalError = error;
    (enhancedError as any).code = error.code;
    throw enhancedError;
  }

  return data || [];
}

export async function getLocationById(id: string): Promise<Location | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching location:', error);
    return null;
  }

  return data;
}

/**
 * Generate a unique clinic code for a location
 * Format: XYB-{ACCOUNT_ID_SHORT}-{location_number} (e.g., XYB-A1B2C3-001, XYB-A1B2C3-002)
 * Uses first 6 characters of account UUID to group locations by account
 * Only applies to locations, not accounts
 */
function generateClinicCode(
  accountId: string,
  existingLocations: Location[]
): string {
  // Get the next location number (1-indexed)
  const locationNumber = existingLocations.length + 1;
  const paddedNumber = locationNumber.toString().padStart(3, '0');
  
  // Use first 6 characters of account UUID (uppercase, no hyphens) as account identifier
  const accountIdentifier = accountId.replace(/-/g, '').substring(0, 6).toUpperCase();
  
  // Format: XYB-{ACCOUNT_ID_SHORT}-{LOCATION_NUMBER}
  return `XYB-${accountIdentifier}-${paddedNumber}`;
}

export async function createLocation(
  locationData: Omit<Location, 'id' | 'created_at' | 'updated_at' | 'clinic_code'> & { clinic_code?: string | null }
): Promise<Location | null> {
  const supabase = createAdminClient();
  
  // Check if this account already has locations
  const existingLocations = await getLocationsByAccount(locationData.account_id);
  
  // Auto-generate clinic code for locations only (not accounts)
  // Format: XYB-{ACCOUNT_ID_SHORT}-001, XYB-{ACCOUNT_ID_SHORT}-002, etc.
  let clinicCode = locationData.clinic_code || null;
  if (!clinicCode) {
    clinicCode = generateClinicCode(locationData.account_id, existingLocations);
  }
  
  // If this is marked as primary, unset other primary locations for this account
  if (locationData.is_primary) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('locations') as any)
      .update({ is_primary: false })
      .eq('account_id', locationData.account_id)
      .eq('is_primary', true);
  }

  // Prepare location data with auto-generated clinic code
  const locationToInsert = {
    ...locationData,
    clinic_code: clinicCode,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('locations') as any)
    .insert(locationToInsert)
    .select()
    .single();

  if (error) {
    console.error('Error creating location:', error);
    return null;
  }

  // If this is the second location (or more), convert account to multi_location
  if (existingLocations.length >= 1) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('accounts') as any)
      .update({ account_type: 'multi_location' })
      .eq('id', locationData.account_id);

    if (updateError) {
      console.error('Error updating account type:', updateError);
      // Don't fail the location creation if account update fails
    }
  }

  // If this is the first location for a multi-location account, set clinic name to this location's name
  if (existingLocations.length === 0) {
    const account = await getAccountById(locationData.account_id);
    if (account && account.account_type === 'multi_location' && !account.udf_clinic_name) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('accounts') as any)
        .update({ udf_clinic_name: locationData.name })
        .eq('id', locationData.account_id);
      console.log(`[createLocation] Set account clinic name to first location name: ${locationData.name}`);
    }
  }

  return data;
}

export async function updateLocation(
  id: string,
  updates: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at' | 'account_id'>>
): Promise<Location | null> {
  const supabase = createAdminClient();
  
  // If setting as primary, unset other primary locations
  if (updates.is_primary === true) {
    const location = await getLocationById(id);
    if (location) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('locations') as any)
        .update({ is_primary: false })
        .eq('account_id', location.account_id)
        .eq('is_primary', true)
        .neq('id', id);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('locations') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating location:', error);
    return null;
  }

  return data;
}

export async function deleteLocation(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  
  // Get the location first to check account_id
  const location = await getLocationById(id);
  if (!location) {
    console.error('Location not found:', id);
    return false;
  }

  // Delete the location
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting location:', error);
    return false;
  }

  // Check if this was the last location for the account
  // If so, we might want to handle account type, but for now we'll leave it
  // The account type can be manually updated if needed
  const remainingLocations = await getLocationsByAccount(location.account_id);
  
  // If no locations remain and account is multi_location, we could convert it to single_location
  // But we'll leave this as-is to avoid breaking existing data
  // The account type can be manually updated if needed

  return true;
}

export async function uploadLocationAgreementDocument(
  file: File | Blob,
  locationId: string,
  fileName?: string
): Promise<{ url: string } | { error: string }> {
  const supabase = createAdminClient();
  
  // Generate unique filename with UUID to ensure uniqueness
  const originalName = file instanceof File ? file.name : 'document';
  const fileExt = originalName.split('.').pop() || 'pdf';
  
  // Generate a truly unique filename using UUID
  // Fallback to timestamp + random if crypto.randomUUID() is not available
  const generateUniqueId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback: timestamp + random number
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };
  
  let uniqueFileName: string;
  if (fileName) {
    // If a specific filename is provided, use it but make it unique
    const baseName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
    uniqueFileName = `${baseName}-${generateUniqueId()}.${fileExt}`;
  } else {
    // Generate unique filename: location-{locationId}-{uuid}.{ext}
    uniqueFileName = `location-${locationId}-${generateUniqueId()}.${fileExt}`;
  }
  
  const filePath = `location-agreements/${uniqueFileName}`;

  try {
    // Convert File/Blob to ArrayBuffer for server-side upload
    const arrayBuffer = await file.arrayBuffer();

    // Upload file to Supabase Storage with upsert enabled to allow overwriting
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('agreements')
      .upload(filePath, arrayBuffer, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting if file exists
        contentType: file instanceof File ? file.type : 'application/pdf',
      });

    if (uploadError) {
      console.error('Error uploading location agreement document:', {
        locationId,
        filePath,
        fileName: uniqueFileName,
        error: uploadError.message,
        errorDetails: uploadError
      });
      
      // Provide more specific error messages
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('The resource was not found')) {
        return { error: 'Storage bucket "agreements" not found. Please create it in Supabase Storage.' };
      }
      if (uploadError.message?.includes('new row violates row-level security')) {
        return { error: 'Permission denied. Check storage bucket policies.' };
      }
      if (uploadError.message?.includes('duplicate')) {
        return { error: 'File already exists. Please use a different filename.' };
      }
      
      return { error: uploadError.message || 'Failed to upload document to storage' };
    }

    if (!uploadData) {
      return { error: 'Upload succeeded but no data returned' };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('agreements')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return { error: 'Failed to generate public URL for uploaded document' };
    }

    return { url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Unexpected error uploading location agreement document:', {
      locationId,
      error: error.message,
      stack: error.stack
    });
    return { error: error.message || 'Unexpected error during upload' };
  }
}

export async function updateLocationAgreementDocumentUrl(
  locationId: string,
  documentUrl: string | null
): Promise<boolean> {
  const supabase = createAdminClient();
  
  // First verify the location exists
  const location = await getLocationById(locationId);
  if (!location) {
    console.error(`Location not found: ${locationId}`);
    return false;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('locations') as any)
    .update({ agreement_document_url: documentUrl })
    .eq('id', locationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating location agreement document URL:', {
      locationId,
      documentUrl,
      error: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return false;
  }

  if (!data) {
    console.error(`Failed to update location ${locationId}: No data returned`);
    return false;
  }

  return true;
}

export async function uploadLocationLicenseDocument(
  file: File | Blob,
  locationId: string,
  fileName?: string
): Promise<{ url: string } | { error: string }> {
  const supabase = createAdminClient();
  
  // Generate unique filename with UUID to ensure uniqueness
  const originalName = file instanceof File ? file.name : 'document';
  const fileExt = originalName.split('.').pop() || 'pdf';
  
  // Generate a truly unique filename using UUID
  // Fallback to timestamp + random if crypto.randomUUID() is not available
  const generateUniqueId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback: timestamp + random number
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };
  
  let uniqueFileName: string;
  if (fileName) {
    // If a specific filename is provided, use it but make it unique
    const baseName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
    uniqueFileName = `${baseName}-${generateUniqueId()}.${fileExt}`;
  } else {
    // Generate unique filename: license-{locationId}-{uuid}.{ext}
    uniqueFileName = `license-${locationId}-${generateUniqueId()}.${fileExt}`;
  }
  
  const filePath = `location-licenses/${uniqueFileName}`;

  try {
    // Convert File/Blob to ArrayBuffer for server-side upload
    const arrayBuffer = await file.arrayBuffer();

    // Upload file to Supabase Storage with upsert enabled to allow overwriting
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('agreements')
      .upload(filePath, arrayBuffer, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting if file exists
        contentType: file instanceof File ? file.type : 'application/pdf',
      });

    if (uploadError) {
      console.error('Error uploading location license document:', {
        locationId,
        filePath,
        fileName: uniqueFileName,
        error: uploadError.message,
        errorDetails: uploadError
      });
      
      // Provide more specific error messages
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('The resource was not found')) {
        return { error: 'Storage bucket "agreements" not found. Please create it in Supabase Storage.' };
      }
      if (uploadError.message?.includes('new row violates row-level security')) {
        return { error: 'Permission denied. Check storage bucket policies.' };
      }
      if (uploadError.message?.includes('duplicate')) {
        return { error: 'File already exists. Please use a different filename.' };
      }
      
      return { error: uploadError.message || 'Failed to upload document to storage' };
    }

    if (!uploadData) {
      return { error: 'Upload succeeded but no data returned' };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('agreements')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return { error: 'Failed to generate public URL for uploaded document' };
    }

    return { url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Unexpected error uploading location license document:', {
      locationId,
      error: error.message,
      stack: error.stack
    });
    return { error: error.message || 'Unexpected error during upload' };
  }
}

export async function updateLocationLicenseDocumentUrl(
  locationId: string,
  documentUrl: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();
  
  // First verify the location exists
  const location = await getLocationById(locationId);
  if (!location) {
    const errorMsg = `Location not found: ${locationId}`;
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('locations') as any)
    .update({ license_document_url: documentUrl })
    .eq('id', locationId)
    .select()
    .single();

  if (error) {
    const errorDetails = {
      locationId,
      documentUrl,
      error: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    };
    console.error('Error updating location license document URL:', errorDetails);
    return { 
      success: false, 
      error: error.message || `Database error: ${error.code || 'Unknown error'}` 
    };
  }

  if (!data) {
    const errorMsg = `Failed to update location ${locationId}: No data returned`;
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  return { success: true };
}

/**
 * Add vials to a location
 * Increments the total_vials_sold count and creates a sale record
 */
export async function addVialsToLocation(
  locationId: string,
  vialsCount: number,
  userId: string,
  notes?: string
): Promise<{ success: boolean; data?: LocationVialSale; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Verify location exists
    const location = await getLocationById(locationId);
    if (!location) {
      const errorMsg = `Location not found: ${locationId}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Calculate new total (handle case where total_vials_sold might not exist yet)
    const currentTotal = typeof location.total_vials_sold === 'number' ? location.total_vials_sold : 0;
    const newTotal = currentTotal + vialsCount;

    // Start a transaction-like operation
    // First, increment the total_vials_sold on the location
    const { data: updatedLocation, error: updateError } = await (supabase.from('locations') as any)
      .update({ 
        total_vials_sold: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', locationId)
      .select()
      .single();

    if (updateError) {
      const errorDetails = {
        error: updateError,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
        locationId,
        vialsCount,
        currentTotal,
        newTotal,
      };
      console.error('Error updating location vials count:', JSON.stringify(errorDetails, null, 2));
      return { 
        success: false, 
        error: `Failed to update location: ${updateError.message || updateError.code || 'Unknown error'}` 
      };
    }

    // Then, create the sale record
    const saleData = {
      location_id: locationId,
      vials_added: vialsCount,
      entered_by: userId,
      notes: notes || null,
    };

    const { data: saleRecord, error: insertError } = await (supabase.from('location_vial_sales') as any)
      .insert(saleData)
      .select()
      .single();

    if (insertError) {
      const errorDetails = {
        error: insertError,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        saleData,
        locationId,
        userId,
      };
      console.error('Error creating vial sale record:', JSON.stringify(errorDetails, null, 2));
      
      // Rollback: decrement the total_vials_sold
      await (supabase.from('locations') as any)
        .update({ 
          total_vials_sold: currentTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', locationId);
      
      return { 
        success: false, 
        error: `Failed to create sale record: ${insertError.message || insertError.code || 'Unknown error'}` 
      };
    }

    return { success: true, data: saleRecord };
  } catch (error: any) {
    const errorMsg = `Unexpected error in addVialsToLocation: ${error.message || 'Unknown error'}`;
    console.error(errorMsg, error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Get all vial sales for a location
 * Returns entries ordered by most recent first
 */
export async function getLocationVialSales(locationId: string): Promise<LocationVialSale[]> {
  const supabase = createAdminClient();
  
  const { data, error } = await (supabase.from('location_vial_sales') as any)
    .select('*')
    .eq('location_id', locationId)
    .order('entered_at', { ascending: false });

  if (error) {
    console.error('Error fetching location vial sales:', error);
    return [];
  }

  return data || [];
}
