import { createClient } from '@/lib/supabase/server';
import { getScrapingResults } from '@/lib/supabase/scraping';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';
import type { ScrapingStatus } from '@/lib/supabase/types';

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
    
    const filters: {
      donorId?: string;
      status?: ScrapingStatus;
      jobId?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    } = {};

    const donorId = searchParams.get('donor_id');
    if (donorId) {
      filters.donorId = donorId;
    }

    const status = searchParams.get('status') as ScrapingStatus | null;
    if (status) {
      filters.status = status;
    }

    const jobId = searchParams.get('job_id');
    if (jobId) {
      filters.jobId = jobId;
    }

    const dateFrom = searchParams.get('date_from');
    if (dateFrom) {
      filters.dateFrom = dateFrom;
    }

    const dateTo = searchParams.get('date_to');
    if (dateTo) {
      filters.dateTo = dateTo;
    }

    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const offset = (page - 1) * pageSize;

    const result = await getScrapingResults(filters, pageSize, offset);

    return NextResponse.json({
      data: result.data,
      count: result.count,
      page,
      pageSize,
      totalPages: Math.ceil(result.count / pageSize),
    });
  } catch (error: any) {
    console.error('Error fetching scraping results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
