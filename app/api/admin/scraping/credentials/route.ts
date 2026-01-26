import { createClient } from '@/lib/supabase/server';
import {
  getScrapingCredentials,
  createOrUpdateScrapingCredentials,
  deleteScrapingCredentials,
} from '@/lib/supabase/scraping';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';

export async function GET() {
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

    const credentials = await getScrapingCredentials();

    if (!credentials) {
      return NextResponse.json({ exists: false });
    }

    // Mask the password
    return NextResponse.json({
      exists: true,
      email: credentials.xytex_email,
      last_used_at: credentials.last_used_at,
      is_active: credentials.is_active,
    });
  } catch (error: any) {
    console.error('Error fetching scraping credentials:', error);
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
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const credentials = await createOrUpdateScrapingCredentials(email, password);

    // Return masked response
    return NextResponse.json({
      id: credentials.id,
      email: credentials.xytex_email,
      is_active: credentials.is_active,
    });
  } catch (error: any) {
    console.error('Error saving scraping credentials:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
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

    await deleteScrapingCredentials();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting scraping credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
