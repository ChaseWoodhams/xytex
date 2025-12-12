import { createClient } from '@/lib/supabase/server';
import { getAccounts, createAccount, getPaginatedAccountsWithMetadata, type AccountFilters } from '@/lib/supabase/accounts';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';
import type { AccountStatus } from '@/lib/supabase/types';

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
    
    // Check if pagination is requested
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const usePagination = pageParam !== null || pageSizeParam !== null;
    
    // Validate and type-check filter values
    const statusParam = searchParams.get('status');
    const validStatuses: AccountStatus[] = ['active', 'inactive', 'archived'];
    
    const filters: AccountFilters = {};
    
    if (statusParam && validStatuses.includes(statusParam as AccountStatus)) {
      filters.status = statusParam as AccountStatus;
    }
    
    const industryParam = searchParams.get('industry');
    if (industryParam) {
      filters.industry = industryParam;
    }
    
    const searchParam = searchParams.get('search');
    if (searchParam) {
      filters.search = searchParam;
    }

    // Contract filter
    const hasContractsParam = searchParams.get('hasContracts');
    if (hasContractsParam !== null) {
      filters.hasContracts = hasContractsParam === 'true';
    }

    // License filter
    const hasLicensesParam = searchParams.get('hasLicenses');
    if (hasLicensesParam !== null) {
      filters.hasLicenses = hasLicensesParam === 'true';
    }

    // Country filter
    const countryParam = searchParams.get('country');
    if (countryParam && ['US', 'CA', 'UK', 'INTL'].includes(countryParam)) {
      filters.country = countryParam as 'US' | 'CA' | 'UK' | 'INTL';
    }

    // Use paginated endpoint if requested
    if (usePagination) {
      const page = pageParam ? parseInt(pageParam, 10) : 1;
      const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 50;
      
      if (isNaN(page) || page < 1) {
        return NextResponse.json({ error: 'Invalid page parameter' }, { status: 400 });
      }
      if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
        return NextResponse.json({ error: 'Invalid pageSize parameter (must be 1-100)' }, { status: 400 });
      }

      const result = await getPaginatedAccountsWithMetadata(page, pageSize, filters);
      return NextResponse.json(result);
    }

    // Fallback to non-paginated endpoint for backward compatibility
    const accounts = await getAccounts(filters);
    return NextResponse.json(accounts);
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
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
    const accountData = {
      ...body,
      created_by: user.id,
    };

    const account = await createAccount(accountData);

    if (!account) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

