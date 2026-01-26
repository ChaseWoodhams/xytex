import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';

/**
 * Escape CSV field value
 */
function escapeCsvField(value: string | null | undefined): string {
  if (!value) return '';
  const stringValue = String(value);
  // If value contains comma, newline, or quote, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Convert array of objects to CSV string
 * Maps header display names to object property names
 */
function arrayToCsv(data: Record<string, any>[], headers: string[], headerToPropertyMap: Record<string, string>): string {
  const rows = [headers.map(escapeCsvField).join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const propertyName = headerToPropertyMap[header] || header.toLowerCase().replace(/\s+/g, '_');
      return escapeCsvField(row[propertyName] || '');
    });
    rows.push(values.join(','));
  }
  
  return rows.join('\n');
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProfile = await getCurrentUser();
    if (!canAccessAdmin(userProfile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Fetch all accounts with contact information - use select('*') to match working patterns
    let accounts: any[] = [];
    try {
      const { data: accountsData, error: accountsError } = await adminClient
        .from('accounts')
        .select('*')
        .order('name');

      if (accountsError) {
        console.error('[Export] Error fetching accounts:', {
          message: accountsError.message,
          details: accountsError.details,
          hint: accountsError.hint,
          code: accountsError.code,
          fullError: JSON.stringify(accountsError, Object.getOwnPropertyNames(accountsError))
        });
        return NextResponse.json(
          { error: `Failed to fetch accounts: ${accountsError.message}` },
          { status: 500 }
        );
      }

      accounts = accountsData || [];
      console.log(`[Export] Successfully fetched ${accounts.length} accounts`);
    } catch (error: any) {
      console.error('[Export] Exception fetching accounts:', {
        message: error.message,
        stack: error.stack
      });
      return NextResponse.json(
        { error: `Exception fetching accounts: ${error.message}` },
        { status: 500 }
      );
    }

    // Fetch all locations with contact information - use select('*') to match working patterns
    let locations: any[] = [];
    try {
      const { data: locationsData, error: locationsError } = await adminClient
        .from('locations')
        .select('*')
        .order('account_id, name');

      if (locationsError) {
        console.error('[Export] Error fetching locations:', {
          message: locationsError.message,
          details: locationsError.details,
          hint: locationsError.hint,
          code: locationsError.code,
          fullError: JSON.stringify(locationsError, Object.getOwnPropertyNames(locationsError))
        });
        return NextResponse.json(
          { error: `Failed to fetch locations: ${locationsError.message}` },
          { status: 500 }
        );
      }

      locations = locationsData || [];
      console.log(`[Export] Successfully fetched ${locations.length} locations`);
    } catch (error: any) {
      console.error('[Export] Exception fetching locations:', {
        message: error.message,
        stack: error.stack
      });
      return NextResponse.json(
        { error: `Exception fetching locations: ${error.message}` },
        { status: 500 }
      );
    }

    // Fetch all location contacts - use select('*') to match working patterns
    let locationContacts: any[] = [];
    try {
      const { data: locationContactsData, error: locationContactsError } = await adminClient
        .from('location_contacts')
        .select('*')
        .order('location_id, is_primary', { ascending: false });

      if (locationContactsError) {
        console.error('[Export] Error fetching location contacts:', {
          message: locationContactsError.message,
          details: locationContactsError.details,
          hint: locationContactsError.hint,
          code: locationContactsError.code,
          fullError: JSON.stringify(locationContactsError, Object.getOwnPropertyNames(locationContactsError))
        });
        return NextResponse.json(
          { error: `Failed to fetch location contacts: ${locationContactsError.message}` },
          { status: 500 }
        );
      }

      locationContacts = locationContactsData || [];
      console.log(`[Export] Successfully fetched ${locationContacts.length} location contacts`);
    } catch (error: any) {
      console.error('[Export] Exception fetching location contacts:', {
        message: error.message,
        stack: error.stack
      });
      return NextResponse.json(
        { error: `Exception fetching location contacts: ${error.message}` },
        { status: 500 }
      );
    }

    // Validate data arrays exist
    if (!Array.isArray(accounts)) {
      console.error('[Export] Accounts is not an array:', typeof accounts);
      accounts = [];
    }
    if (!Array.isArray(locations)) {
      console.error('[Export] Locations is not an array:', typeof locations);
      locations = [];
    }
    if (!Array.isArray(locationContacts)) {
      console.error('[Export] Location contacts is not an array:', typeof locationContacts);
      locationContacts = [];
    }

    // Create a map of location_id to account name for easier lookup
    const locationToAccountMap = new Map<string, string>();
    const accountMap = new Map(accounts.map(acc => [acc.id, acc.name || '']));
    locations.forEach(loc => {
      const accountName = accountMap.get(loc.account_id) || 'Unknown Account';
      locationToAccountMap.set(loc.id, accountName);
    });

    // Log what we fetched for debugging
    console.log(`[Export] Fetched ${accounts.length} accounts, ${locations.length} locations, ${locationContacts.length} location contacts`);
    
    // Debug: Log sample data structure to verify field names
    if (accounts.length > 0) {
      console.log('[Export] Sample account structure:', JSON.stringify(accounts[0], null, 2));
    }
    if (locations.length > 0) {
      console.log('[Export] Sample location structure:', JSON.stringify(locations[0], null, 2));
    }
    if (locationContacts.length > 0) {
      console.log('[Export] Sample location contact structure:', JSON.stringify(locationContacts[0], null, 2));
    }

    // Build comprehensive contact list
    const contactRows: Record<string, any>[] = [];

    // Add account-level contacts - include ALL accounts even without contact info
    accounts.forEach((account: any) => {
      // Debug: Log account to see what fields exist
      if (contactRows.length === 0) {
        console.log('[Export] Processing first account:', {
          id: account.id,
          name: account.name,
          hasPrimaryContact: !!(account.primary_contact_name || account.primary_contact_email || account.primary_contact_phone),
          keys: Object.keys(account),
        });
      }
      
      // Always include account primary contact row (even if empty)
      contactRows.push({
        type: 'Account Primary Contact',
        account_name: account.name || '',
        account_id: account.id || '',
        location_name: '',
        location_id: '',
        contact_name: account.primary_contact_name || '',
        email: account.primary_contact_email || '',
        phone: account.primary_contact_phone || '',
        title: '',
        role: 'Primary',
        is_primary: 'Yes',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        website: account.website || '',
        industry: account.industry || '',
        status: account.status || '',
      });

      // UDF contact from account (if exists and different from primary)
      if (account.udf_email || account.udf_phone) {
        const udfEmail = account.udf_email || '';
        const udfPhone = account.udf_phone || '';
        const primaryEmail = account.primary_contact_email || '';
        const primaryPhone = account.primary_contact_phone || '';
        
        // Only add if UDF contact info is different from primary
        if (udfEmail !== primaryEmail || udfPhone !== primaryPhone) {
          contactRows.push({
            type: 'Account UDF Contact',
            account_name: account.name || '',
            account_id: account.id,
            location_name: '',
            location_id: '',
            contact_name: '',
            email: udfEmail,
            phone: udfPhone,
            title: '',
            role: 'UDF',
            is_primary: 'No',
            address_line1: '',
            address_line2: '',
            city: '',
            state: '',
            zip_code: '',
            country: '',
            website: account.website || '',
            industry: account.industry || '',
            status: account.status || '',
          });
        }
      }
    });

    // Add location-level contacts - include ALL locations even without contact info
    locations.forEach((location: any) => {
      const accountName = accountMap.get(location.account_id) || 'Unknown Account';
      
      // Always include location row (even if no contact info)
      contactRows.push({
        type: 'Location Contact',
        account_name: accountName,
        account_id: location.account_id || '',
        location_name: location.name || '',
        location_id: location.id || '',
        contact_name: location.contact_name || '',
        email: location.email || '',
        phone: location.phone || '',
        title: location.contact_title || '',
        role: location.is_primary ? 'Primary Location Contact' : 'Location Contact',
        is_primary: location.is_primary ? 'Yes' : 'No',
        address_line1: location.address_line1 || '',
        address_line2: location.address_line2 || '',
        city: location.city || '',
        state: location.state || '',
        zip_code: location.zip_code || '',
        country: location.country || '',
        website: '',
        industry: '',
        status: location.status || '',
      });
    });

    // Add location_contacts table entries - include ALL location contacts
    locationContacts.forEach((contact: any) => {
      const accountName = locationToAccountMap.get(contact.location_id) || 'Unknown Account';
      const location = locations.find((loc: any) => loc.id === contact.location_id);
      
      contactRows.push({
        type: 'Location Contact (Detailed)',
        account_name: accountName,
        account_id: location?.account_id || '',
        location_name: location?.name || '',
        location_id: contact.location_id || '',
        contact_name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        title: contact.title || '',
        role: contact.role || '',
        is_primary: contact.is_primary ? 'Yes' : 'No',
        address_line1: location?.address_line1 || '',
        address_line2: location?.address_line2 || '',
        city: location?.city || '',
        state: location?.state || '',
        zip_code: location?.zip_code || '',
        country: location?.country || '',
        website: '',
        industry: '',
        status: location?.status || '',
      });
    });

    console.log(`[Export] Generated ${contactRows.length} contact rows`);
    
    // Debug: Log sample row to verify data structure
    if (contactRows.length > 0) {
      console.log('[Export] Sample contact row:', JSON.stringify(contactRows[0], null, 2));
    }

    // Validate contactRows is an array
    if (!Array.isArray(contactRows)) {
      console.error('[Export] Contact rows is not an array:', typeof contactRows);
      return NextResponse.json(
        { error: 'Failed to generate contact rows' },
        { status: 500 }
      );
    }

    // Define CSV headers and mapping to property names
    const headers = [
      'Type',
      'Account Name',
      'Account ID',
      'Location Name',
      'Location ID',
      'Contact Name',
      'Email',
      'Phone',
      'Title',
      'Role',
      'Is Primary',
      'Address Line 1',
      'Address Line 2',
      'City',
      'State',
      'Zip Code',
      'Country',
      'Website',
      'Industry',
      'Status',
    ];

    // Map header display names to object property names
    const headerToPropertyMap: Record<string, string> = {
      'Type': 'type',
      'Account Name': 'account_name',
      'Account ID': 'account_id',
      'Location Name': 'location_name',
      'Location ID': 'location_id',
      'Contact Name': 'contact_name',
      'Email': 'email',
      'Phone': 'phone',
      'Title': 'title',
      'Role': 'role',
      'Is Primary': 'is_primary',
      'Address Line 1': 'address_line1',
      'Address Line 2': 'address_line2',
      'City': 'city',
      'State': 'state',
      'Zip Code': 'zip_code',
      'Country': 'country',
      'Website': 'website',
      'Industry': 'industry',
      'Status': 'status',
    };

    // Convert to CSV - always include headers even if no data rows
    const csvContent = arrayToCsv(contactRows, headers, headerToPropertyMap);

    // Validate CSV content is not empty (should at least have headers)
    if (!csvContent || csvContent.trim().length === 0) {
      console.error('[Export] CSV content is empty after generation');
      return NextResponse.json(
        { error: 'Failed to generate CSV content' },
        { status: 500 }
      );
    }

    // Add BOM (Byte Order Mark) for Excel compatibility
    const csvWithBOM = '\uFEFF' + csvContent;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `xytex-contacts-export-${timestamp}.csv`;

    console.log(`[Export] Returning CSV with ${contactRows.length} rows, ${csvContent.length} characters`);

    // Return CSV file
    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
