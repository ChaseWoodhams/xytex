import { createClient } from '@/lib/supabase/server';
import { updateLocationContact, deleteLocationContact } from '@/lib/supabase/location-contacts';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';

/**
 * PATCH /api/admin/locations/[id]/contacts/[contactId]
 * Update a location contact
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { contactId } = await params;
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
    const contact = await updateLocationContact(contactId, body);

    if (!contact) {
      return NextResponse.json(
        { error: 'Failed to update contact' },
        { status: 500 }
      );
    }

    return NextResponse.json(contact);
  } catch (error: any) {
    console.error('Error updating location contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/locations/[id]/contacts/[contactId]
 * Delete a location contact
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { contactId } = await params;
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

    const success = await deleteLocationContact(contactId);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete contact' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting location contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

