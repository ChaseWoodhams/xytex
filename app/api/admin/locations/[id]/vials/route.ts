import { createClient } from '@/lib/supabase/server';
import { addVialsToLocation, getLocationVialSales, getLocationById } from '@/lib/supabase/locations';
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

    const body = await request.json();
    const { vials, notes } = body;

    // Validate input
    if (!vials || typeof vials !== 'number' || vials < 1) {
      return NextResponse.json(
        { error: 'Invalid vials count. Must be a positive number.' },
        { status: 400 }
      );
    }

    // Get location for logging
    const location = await getLocationById(id);
    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Add vials to location
    const result = await addVialsToLocation(id, vials, user.id, notes);

    if (!result.success || !result.data) {
      console.error('Failed to add vials:', {
        locationId: id,
        vials,
        notes,
        locationName: location.name,
        userId: user.id,
        error: result.error,
      });
      return NextResponse.json(
        { error: result.error || 'Failed to add vials to location. Check server logs for details.' },
        { status: 500 }
      );
    }

    // Log the change
    await logChange({
      actionType: 'add_vials',
      entityType: 'location',
      entityId: id,
      entityName: location.name || 'Unknown Location',
      description: `Added ${vials} vial${vials !== 1 ? 's' : ''} to location "${location.name || 'Unknown'}"`,
      details: {
        locationId: id,
        locationName: location.name,
        vialsAdded: vials,
        notes: notes || null,
        previousTotal: location.total_vials_sold || 0,
        newTotal: (location.total_vials_sold || 0) + vials,
      },
    });

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Error adding vials to location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const sales = await getLocationVialSales(id);

    return NextResponse.json(sales);
  } catch (error: any) {
    console.error('Error fetching location vial sales:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
