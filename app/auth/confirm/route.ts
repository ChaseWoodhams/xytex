import { type EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const supabase = await createClient();

    const { error, data } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error && data.user) {
      // Check user role to determine redirect
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      // Redirect admin and bd_team users to CRM, respect 'next' param for others
      let redirectPath = next;
      const role = (userProfile as { role?: string } | null)?.role;
      if (role && (role === 'admin' || role === 'bd_team')) {
        redirectPath = '/admin';
      } else if (next === '/' || next === '/account') {
        redirectPath = '/browse-donors';
      }

      const redirectUrl = new URL(redirectPath, request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirect to an error page if verification fails
  const errorUrl = new URL('/auth/error', request.url);
  errorUrl.searchParams.set('error', 'verification_failed');
  return NextResponse.redirect(errorUrl);
}

