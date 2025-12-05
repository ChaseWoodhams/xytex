import { createClient } from '@/lib/supabase/server';
import { createUserProfile } from '@/lib/supabase/users';
import { startTrial } from '@/lib/supabase/subscriptions';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, email, fullName, phone } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Creating user profile for:', { userId, email });

    // Create user profile
    const userProfile = await createUserProfile(userId, email, fullName, phone);

    if (!userProfile) {
      console.error('Failed to create user profile. Check server logs for details.');
      return NextResponse.json(
        { error: 'Failed to create user profile. Please check server logs.' },
        { status: 500 }
      );
    }

    console.log('User profile created successfully:', userProfile.id);

    // Start the 7-day free trial
    const trialStarted = await startTrial(userId);

    if (!trialStarted) {
      console.error('Failed to start trial for user:', userId);
      // Don't fail the request, user profile was created
    } else {
      console.log('Trial started successfully for user:', userId);
    }

    return NextResponse.json({ success: true, user: userProfile });
  } catch (error: any) {
    console.error('Error in user creation API:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

