import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

/**
 * Admin client that uses service role key to bypass RLS
 * Use this ONLY in server-side API routes for admin operations
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase admin environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.'
    );
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid Supabase URL format. Please check NEXT_PUBLIC_SUPABASE_URL in your .env.local file.');
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

