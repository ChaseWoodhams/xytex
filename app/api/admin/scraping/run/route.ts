import { createClient } from '@/lib/supabase/server';
import {
  createScrapingJob,
  getDonorIdList,
} from '@/lib/supabase/scraping';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';
import { DonorScraper } from '@/lib/scraping/donor-scraper';

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
    const { donorIds, fullScrape } = body;

    // Get donor IDs to scrape
    let idsToScrape: string[] = [];
    if (fullScrape) {
      console.log('[API] Full scrape requested, fetching active donor IDs...');
      const allDonors = await getDonorIdList(true);
      idsToScrape = allDonors.map((d) => d.donor_id);
      console.log(`[API] Found ${idsToScrape.length} active donor IDs to scrape`);
    } else if (donorIds && Array.isArray(donorIds)) {
      idsToScrape = donorIds;
      console.log(`[API] Scraping ${idsToScrape.length} specified donor IDs`);
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
    console.log(`[API] Creating scraping job for ${idsToScrape.length} donors...`);
    const job = await createScrapingJob(
      fullScrape ? 'full' : 'incremental',
      idsToScrape.length,
      user.id
    );
    console.log(`[API] Job created with ID: ${job.id}`);

    // Start scraping in background (don't await - let it run async)
    console.log(`[API] Starting background scraping job ${job.id}...`);
    const scraper = new DonorScraper();
    scraper.runScrapingJob(idsToScrape, job.id, user.id).catch((error) => {
      console.error(`[API] Error in background scraping job ${job.id}:`, error);
      console.error(`[API] Error stack:`, error.stack);
    });
    console.log(`[API] Background job started, returning job ID to client`);

    return NextResponse.json({
      job_id: job.id,
      status: 'started',
      total_donors: idsToScrape.length,
    });
  } catch (error: any) {
    console.error('Error starting scraping job:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
