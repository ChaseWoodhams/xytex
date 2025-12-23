import { createClient } from '@/lib/supabase/server';
import { updateAgreement, deleteAgreement, getAgreementById } from '@/lib/supabase/agreements';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';
import { logChange, detectFieldChanges, formatChangedFields } from '@/lib/supabase/change-log';

export async function PATCH(
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
    
    // Get old agreement data to detect changes
    const oldAgreement = await getAgreementById(id);
    
    const agreement = await updateAgreement(id, body);

    if (!agreement) {
      return NextResponse.json(
        { error: 'Failed to update agreement' },
        { status: 500 }
      );
    }

    // Log the change
    const changedFields = detectFieldChanges(oldAgreement, body);
    const fieldsDescription = changedFields.length > 0 
      ? formatChangedFields(changedFields)
      : 'agreement information';
    
    await logChange({
      actionType: 'update_agreement',
      entityType: 'agreement',
      entityId: id,
      entityName: agreement.title,
      description: `Updated ${fieldsDescription} for agreement "${agreement.title}"`,
      details: {
        changedFields,
        agreementId: id,
        agreementTitle: agreement.title,
        agreementType: agreement.agreement_type,
        locationId: agreement.location_id,
      },
    });

    return NextResponse.json(agreement);
  } catch (error: any) {
    console.error('Error updating agreement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get agreement data before deletion for logging
    const agreement = await getAgreementById(id);
    
    const success = await deleteAgreement(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete agreement' },
        { status: 500 }
      );
    }

    // Log the change
    if (agreement) {
      await logChange({
        actionType: 'delete_agreement',
        entityType: 'agreement',
        entityId: id,
        entityName: agreement.title,
        description: `Deleted agreement "${agreement.title}"`,
        details: {
          agreementId: id,
          agreementTitle: agreement.title,
          agreementType: agreement.agreement_type,
          locationId: agreement.location_id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting agreement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

