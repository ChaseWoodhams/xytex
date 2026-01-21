import { createAdminClient } from './admin';
import type {
  CarePackageRequest,
  CarePackageShipment,
  CarePackageStatus,
} from './types';

export interface NewCarePackageShipmentInput {
  account_id?: string | null;
  location_id?: string | null;
  label?: string | null;
  recipient_name?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  quantity?: number;
}

export interface CreateCarePackageRequestInput {
  account_id?: string | null;
  location_id?: string | null;
  requested_by: string;
  notes?: string | null;
  priority?: string | null;
  shipments: NewCarePackageShipmentInput[];
}

export interface CarePackageRequestWithShipments extends CarePackageRequest {
  shipments: CarePackageShipment[];
}

export interface ClinicToolsCarePackageFilters {
  account_id?: string;
  location_id?: string;
  limit?: number;
}

export interface MarketingShipmentsFilters {
  status?: CarePackageStatus | 'all';
  account_id?: string;
  location_id?: string;
  requested_from?: string; // ISO date
  requested_to?: string; // ISO date
}

export async function createCarePackageRequest(
  input: CreateCarePackageRequestInput
): Promise<CarePackageRequestWithShipments> {
  const supabase = createAdminClient();

  if (!input.shipments || input.shipments.length === 0) {
    throw new Error('At least one shipment is required');
  }

  // Insert request
  const { data: request, error: requestError } = await supabase
    .from('care_package_requests')
    .insert({
      account_id: input.account_id ?? null,
      location_id: input.location_id ?? null,
      requested_by: input.requested_by,
      notes: input.notes ?? null,
      priority: input.priority ?? null,
    })
    .select('*')
    .single();

  if (requestError || !request) {
    console.error('[createCarePackageRequest] Error inserting request', requestError);
    throw new Error(requestError?.message || 'Failed to create care package request');
  }

  // Insert shipments
  const shipmentsToInsert = input.shipments.map((s) => ({
    request_id: request.id,
    account_id: s.account_id ?? input.account_id ?? null,
    location_id: s.location_id ?? input.location_id ?? null,
    label: s.label ?? null,
    recipient_name: s.recipient_name ?? null,
    address_line1: s.address_line1 ?? null,
    address_line2: s.address_line2 ?? null,
    city: s.city ?? null,
    state: s.state ?? null,
    zip_code: s.zip_code ?? null,
    country: s.country ?? null,
    quantity: s.quantity ?? 1,
    status: 'requested' as CarePackageStatus,
    sent_at: null,
    materials_cost: null,
    shipping_cost: null,
    total_cost: null,
  }));

  const { data: shipments, error: shipmentsError } = await supabase
    .from('care_package_shipments')
    .insert(shipmentsToInsert)
    .select('*');

  if (shipmentsError || !shipments) {
    console.error('[createCarePackageRequest] Error inserting shipments', shipmentsError);
    throw new Error(shipmentsError?.message || 'Failed to create care package shipments');
  }

  return {
    ...(request as CarePackageRequest),
    shipments: shipments as CarePackageShipment[],
  };
}

export async function listCarePackageRequestsForClinicTools(
  filters: ClinicToolsCarePackageFilters = {}
): Promise<CarePackageRequestWithShipments[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from('care_package_requests')
    .select('*, care_package_shipments(*)')
    .order('requested_at', { ascending: false });

  if (filters.account_id) {
    query = query.eq('account_id', filters.account_id);
  }
  if (filters.location_id) {
    query = query.eq('location_id', filters.location_id);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  } else {
    query = query.limit(50);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[listCarePackageRequestsForClinicTools] Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(
      error.message || 
      error.details || 
      `Failed to load care package requests: ${error.code || 'Unknown error'}`
    );
  }

  const requests = (data || []) as (CarePackageRequest & {
    care_package_shipments: CarePackageShipment[];
  })[];

  return requests.map((r) => ({
    ...r,
    shipments: r.care_package_shipments || [],
  }));
}

export interface MarketingShipmentRow extends CarePackageShipment {
  account_name: string | null;
  location_name: string | null;
  requested_at: string;
  requested_by_name: string | null;
}

export async function listCarePackageShipmentsForMarketing(
  filters: MarketingShipmentsFilters = {}
): Promise<MarketingShipmentRow[]> {
  const supabase = createAdminClient();

  // Base query joining accounts, locations, and requests
  let query = supabase
    .from('care_package_shipments')
    .select(
      `
        *,
        care_package_requests(
          requested_at,
          requested_by
        ),
        accounts(name),
        locations(name),
        users:care_package_requests!inner.requested_by(full_name)
      `
    )
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.account_id) {
    query = query.eq('account_id', filters.account_id);
  }
  if (filters.location_id) {
    query = query.eq('location_id', filters.location_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[listCarePackageShipmentsForMarketing] Error', error);
    throw new Error(error.message || 'Failed to load care package shipments');
  }

  // Note: due to Supabase typing limitations with nested selects, treat as any
  return (data || []).map((row: any) => {
    const request = row.care_package_requests?.[0] || row.care_package_requests;
    const account = row.accounts?.[0] || row.accounts;
    const location = row.locations?.[0] || row.locations;
    const user = row.users?.[0] || row.users;

    const materials = typeof row.materials_cost === 'number' ? row.materials_cost : Number(row.materials_cost ?? 0);
    const shipping = typeof row.shipping_cost === 'number' ? row.shipping_cost : Number(row.shipping_cost ?? 0);

    const total = materials + shipping;

    return {
      ...(row as CarePackageShipment),
      account_name: account?.name ?? null,
      location_name: location?.name ?? null,
      requested_at: request?.requested_at ?? row.created_at,
      requested_by_name: user?.full_name ?? null,
      materials_cost: materials,
      shipping_cost: shipping,
      total_cost: total,
    } as MarketingShipmentRow;
  });
}

export async function updateCarePackageShipment(
  id: string,
  updates: Partial<
    Pick<
      CarePackageShipment,
      'status' | 'sent_at' | 'materials_cost' | 'shipping_cost' | 'total_cost'
    >
  >
): Promise<CarePackageShipment | null> {
  const supabase = createAdminClient();

  const materials = updates.materials_cost ?? undefined;
  const shipping = updates.shipping_cost ?? undefined;

  const total =
    typeof materials === 'number' || typeof shipping === 'number'
      ? (materials ?? 0) + (shipping ?? 0)
      : updates.total_cost;

  const { data, error } = await supabase
    .from('care_package_shipments')
    .update({
      status: updates.status,
      sent_at: updates.sent_at,
      materials_cost: updates.materials_cost,
      shipping_cost: updates.shipping_cost,
      total_cost: total ?? null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('[updateCarePackageShipment] Error', error);
    return null;
  }

  return data as CarePackageShipment;
}

