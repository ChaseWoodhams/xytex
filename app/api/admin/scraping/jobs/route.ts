import { createClient } from '@/lib/supabase/server';
import {
  getScrapingJobs,
  createScrapingJob,
} from '@/lib/supabase/scraping';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';
import { DonorScraper } from '@/lib/scraping/donor-scraper';
import { getDonorIdList } from '@/lib/supabase/scraping';

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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const offset = (page - 1) * pageSize;

    const result = await getScrapingJobs(pageSize, offset);

    return NextResponse.json({
      data: result.data,
      count: result.count,
      page,
      pageSize,
      totalPages: Math.ceil(result.count / pageSize),
    });
  } catch (error: any) {
    console.error('Error fetching scraping jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const { jobType, donorIds, fullScrape } = body;

    // Get donor IDs to scrape
    let idsToScrape: string[] = [];
    if (fullScrape) {
      const allDonors = await getDonorIdList(true);
      idsToScrape = allDonors.map((d) => d.donor_id);
    } else if (donorIds && Array.isArray(donorIds)) {
      idsToScrape = donorIds;
    } else {
      return NextResponse.json(
        { error: 'Either fullScrape must be true or donorIds array must be provided' },
        { status: 400 }
      );
    }

    if (idsToScrape.length === 0) {
      return NextResponse.json(
        { error: 'No donor IDs to scrape' },
        { status: 400 }
      );
    }

    // Create scraping job
    const job = await createScrapingJob(
      jobType || (fullScrape ? 'full' : 'incremental'),
      idsToScrape.length,
      user.id
    );

    // Start scraping in background (don't await)
    const scraper = new DonorScraper();
    scraper.runScrapingJob(idsToScrape, job.id, user.id).catch((error) => {
      console.error('Error in background scraping job:', error);
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    console.error('Error creating scraping job:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
