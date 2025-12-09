import { createClient } from '@/lib/supabase/server';
import { getAccounts, createAccount } from '@/lib/supabase/accounts';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';
import type { AccountStatus, DealStage } from '@/lib/supabase/types';

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
    
    // Validate and type-check filter values
    const statusParam = searchParams.get('status');
    const dealStageParam = searchParams.get('deal_stage');
    
    const validStatuses: AccountStatus[] = ['active', 'inactive', 'archived'];
    const validDealStages: DealStage[] = ['prospect', 'qualified', 'negotiation', 'closed_won', 'closed_lost'];
    
    const filters: {
      status?: AccountStatus;
      deal_stage?: DealStage;
      industry?: string;
      search?: string;
    } = {};
    
    if (statusParam && validStatuses.includes(statusParam as AccountStatus)) {
      filters.status = statusParam as AccountStatus;
    }
    
    if (dealStageParam && validDealStages.includes(dealStageParam as DealStage)) {
      filters.deal_stage = dealStageParam as DealStage;
    }
    
    const industryParam = searchParams.get('industry');
    if (industryParam) {
      filters.industry = industryParam;
    }
    
    const searchParam = searchParams.get('search');
    if (searchParam) {
      filters.search = searchParam;
    }

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

