import { createClient } from '@/lib/supabase/server';
import { acceptInvitation, getInvitationByToken } from '@/lib/supabase/invitations';
import { createUserProfile } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, fullName } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Get invitation
    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or expired' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation has already been ${invitation.status}` },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Create user account with Supabase Auth
    const supabase = await createClient();
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/accounts`,
      },
    });

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create user profile with the role from invitation
    const userProfile = await createUserProfile(
      authData.user.id,
      invitation.email,
      fullName || null,
      null,
      invitation.role
    );

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // Mark invitation as accepted
    await acceptInvitation(token);

    return NextResponse.json({
      success: true,
      user: userProfile,
      session: authData.session,
    });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or expired' },
        { status: 404 }
      );
    }

    // Don't return sensitive information
    return NextResponse.json({
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expires_at: invitation.expires_at,
    });
  } catch (error: any) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

