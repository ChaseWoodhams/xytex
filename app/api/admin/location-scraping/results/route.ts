import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/users';
import { canAccessAdmin } from '@/lib/utils/roles';
import {
  getLocationScrapingResults,
  matchResultToLocation,
} from '@/lib/supabase/location-scraping';

export async function GET(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');
    const source = searchParams.get('source');
    const matched = searchParams.get('matched'); // 'true', 'false', or null
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const filters: any = {
      limit,
      offset,
    };

    if (jobId) {
      filters.job_id = jobId;
    }
    if (source) {
      filters.source = source as any;
    }
    if (matched === 'true') {
      filters.matched_location_id = 'any' as any; // Will be handled differently
    } else if (matched === 'false') {
      filters.matched_location_id = null;
    }

    const results = await getLocationScrapingResults(filters);

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error fetching location scraping results:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch results' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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
    const { resultId, locationId, accountId } = body;

    if (!resultId) {
      return NextResponse.json(
        { error: 'Missing required field: resultId' },
        { status: 400 }
      );
    }

    const success = await matchResultToLocation(
      resultId,
      locationId || null,
      accountId || null
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to match result' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error matching location scraping result:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to match result' },
      { status: 500 }
    );
  }
}
