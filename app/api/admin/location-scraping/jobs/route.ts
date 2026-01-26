import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/users';
import { canAccessAdmin } from '@/lib/utils/roles';
import {
  createLocationScrapingJob,
  getLocationScrapingJobs,
} from '@/lib/supabase/location-scraping';
import { LocationScraper } from '@/lib/scraping/location-scraper';
import type { LocationScrapingSource } from '@/lib/supabase/types';

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
    const { query, sources, locationId } = body;

    if (!query || !sources || !Array.isArray(sources) || sources.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: query and sources' },
        { status: 400 }
      );
    }

    // Determine source enum value - use 'all' if multiple sources or 'all' is selected
    const source: LocationScrapingSource = sources.includes('all') || sources.length > 1 
      ? 'all' 
      : (sources[0] as LocationScrapingSource);

    // Create job
    let job;
    try {
      job = await createLocationScrapingJob(query, source, user.id);
    } catch (dbError: any) {
      console.error('Database error creating job:', dbError);
      return NextResponse.json(
        { error: dbError.message || 'Failed to create scraping job. Make sure the database migration has been run.' },
        { status: 500 }
      );
    }

    if (!job) {
      return NextResponse.json(
        { error: 'Failed to create scraping job' },
        { status: 500 }
      );
    }

    // If locationId is provided, we'll auto-match results to this location
    // Store it in the job's search_query metadata or create a separate field
    // For now, we'll pass it to the scraper via a custom field
    const jobWithLocation = locationId ? { ...job, target_location_id: locationId } : job;

    // Start scraping in background (don't await)
    const scraper = new LocationScraper();
    scraper.runScrapingJob(job.id, query, sources, user.id, {}, locationId).catch((error) => {
      console.error('Error running scraping job:', error);
    });

    return NextResponse.json({ jobId: job.id });
  } catch (error: any) {
    console.error('Error creating location scraping job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create scraping job' },
      { status: 500 }
    );
  }
}

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
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const jobs = await getLocationScrapingJobs(limit, offset);

    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error('Error fetching location scraping jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
