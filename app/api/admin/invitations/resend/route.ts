import { createClient } from '@/lib/supabase/server';
import { getInvitationByToken, getAllInvitations } from '@/lib/supabase/invitations';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { sendInvitationEmail } from '@/lib/email/resend';
import { NextResponse } from 'next/server';

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
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    // Get all invitations and find the one we need
    const invitations = await getAllInvitations();
    const invitation = invitations.find(inv => inv.id === invitationId);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot resend invitation - status is ${invitation.status}` },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Generate the invitation link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/invite/accept?token=${invitation.token}`;

    // Resend the invitation email
    try {
      await sendInvitationEmail({
        email: invitation.email,
        inviteLink,
        role: invitation.role,
        invitedByName: userProfile?.full_name || undefined,
        expiresAt: invitation.expires_at,
      });
      
      console.log(`Invitation email resent to ${invitation.email}`);
      
      return NextResponse.json({
        success: true,
        message: `Invitation email resent to ${invitation.email}`,
      });
    } catch (err: any) {
      console.error('Failed to resend invitation email:', err);
      return NextResponse.json(
        { error: err.message || 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error resending invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

