import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { getChangeLogs } from '@/lib/supabase/change-log';

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
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;
    const actionType = searchParams.get('action_type') || undefined;
    const entityType = searchParams.get('entity_type') || undefined;
    const entityId = searchParams.get('entity_id') || undefined;

    const changeLogs = await getChangeLogs({
      limit,
      actionType: actionType as any,
      entityType: entityType as any,
      entityId,
    });

    return NextResponse.json({ changeLogs });
  } catch (error: any) {
    console.error('Error fetching change logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch change logs' },
      { status: 500 }
    );
  }
}

