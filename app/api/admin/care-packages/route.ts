import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/users';
import { canAccessAdmin } from '@/lib/utils/roles';
import {
  createCarePackageRequest,
  listCarePackageRequestsForClinicTools,
} from '@/lib/supabase/care-packages';

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
    const accountId = searchParams.get('accountId') || undefined;
    const locationId = searchParams.get('locationId') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const requests = await listCarePackageRequestsForClinicTools({
      account_id: accountId,
      location_id: locationId,
      limit,
    });

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error('[care-packages][GET] Error fetching requests:', {
      message: error.message,
      stack: error.stack,
      error,
    });
    return NextResponse.json(
      { error: error.message || 'Failed to fetch care package requests' },
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

    if (!body || !Array.isArray(body.shipments) || body.shipments.length === 0) {
      return NextResponse.json(
        { error: 'At least one shipment is required' },
        { status: 400 }
      );
    }

    const payload = {
      account_id: body.account_id ?? null,
      location_id: body.location_id ?? null,
      requested_by: user.id,
      notes: body.notes ?? null,
      priority: body.priority ?? null,
      shipments: body.shipments,
    };

    const result = await createCarePackageRequest(payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('[care-packages][POST] Error creating request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create care package request' },
      { status: 500 }
    );
  }
}

