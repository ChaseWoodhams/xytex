import { createClient } from '@/lib/supabase/server';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';
import { 
  createAccountUpload, 
  bulkCreateAccounts,
  type BulkAccountData,
  type AccountCsvFieldKey
} from '@/lib/supabase/account-uploads';

interface UploadRequest {
  listName: string;
  fileName: string;
  columnMapping: Record<string, AccountCsvFieldKey>;
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
    const { listName, fileName, columnMapping, data } = body;

    if (!listName || !fileName || !columnMapping || !data) {
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
        { error: 'Column mapping must include the "Account/Location Name" field' },
        { status: 400 }
      );
    }

    // Create the upload record first
    const uploadRecord = await createAccountUpload({
      name: listName,
      file_name: fileName,
      uploaded_by: user.id,
      account_count: 0, // Will be updated after import
      column_mapping: columnMapping,
    });

    if (!uploadRecord) {
      return NextResponse.json(
        { error: 'Failed to create upload record' },
        { status: 500 }
      );
    }

    // Transform CSV data using column mapping
    const accounts: BulkAccountData[] = data.map((row) => {
      const account: BulkAccountData = { name: '' };
      
      for (const [csvColumn, dbField] of Object.entries(columnMapping)) {
        const value = row[csvColumn];
        if (value !== undefined && value !== null && value !== '') {
          (account as any)[dbField] = value;
        }
      }
      
      return account;
    });

    console.log(`[upload-csv] Starting bulk create for ${accounts.length} accounts`);

    // Bulk create accounts
    let result;
    try {
      result = await bulkCreateAccounts(
        accounts,
        uploadRecord.id,
        listName,
        user.id
      );
      console.log(`[upload-csv] Bulk create completed: ${result.created.length} created, ${result.errors.length} errors`);
    } catch (bulkError: any) {
      console.error('[upload-csv] Error in bulkCreateAccounts:', bulkError);
      return NextResponse.json(
        { 
          error: bulkError.message || 'Failed to create accounts',
          details: bulkError.stack 
        },
        { status: 500 }
      );
    }

    // Update the upload record with the actual count
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const adminClient = createAdminClient();
      await (adminClient.from('account_uploads') as any)
        .update({ account_count: result.created.length })
        .eq('id', uploadRecord.id);
    } catch (updateError: any) {
      console.error('[upload-csv] Error updating upload record:', updateError);
      // Don't fail the request if update fails
    }

    return NextResponse.json({
      success: result.success,
      uploadId: uploadRecord.id,
      created: result.created.length,
      accountCount: result.accountCount,
      locationCount: result.locationCount,
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

