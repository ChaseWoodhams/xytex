import { createClient } from '@/lib/supabase/server';
import { updateLocation, deleteLocation, getLocationById } from '@/lib/supabase/locations';
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
    
    // Get old location data to detect changes
    const oldLocation = await getLocationById(id);
    
    const location = await updateLocation(id, body);

    if (!location) {
      return NextResponse.json(
        { error: 'Failed to update location' },
        { status: 500 }
      );
    }

    // Log the change
    const changedFields = detectFieldChanges(oldLocation, body);
    const fieldsDescription = changedFields.length > 0 
      ? formatChangedFields(changedFields)
      : 'location information';
    
    await logChange({
      actionType: 'update_location',
      entityType: 'location',
      entityId: id,
      entityName: location.name || 'Unknown Location',
      description: `Updated ${fieldsDescription} for location "${location.name || 'Unknown'}"`,
      details: {
        changedFields,
        locationId: id,
        locationName: location.name,
        accountId: location.account_id,
      },
    });

    return NextResponse.json(location);
  } catch (error: any) {
    console.error('Error updating location:', error);
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

    // Get location data before deletion for logging
    const location = await getLocationById(id);
    
    const success = await deleteLocation(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete location' },
        { status: 500 }
      );
    }

    // Log the change
    if (location) {
      await logChange({
        actionType: 'delete_location',
        entityType: 'location',
        entityId: id,
        entityName: location.name || 'Unknown Location',
        description: `Deleted location "${location.name || 'Unknown'}"`,
        details: {
          locationId: id,
          locationName: location.name,
          accountId: location.account_id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

