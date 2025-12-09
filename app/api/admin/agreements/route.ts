import { createClient } from '@/lib/supabase/server';
import { createAgreement } from '@/lib/supabase/agreements';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
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
    
    // Validate that location_id is provided - agreements must be tied to locations only
    if (!body.location_id) {
      return NextResponse.json(
        { error: 'location_id is required. Agreements can only be created for locations, not accounts.' },
        { status: 400 }
      );
    }

    const agreementData = {
      ...body,
      created_by: user.id,
    };

    const agreement = await createAgreement(agreementData);

    if (!agreement) {
      return NextResponse.json(
        { error: 'Failed to create agreement' },
        { status: 500 }
      );
    }

    return NextResponse.json(agreement, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating agreement:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

