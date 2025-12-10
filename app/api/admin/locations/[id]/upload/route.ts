import { createClient } from '@/lib/supabase/server';
import { uploadLocationAgreementDocument, updateLocationAgreementDocumentUrl } from '@/lib/supabase/locations';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';

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

    // Validate file type (only PDFs)
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Upload the document
    const documentUrl = await uploadLocationAgreementDocument(file, id, file.name);

    if (!documentUrl) {
      return NextResponse.json(
        { error: 'Failed to upload document' },
        { status: 500 }
      );
    }

    // Update the location with the document URL
    const updated = await updateLocationAgreementDocumentUrl(id, documentUrl);

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update location with document URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ document_url: documentUrl });
  } catch (error: any) {
    console.error('Error uploading location agreement document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

