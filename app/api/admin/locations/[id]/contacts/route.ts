import { createClient } from '@/lib/supabase/server';
import { getLocationContacts, createLocationContact } from '@/lib/supabase/location-contacts';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/locations/[id]/contacts
 * Get all contacts for a location
 */
export async function GET(
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

    const contacts = await getLocationContacts(id);
    return NextResponse.json(contacts);
  } catch (error: any) {
    console.error('Error fetching location contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/locations/[id]/contacts
 * Create a new contact for a location
 */
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
    const contact = await createLocationContact({
      ...body,
      location_id: id,
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Failed to create contact' },
        { status: 500 }
      );
    }

    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    console.error('Error creating location contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

