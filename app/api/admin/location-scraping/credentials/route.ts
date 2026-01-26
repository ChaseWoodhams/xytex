import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/users';
import { canAccessAdmin } from '@/lib/utils/roles';
import {
  getLocationScrapingCredentials,
  upsertLocationScrapingCredentials,
  deleteLocationScrapingCredentials,
} from '@/lib/supabase/location-scraping';

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
    const service = searchParams.get('service');

    const credentials = await getLocationScrapingCredentials(service || undefined);

    // Mask API keys for security
    const maskedCredentials = credentials.map((cred) => ({
      ...cred,
      api_key: cred.api_key.substring(0, 4) + '***' + cred.api_key.substring(cred.api_key.length - 4),
    }));

    return NextResponse.json({ credentials: maskedCredentials });
  } catch (error: any) {
    console.error('Error fetching location scraping credentials:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch credentials' },
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
    const { service, apiKey } = body;

    if (!service || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: service and apiKey' },
        { status: 400 }
      );
    }

    const credential = await upsertLocationScrapingCredentials(service, apiKey);

    if (!credential) {
      return NextResponse.json(
        { error: 'Failed to save credentials' },
        { status: 500 }
      );
    }

    // Return masked credential
    return NextResponse.json({
      credential: {
        ...credential,
        api_key: credential.api_key.substring(0, 4) + '***' + credential.api_key.substring(credential.api_key.length - 4),
      },
    });
  } catch (error: any) {
    console.error('Error saving location scraping credentials:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save credentials' },
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
    const credentialId = searchParams.get('id');

    if (!credentialId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const success = await deleteLocationScrapingCredentials(credentialId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting location scraping credentials:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete credentials' },
      { status: 500 }
    );
  }
}
