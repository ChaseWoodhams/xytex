import { createClient } from '@/lib/supabase/server';
import { uploadLocationAgreementDocument, updateLocationAgreementDocumentUrl, getLocationById } from '@/lib/supabase/locations';
import { createAgreement } from '@/lib/supabase/agreements';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { extractPdfMetadata } from '@/lib/utils/pdf-extract';
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

    // Extract metadata from PDF before uploading
    let extractedMetadata;
    try {
      console.log('Starting PDF metadata extraction for file:', file.name);
      extractedMetadata = await extractPdfMetadata(file);
      console.log('Extracted PDF metadata:', JSON.stringify(extractedMetadata, null, 2));
    } catch (extractError: any) {
      console.error('Failed to extract PDF metadata:', {
        error: extractError.message,
        stack: extractError.stack,
        fileName: file.name
      });
      extractedMetadata = {};
    }

    // Upload the document
    const uploadResult = await uploadLocationAgreementDocument(file, id, file.name);

    if ('error' in uploadResult) {
      return NextResponse.json(
        { error: uploadResult.error },
        { status: 500 }
      );
    }

    const documentUrl = uploadResult.url;

    // Get location to get account_id
    const location = await getLocationById(id);
    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Create an agreement record for this uploaded document
    // Use extracted metadata where available, fallback to defaults
    const agreementData = {
      account_id: location.account_id,
      location_id: id,
      agreement_type: 'other' as const,
      title: extractedMetadata.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Location Agreement Document',
      start_date: null,
      end_date: null,
      terms: null,
      revenue_share_percentage: null,
      monthly_fee: null,
      status: 'active' as const,
      document_url: documentUrl,
      notes: `Uploaded agreement document: ${file.name}`,
      signed_date: extractedMetadata.signedDate || null,
      signer_name: extractedMetadata.signerName || null,
      signer_email: extractedMetadata.signerEmail || null,
      created_by: user.id,
    };

    console.log('Creating agreement with data:', {
      account_id: agreementData.account_id,
      location_id: agreementData.location_id,
      title: agreementData.title,
      signed_date: agreementData.signed_date,
      signer_name: agreementData.signer_name,
      signer_email: agreementData.signer_email,
      created_by: agreementData.created_by
    });

    let agreement;
    try {
      agreement = await createAgreement(agreementData);
    } catch (agreementError: any) {
      console.error('Error creating agreement:', {
        error: agreementError.message,
        stack: agreementError.stack,
        agreementData
      });
      // If agreement creation fails, still update the location with the document URL
      // so the document isn't lost
      await updateLocationAgreementDocumentUrl(id, documentUrl);
      return NextResponse.json(
        { error: `Document uploaded but failed to create agreement record: ${agreementError.message}`, document_url: documentUrl },
        { status: 500 }
      );
    }

    if (!agreement) {
      console.error('Agreement creation returned null');
      await updateLocationAgreementDocumentUrl(id, documentUrl);
      return NextResponse.json(
        { error: 'Document uploaded but failed to create agreement record', document_url: documentUrl },
        { status: 500 }
      );
    }

    console.log('Agreement created successfully:', agreement.id);

    // Also update the location with the document URL for backward compatibility
    await updateLocationAgreementDocumentUrl(id, documentUrl);

    return NextResponse.json({ 
      document_url: documentUrl,
      agreement_id: agreement.id,
      extracted_metadata: extractedMetadata // Include for debugging
    });
  } catch (error: any) {
    console.error('Error uploading location agreement document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

