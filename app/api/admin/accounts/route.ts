import { createClient } from '@/lib/supabase/server';
import { getCorporateAccounts, createCorporateAccount } from '@/lib/supabase/corporate-accounts';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { AccountStatus } from '@/lib/supabase/types';
import { NextResponse } from 'next/server';

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
    
    // Validate status is a valid AccountStatus
    const statusParam = searchParams.get('status');
    const validStatuses: AccountStatus[] = ['active', 'inactive', 'archived'];
    const status = statusParam && validStatuses.includes(statusParam as AccountStatus) 
      ? (statusParam as AccountStatus) 
      : undefined;
    
    const filters = {
      status,
      industry: searchParams.get('industry') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const accounts = await getCorporateAccounts(filters);
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

    const account = await createCorporateAccount(accountData);

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

