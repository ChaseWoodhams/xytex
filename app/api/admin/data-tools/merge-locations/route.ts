import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';
import { getLocationById } from '@/lib/supabase/locations';
import { logChange } from '@/lib/supabase/change-log';

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
    const { sourceLocationId, targetLocationId } = body;

    if (!sourceLocationId || !targetLocationId) {
      return NextResponse.json(
        { error: 'Source and target location IDs are required' },
        { status: 400 }
      );
    }

    if (sourceLocationId === targetLocationId) {
      return NextResponse.json(
        { error: 'Source and target locations must be different' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Get both locations
    const sourceLocation = await getLocationById(sourceLocationId);
    const targetLocation = await getLocationById(targetLocationId);

    if (!sourceLocation) {
      return NextResponse.json({ error: 'Source location not found' }, { status: 404 });
    }

    if (!targetLocation) {
      return NextResponse.json({ error: 'Target location not found' }, { status: 404 });
    }

    // Merge data: prefer target location's data, but fill in missing fields from source
    const mergedData: any = {
      name: targetLocation.name || sourceLocation.name,
      address_line1: targetLocation.address_line1 || sourceLocation.address_line1,
      address_line2: targetLocation.address_line2 || sourceLocation.address_line2,
      city: targetLocation.city || sourceLocation.city,
      state: targetLocation.state || sourceLocation.state,
      zip_code: targetLocation.zip_code || sourceLocation.zip_code,
      country: targetLocation.country || sourceLocation.country,
      phone: targetLocation.phone || sourceLocation.phone,
      email: targetLocation.email || sourceLocation.email,
      contact_name: targetLocation.contact_name || sourceLocation.contact_name,
      contact_title: targetLocation.contact_title || sourceLocation.contact_title,
      // Merge notes
      notes: [targetLocation.notes, sourceLocation.notes]
        .filter(Boolean)
        .join('\n\n--- Merged from previous location ---\n\n'),
      // Keep target's clinic_code and sage_code (they're more established)
      clinic_code: targetLocation.clinic_code || sourceLocation.clinic_code,
      sage_code: targetLocation.sage_code || sourceLocation.sage_code,
      // Keep target's documents (they're more established)
      agreement_document_url: targetLocation.agreement_document_url || sourceLocation.agreement_document_url,
      license_document_url: targetLocation.license_document_url || sourceLocation.license_document_url,
      // Keep target's pending_contract_sent status
      pending_contract_sent: targetLocation.pending_contract_sent || sourceLocation.pending_contract_sent,
    };

    // Update target location with merged data
    const { error: updateError } = await (adminClient
      .from('locations') as any)
      .update(mergedData)
      .eq('id', targetLocationId);

    if (updateError) {
      console.error('Error updating target location:', updateError);
      return NextResponse.json(
        { error: `Failed to update target location: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Move all related data from source to target location
    // 1. Update agreements
    await adminClient
      .from('agreements')
      .update({ location_id: targetLocationId })
      .eq('location_id', sourceLocationId);

    // 2. Update activities
    await adminClient
      .from('activities')
      .update({ location_id: targetLocationId })
      .eq('location_id', sourceLocationId);

    // 3. Update notes
    await adminClient
      .from('notes')
      .update({ location_id: targetLocationId })
      .eq('location_id', sourceLocationId);

    // 4. Update location contacts
    await adminClient
      .from('location_contacts')
      .update({ location_id: targetLocationId })
      .eq('location_id', sourceLocationId);

    // Delete the source location
    const { error: deleteError } = await adminClient
      .from('locations')
      .delete()
      .eq('id', sourceLocationId);

    if (deleteError) {
      console.error('Error deleting source location:', deleteError);
      // Don't fail the operation - data has been merged
    }

    // If source location's account is now empty or has only one location, handle it
    const { data: remainingLocations } = await adminClient
      .from('locations')
      .select('id')
      .eq('account_id', sourceLocation.account_id);

    if (!remainingLocations || remainingLocations.length === 0) {
      // Delete empty account
      await adminClient
        .from('accounts')
        .delete()
        .eq('id', sourceLocation.account_id);
    } else if (remainingLocations.length === 1) {
      // Convert to single-location account
      await adminClient
        .from('accounts')
        .update({ account_type: 'single_location' })
        .eq('id', sourceLocation.account_id);
    }

    // Log the change
    await logChange({
      actionType: 'merge_locations',
      entityType: 'location',
      entityId: targetLocationId,
      entityName: targetLocation.name || 'Unknown Location',
      description: `Merged location "${sourceLocation.name || 'Unknown'}" into "${targetLocation.name || 'Unknown'}"`,
      details: {
        sourceLocationId: sourceLocationId,
        sourceLocationName: sourceLocation.name,
        targetLocationId: targetLocationId,
        targetLocationName: targetLocation.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Locations merged successfully',
    });
  } catch (error: any) {
    console.error('Error merging locations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to merge locations' },
      { status: 500 }
    );
  }
}

