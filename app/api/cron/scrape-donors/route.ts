import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DonorScraper } from '@/lib/scraping/donor-scraper';
import type { DonorIdListItem } from '@/lib/supabase/types';

export async function GET(request: NextRequest) {
  return handleCronRequest(request);
}

export async function POST(request: NextRequest) {
  return handleCronRequest(request);
}

async function handleCronRequest(request: NextRequest) {
  try {
    // Verify cron secret (Vercel Cron sends this header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Check Vercel Cron header or custom auth
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isVercelCron && !hasValidSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use admin client for all operations
    const supabase = createAdminClient();
    
    // Find an admin user to associate with the job
    const { data: adminUsers, error: adminUsersError } = await supabase
      .from('users')
      .select('id')
      .or('role.eq.admin,role.eq.bd_team')
      .limit(1);

    if (adminUsersError || !adminUsers || adminUsers.length === 0) {
      return NextResponse.json(
        { error: 'No admin user found for job creation' },
        { status: 500 }
      );
    }

    // Type assertion needed due to Supabase TypeScript inference issue
    const adminUser = (adminUsers as Array<{ id: string }>)[0];
    if (!adminUser || !adminUser.id) {
      return NextResponse.json(
        { error: 'No admin user found for job creation' },
        { status: 500 }
      );
    }

    const adminUserId = adminUser.id;

    // Get all active donor IDs using admin client
    const { data: allDonors, error: donorsError } = await supabase
      .from('donor_id_list')
      .select('*')
      .eq('is_active', true);

    if (donorsError) {
      throw donorsError;
    }

    const donorIds = (allDonors || []).map((d: DonorIdListItem) => d.donor_id);

    if (donorIds.length === 0) {
      return NextResponse.json({
        message: 'No active donor IDs to scrape',
        donor_count: 0,
      });
    }

    // Create scraping job using admin client
    const { data: job, error: jobError } = await (supabase
      .from('scraping_jobs') as any)
      .insert({
        job_type: 'full',
        status: 'pending',
        total_donors: donorIds.length,
        processed_count: 0,
        success_count: 0,
        failed_count: 0,
        created_by: adminUserId,
      })
      .select()
      .single();

    if (jobError || !job) {
      throw jobError || new Error('Failed to create scraping job');
    }

    // Start scraping in background
    // Note: The scraper will need to use admin client for database operations
    const scraper = new DonorScraper();
    scraper.runScrapingJob(donorIds, job.id, adminUserId).catch((error) => {
      console.error('Error in cron scraping job:', error);
    });

    return NextResponse.json({
      message: 'Scraping job started',
      job_id: job.id,
      donor_count: donorIds.length,
      started_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in cron scrape-donors:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
