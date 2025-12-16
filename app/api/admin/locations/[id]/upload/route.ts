import { createClient } from '@/lib/supabase/server';
import { getLocationById, updateLocationAgreementDocumentUrl } from '@/lib/supabase/locations';
import { createAgreement } from '@/lib/supabase/agreements';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';

// This route now only records metadata for an agreement whose PDF has already
// been uploaded directly from the client to Supabase Storage.
// This keeps the request body small so we don't hit Vercel's 4.5MB limit.
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

    const body = await request.json();
    const { document_url, file_name, signed_date } = body as {
      document_url?: string;
      file_name?: string;
      signed_date?: string | null;
    };

    if (!document_url) {
      return NextResponse.json(
        { error: 'document_url is required' },
        { status: 400 }
      );
    }

    // Get location to get account_id
    const location = await getLocationById(id);
    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    const baseTitle =
      (file_name
        ? file_name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
        : null) || 'Location Agreement Document';

    const agreementData = {
      account_id: location.account_id,
      location_id: id,
      agreement_type: 'other' as const,
      title: baseTitle,
      start_date: null,
      end_date: null,
      terms: null,
      revenue_share_percentage: null,
      monthly_fee: null,
      status: 'active' as const,
      document_url,
      notes: `Uploaded agreement document: ${file_name || 'Unknown filename'}`,
      signed_date: signed_date || null,
      signer_name: null,
      signer_email: null,
      created_by: user.id,
    };

    let agreement;
    try {
      agreement = await createAgreement(agreementData);
    } catch (agreementError: any) {
      console.error('Error creating agreement:', {
        error: agreementError.message,
        stack: agreementError.stack,
        agreementData
      });
      await updateLocationAgreementDocumentUrl(id, document_url);
      return NextResponse.json(
        {
          error: `Document uploaded but failed to create agreement record: ${agreementError.message}`,
          document_url,
        },
        { status: 500 }
      );
    }

    if (!agreement) {
      console.error('Agreement creation returned null');
      await updateLocationAgreementDocumentUrl(id, document_url);
      return NextResponse.json(
        {
          error: 'Document uploaded but failed to create agreement record',
          document_url,
        },
        { status: 500 }
      );
    }

    // Also update the location with the document URL for backward compatibility
    await updateLocationAgreementDocumentUrl(id, document_url);

    return NextResponse.json({
      document_url,
      agreement_id: agreement.id,
    });
  } catch (error: any) {
    console.error('Error recording location agreement metadata:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

