import { createClient } from '@/lib/supabase/server';
import { uploadLocationLicenseDocument, updateLocationLicenseDocumentUrl } from '@/lib/supabase/locations';
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
    const uploadResult = await uploadLocationLicenseDocument(file, id, file.name);

    if ('error' in uploadResult) {
      return NextResponse.json(
        { error: uploadResult.error },
        { status: 500 }
      );
    }

    const documentUrl = uploadResult.url;

    // Update the location with the document URL
    const updateResult = await updateLocationLicenseDocumentUrl(id, documentUrl);

    if (!updateResult.success) {
      console.error('Failed to update location license document URL:', updateResult.error);
      return NextResponse.json(
        { error: updateResult.error || 'Document uploaded but failed to update location record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      document_url: documentUrl
    });
  } catch (error: any) {
    console.error('Error uploading location license document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

