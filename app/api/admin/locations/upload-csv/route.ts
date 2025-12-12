import { createClient } from '@/lib/supabase/server';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';
import { 
  createLocationUpload, 
  bulkCreateLocations,
  type BulkLocationData,
  type LocationCsvFieldKey
} from '@/lib/supabase/location-uploads';

interface UploadRequest {
  accountId: string;
  listName: string;
  fileName: string;
  columnMapping: Record<string, LocationCsvFieldKey>;
  data: Record<string, string>[];
}

export async function POST(request: Request) {
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

    const body: UploadRequest = await request.json();
    const { accountId, listName, fileName, columnMapping, data } = body;

    if (!accountId || !listName || !fileName || !columnMapping || !data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'No data rows to import' },
        { status: 400 }
      );
    }

    // Check for required name field in mapping
    const hasNameMapping = Object.values(columnMapping).includes('name');
    if (!hasNameMapping) {
      return NextResponse.json(
        { error: 'Column mapping must include the "Location Name" field' },
        { status: 400 }
      );
    }

    // Create the upload record first
    const uploadRecord = await createLocationUpload({
      name: listName,
      file_name: fileName,
      account_id: accountId,
      uploaded_by: user.id,
      location_count: 0, // Will be updated after import
      column_mapping: columnMapping,
    });

    if (!uploadRecord) {
      return NextResponse.json(
        { error: 'Failed to create upload record' },
        { status: 500 }
      );
    }

    // Transform CSV data using column mapping
    const locations: BulkLocationData[] = data.map((row) => {
      const location: BulkLocationData = { name: '' };
      
      for (const [csvColumn, dbField] of Object.entries(columnMapping)) {
        const value = row[csvColumn];
        if (value !== undefined && value !== null && value !== '') {
          (location as any)[dbField] = value;
        }
      }
      
      return location;
    });

    // Bulk create locations
    const result = await bulkCreateLocations(
      accountId,
      locations,
      uploadRecord.id,
      listName
    );

    // Update the upload record with the actual count
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminClient = createAdminClient();
    await (adminClient.from('location_uploads') as any)
      .update({ location_count: result.created.length })
      .eq('id', uploadRecord.id);

    return NextResponse.json({
      success: result.success,
      uploadId: uploadRecord.id,
      created: result.created.length,
      errors: result.errors,
    }, { status: result.created.length > 0 ? 201 : 400 });
  } catch (error: any) {
    console.error('Error processing CSV upload:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

