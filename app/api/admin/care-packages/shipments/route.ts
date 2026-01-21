import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/users';
import { canAccessAdmin } from '@/lib/utils/roles';
import {
  listCarePackageShipmentsForMarketing,
  updateCarePackageShipment,
} from '@/lib/supabase/care-packages';
import type { CarePackageStatus } from '@/lib/supabase/types';

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
    const statusParam = searchParams.get('status') as CarePackageStatus | 'all' | null;
    const accountId = searchParams.get('accountId') || undefined;
    const locationId = searchParams.get('locationId') || undefined;

    const validStatuses: CarePackageStatus[] = [
      'requested',
      'in_progress',
      'sent',
      'cancelled',
    ];

    const finalStatus =
      statusParam && (statusParam === 'all' || validStatuses.includes(statusParam))
        ? statusParam
        : 'requested';

    const shipments = await listCarePackageShipmentsForMarketing({
      status: finalStatus,
      account_id: accountId,
      location_id: locationId,
    });

    return NextResponse.json(shipments);
  } catch (error: any) {
    console.error('[care-packages/shipments][GET] Error fetching shipments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch care package shipments' },
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
    const { id, status, sent_at, materials_cost, shipping_cost } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Shipment id is required' },
        { status: 400 }
      );
    }

    const updates: {
      status?: CarePackageStatus;
      sent_at?: string | null;
      materials_cost?: number | null;
      shipping_cost?: number | null;
    } = {};

    if (status) {
      const validStatuses: CarePackageStatus[] = [
        'requested',
        'in_progress',
        'sent',
        'cancelled',
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        );
      }
      updates.status = status;
      updates.sent_at = sent_at ?? null;
    }

    if (materials_cost !== undefined) {
      updates.materials_cost =
        materials_cost === null ? null : Number(materials_cost);
    }
    if (shipping_cost !== undefined) {
      updates.shipping_cost =
        shipping_cost === null ? null : Number(shipping_cost);
    }

    const updated = await updateCarePackageShipment(id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update shipment' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[care-packages/shipments][PATCH] Error updating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to update care package shipment' },
      { status: 500 }
    );
  }
}

