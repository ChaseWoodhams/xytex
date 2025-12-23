import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';

export async function GET() {
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

    const adminClient = createAdminClient();

    // Get all multi-location accounts
    const { data: accounts, error } = await adminClient
      .from('accounts')
      .select('id, name, account_type')
      .eq('account_type', 'multi_location')
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('Error fetching multi-location accounts:', error);
      return NextResponse.json(
        { error: `Failed to fetch accounts: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ accounts: accounts || [] });
  } catch (error: any) {
    console.error('Error fetching multi-location accounts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

