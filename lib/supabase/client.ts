import { createBrowserClient } from '@supabase/ssr';
import { Database } from './types';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    const error = new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    );
    console.error(error.message);
    throw error;
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid Supabase URL format. Please check NEXT_PUBLIC_SUPABASE_URL in your .env.local file.');
  }

  return createBrowserClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

