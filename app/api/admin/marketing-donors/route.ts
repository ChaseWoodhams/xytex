import { createClient } from '@/lib/supabase/server';
import {
  getMarketingDonors,
  createMarketingDonor,
  type MarketingDonorFilters,
  type MarketingDonorSortOption,
} from '@/lib/supabase/marketing-donors';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';
import type { MarketingDonor } from '@/lib/supabase/types';

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

    // Build filters
    const filters: MarketingDonorFilters = {};

    const raceParam = searchParams.get('race');
    if (raceParam) {
      filters.race = raceParam.split(',');
    }

    const cmvStatusParam = searchParams.get('cmvStatus');
    if (cmvStatusParam) {
      filters.cmvStatus = cmvStatusParam.split(',');
    }

    const searchParam = searchParams.get('search');
    if (searchParam) {
      filters.search = searchParam;
    }

    const minYearParam = searchParams.get('minYear');
    const maxYearParam = searchParams.get('maxYear');
    if (minYearParam || maxYearParam) {
      filters.yearOfBirth = {};
      if (minYearParam) {
        filters.yearOfBirth.min = parseInt(minYearParam, 10);
      }
      if (maxYearParam) {
        filters.yearOfBirth.max = parseInt(maxYearParam, 10);
      }
    }

    // Build sort options
    const sortField = searchParams.get('sortField') as MarketingDonorSortOption['field'] | null;
    const sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc' | null;
    let sort: MarketingDonorSortOption | undefined;
    if (sortField && sortDirection) {
      sort = { field: sortField, direction: sortDirection };
    }

    // Pagination
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 50;
    const limit = pageSize;
    const offset = (page - 1) * pageSize;

    const result = await getMarketingDonors(filters, sort, limit, offset);

    return NextResponse.json({
      data: result.data,
      count: result.count,
      page,
      pageSize,
      totalPages: Math.ceil(result.count / pageSize),
    });
  } catch (error: any) {
    console.error('Error fetching marketing donors:', error);
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
    const donorData: Omit<MarketingDonor, 'created_at' | 'updated_at'> = {
      ...body,
      created_by: user.id,
    };

    const donor = await createMarketingDonor(donorData);

    return NextResponse.json(donor, { status: 201 });
  } catch (error: any) {
    console.error('Error creating marketing donor:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
