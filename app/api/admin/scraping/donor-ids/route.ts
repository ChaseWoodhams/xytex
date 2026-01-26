import { createClient } from '@/lib/supabase/server';
import {
  getDonorIdList,
  addDonorIds,
  updateDonorIdListItem,
  deleteDonorIdListItem,
} from '@/lib/supabase/scraping';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
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
    const activeOnly = searchParams.get('active_only') === 'true';

    const donors = await getDonorIdList(activeOnly);

    return NextResponse.json(donors);
  } catch (error: any) {
    console.error('Error fetching donor ID list:', error);
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
    const { donorIds } = body;

    if (!donorIds || !Array.isArray(donorIds) || donorIds.length === 0) {
      return NextResponse.json(
        { error: 'donorIds array is required' },
        { status: 400 }
      );
    }

    // Clean and validate donor IDs
    const cleanIds = donorIds
      .map((id: any) => String(id).trim())
      .filter((id: string) => id.length > 0);

    if (cleanIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid donor IDs provided' },
        { status: 400 }
      );
    }

    const added = await addDonorIds(cleanIds);

    return NextResponse.json({
      added: added.length,
      total: cleanIds.length,
      skipped: cleanIds.length - added.length,
      items: added,
    });
  } catch (error: any) {
    console.error('Error adding donor IDs:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const updated = await updateDonorIdListItem(id, updates);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating donor ID list item:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id parameter is required' },
        { status: 400 }
      );
    }

    await deleteDonorIdListItem(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting donor ID list item:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
