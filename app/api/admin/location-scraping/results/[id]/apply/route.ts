import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/users';
import { canAccessAdmin } from '@/lib/utils/roles';
import {
  getLocationScrapingResult,
  applyScrapedDataToLocation,
} from '@/lib/supabase/location-scraping';

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
    const { locationId, fields } = body;

    if (!locationId || !fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { error: 'Missing required fields: locationId and fields' },
        { status: 400 }
      );
    }

    // Verify result exists and is matched to this location
    const result = await getLocationScrapingResult(id);
    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    if (result.matched_location_id !== locationId) {
      return NextResponse.json(
        { error: 'Result is not matched to this location' },
        { status: 400 }
      );
    }

    const success = await applyScrapedDataToLocation(id, locationId, fields);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to apply scraped data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error applying scraped data to location:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to apply data' },
      { status: 500 }
    );
  }
}
