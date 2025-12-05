/**
 * Utility to check if Supabase is properly configured
 * This can be used for debugging connection issues
 */
export function checkSupabaseConfig(): {
  isConfigured: boolean;
  hasUrl: boolean;
  hasKey: boolean;
  url?: string;
  errors: string[];
} {
  const errors: string[] = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const hasUrl = !!url;
  const hasKey = !!key;
  const isConfigured = hasUrl && hasKey;

  if (!hasUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is missing');
  } else {
    // Validate URL format
    try {
      const urlObj = new URL(url);
      if (!urlObj.protocol.startsWith('http')) {
        errors.push('NEXT_PUBLIC_SUPABASE_URL must start with http:// or https://');
      }
    } catch {
      errors.push('NEXT_PUBLIC_SUPABASE_URL is not a valid URL');
    }
  }

  if (!hasKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  } else if (key.length < 20) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
  }

  return {
    isConfigured,
    hasUrl,
    hasKey,
    url: hasUrl ? url : undefined,
    errors,
  };
}

