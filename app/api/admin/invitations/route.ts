import { createClient } from '@/lib/supabase/server';
import { createInvitation, getAllInvitations, cancelInvitation } from '@/lib/supabase/invitations';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';
import type { UserRole } from '@/lib/supabase/types';

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

    const invitations = await getAllInvitations();
    return NextResponse.json(invitations);
  } catch (error: any) {
    console.error('Error fetching invitations:', error);
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
    const { email, role = 'bd_team' as UserRole, expiresInDays = 7 } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['customer', 'bd_team', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const invitation = await createInvitation(email, role, user.id, expiresInDays);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // TODO: Send invitation email here
    // For now, we'll return the invitation with the token
    // In production, you'd send an email with the invitation link

    return NextResponse.json(invitation, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invitation:', error);
    
    // Handle specific error messages
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

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
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    const success = await cancelInvitation(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cancel invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

