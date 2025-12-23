import { createClient } from '@/lib/supabase/server';
import { uploadAgreementDocument, getAgreementById } from '@/lib/supabase/agreements';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';
import { logChange } from '@/lib/supabase/change-log';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get agreement data for logging
    const agreement = await getAgreementById(id);
    
    const documentUrl = await uploadAgreementDocument(file, id, file.name);

    if (!documentUrl) {
      return NextResponse.json(
        { error: 'Failed to upload document' },
        { status: 500 }
      );
    }

    // Log the change
    if (agreement) {
      await logChange({
        actionType: 'upload_contract',
        entityType: 'agreement',
        entityId: id,
        entityName: agreement.title,
        description: `Uploaded contract document for agreement "${agreement.title}"`,
        details: {
          agreementId: id,
          agreementTitle: agreement.title,
          fileName: file.name,
          fileSize: file.size,
          documentUrl,
        },
      });
    }

    return NextResponse.json({ document_url: documentUrl });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

