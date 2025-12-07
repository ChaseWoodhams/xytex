import { getAllDonors, getFeaturedDonors } from '@/lib/supabase/donors';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    let donors;
    if (featured === 'true') {
      donors = await getFeaturedDonors(limit || 4);
    } else {
      donors = await getAllDonors();
    }

    return NextResponse.json({ donors });
  } catch (error) {
    console.error('Error fetching donors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donors' },
      { status: 500 }
    );
  }
}

