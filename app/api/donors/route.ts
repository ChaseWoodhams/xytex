import { getAllDonors, getFeaturedDonors } from '@/lib/supabase/donors';
import { NextResponse } from 'next/server';

// Revalidate every hour (3600 seconds)
export const revalidate = 3600;

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

    const response = NextResponse.json({ donors });
    
    // Add caching headers
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );

    return response;
  } catch (error) {
    console.error('Error fetching donors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donors' },
      { status: 500 }
    );
  }
}

