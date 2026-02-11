import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessAdmin } from '@/lib/utils/roles';
import { getCurrentUser } from '@/lib/supabase/users';
import { NextResponse } from 'next/server';

// Calculate Levenshtein distance between two strings
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

// Calculate similarity score (0-1, where 1 is identical)
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLength;
}

// Normalize account name for comparison (remove common suffixes, trim, lowercase)
function normalizeName(name: string): string {
  // Common words/phrases that appear in many account names but don't help distinguish them
  // Order matters: longer phrases first to avoid partial matches
  const commonPhrases = [
    'fertility center',
    'fertility clinic',
    'fertility care',
    'reproductive health',
    'reproductive medicine',
    'reproductive center',
    "women's center",
    "women's",
    'for women',
    'medical group',
    'associates',
    'fertility',
    'medical',
    'group',
    'ob/gyn',
    'obgyn',
    'm.d.',
    'md',
  ];
  
  let normalized = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    // Normalize apostrophes and special characters
    .replace(/['']/g, "'")
    // Remove common business suffixes
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b\.?/gi, '')
    .trim();
  
  // Remove common industry words/phrases that don't help distinguish accounts
  // Process longer phrases first to avoid partial matches
  for (const phrase of commonPhrases) {
    // Escape special regex characters and match as whole word/phrase
    const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match word boundaries around the phrase, handling spaces within phrases
    const pattern = phrase.includes(' ') 
      ? new RegExp(`\\b${escapedPhrase}\\b`, 'gi')
      : new RegExp(`\\b${escapedPhrase}\\b`, 'gi');
    normalized = normalized.replace(pattern, '');
  }
  
  // Clean up any extra spaces left after removals
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

// Normalize address for comparison — strip case, whitespace, common abbreviations
function normalizeAddress(parts: { city?: string | null; state?: string | null; zip?: string | null; address?: string | null }): string {
  const segments: string[] = [];
  if (parts.address) {
    segments.push(
      parts.address
        .toLowerCase()
        .replace(/\bsuite\b/g, 'ste')
        .replace(/\bstreet\b/g, 'st')
        .replace(/\bavenue\b/g, 'ave')
        .replace(/\bdrive\b/g, 'dr')
        .replace(/\bboulevard\b/g, 'blvd')
        .replace(/\broad\b/g, 'rd')
        .replace(/[.,#]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    );
  }
  if (parts.city) segments.push(parts.city.toLowerCase().trim());
  if (parts.state) segments.push(parts.state.toLowerCase().trim());
  if (parts.zip) {
    // Use first 5 digits of zip for comparison
    const zip5 = parts.zip.replace(/[^0-9]/g, '').slice(0, 5);
    if (zip5) segments.push(zip5);
  }
  return segments.join('|');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get('mode') || 'name') as 'name' | 'address' | 'both';

    // Check auth with regular client
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

    // Use admin client for queries to bypass RLS
    const adminClient = createAdminClient();

    // Get all single-location accounts (include address fields from account for fallback)
    const { data: accounts, error: accountsError } = await adminClient
      .from('accounts')
      .select('id, name, account_type, primary_contact_email, primary_contact_name, sage_code, udf_address_line1, udf_address_line2, udf_city, udf_state, udf_zipcode, udf_clinic_name')
      .eq('account_type', 'single_location')
      .eq('status', 'active')
      .order('name');

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return NextResponse.json(
        { error: `Failed to fetch accounts: ${accountsError.message}` },
        { status: 400 }
      );
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    // Type assertion for accounts
    type AccountRow = {
      id: string;
      name: string;
      account_type: string;
      primary_contact_email: string | null;
      primary_contact_name: string | null;
      sage_code: string | null;
      udf_address_line1: string | null;
      udf_address_line2: string | null;
      udf_city: string | null;
      udf_state: string | null;
      udf_zipcode: string | null;
      udf_clinic_name: string | null;
    };
    const accountsData = accounts as AccountRow[];

    // Get locations for these accounts
    const accountIds = accountsData.map(acc => acc.id);
    
    let locations: any[] = [];
    if (accountIds.length > 0) {
      // Supabase .in() has a limit, so we'll fetch in batches if needed
      const batchSize = 100;
      const locationPromises: Promise<any[]>[] = [];
      
      for (let i = 0; i < accountIds.length; i += batchSize) {
        const batch = accountIds.slice(i, i + batchSize);
        locationPromises.push(
          (async () => {
            const { data, error } = await adminClient
              .from('locations')
              .select('id, account_id, name, address_line1, address_line2, city, state, zip_code')
              .in('account_id', batch);
            
            if (error) {
              console.error(`Error fetching locations batch ${i / batchSize + 1}:`, error);
              throw error;
            }
            return data || [];
          })()
        );
      }
      
      try {
        const locationBatches = await Promise.all(locationPromises);
        locations = locationBatches.flat();
        console.log(`Fetched ${locations.length} total locations for ${accountIds.length} accounts`);
      } catch (locationsError: any) {
        console.error('Error fetching locations:', locationsError);
        // Don't fail the entire request if locations fail - just log and continue with empty locations
        locations = [];
      }
    }

    // Create a map of account_id to locations (all locations for each account)
    const locationMap = new Map<string, (typeof locations)[0][]>();
    locations.forEach(loc => {
      if (!locationMap.has(loc.account_id)) {
        locationMap.set(loc.account_id, []);
      }
      locationMap.get(loc.account_id)!.push(loc);
    });

    // Log which accounts have locations and which don't
    const accountsWithoutLocations: string[] = [];
    const accountsWithLocationsList: Array<{ id: string; name: string; count: number }> = [];

    // Enrich accounts with location data (all locations, or fallback to account udf fields)
    const accountsWithLocations = accountsData.map(acc => {
      const accountLocations = locationMap.get(acc.id) || [];
      
      // If no locations found in locations table, use account's udf address fields as fallback
      let locations = accountLocations.map(loc => ({
        name: loc.name || null,
        address_line1: loc.address_line1 || null,
        address_line2: loc.address_line2 || null,
        city: loc.city || null,
        state: loc.state || null,
        zip_code: loc.zip_code || null,
      }));
      
      // Fallback: if no locations in locations table, create one from account's udf fields
      if (locations.length === 0) {
        const hasAddressData = acc.udf_address_line1 || acc.udf_city || acc.udf_state || acc.udf_zipcode;
        if (hasAddressData) {
          locations = [{
            name: acc.udf_clinic_name || acc.name || null,
            address_line1: acc.udf_address_line1 || null,
            address_line2: acc.udf_address_line2 || null,
            city: acc.udf_city || null,
            state: acc.udf_state || null,
            zip_code: acc.udf_zipcode || null,
          }];
          accountsWithLocationsList.push({ id: acc.id, name: acc.name, count: 1 });
        } else {
          accountsWithoutLocations.push(`${acc.name} (${acc.id})`);
        }
      } else {
        accountsWithLocationsList.push({ id: acc.id, name: acc.name, count: accountLocations.length });
      }
      
      const enrichedAccount = {
        ...acc,
        locations,
      };
      return enrichedAccount;
    });

    // Log summary
    console.log(`Location fetch summary: ${accountsWithLocationsList.length} accounts with locations, ${accountsWithoutLocations.length} accounts without locations`);
    if (accountsWithoutLocations.length > 0 && accountsWithoutLocations.length <= 10) {
      console.log('Accounts without locations:', accountsWithoutLocations);
    }

    // Group similar accounts
    const SIMILARITY_THRESHOLD = 0.7; // 70% similarity
    const groups: Array<{
      name: string;
      accounts: typeof accountsWithLocations;
      similarityScore: number;
      matchType?: 'name' | 'address';
    }> = [];
    const processed = new Set<string>();

    // --- Name-based grouping ---
    if (mode === 'name' || mode === 'both') {
      for (let i = 0; i < accountsWithLocations.length; i++) {
        if (processed.has(accountsWithLocations[i].id)) continue;

        const account1 = accountsWithLocations[i];
        const normalizedName1 = normalizeName(account1.name);
        const group: typeof accountsWithLocations = [account1];
        let minSimilarity = 1;

        for (let j = i + 1; j < accountsWithLocations.length; j++) {
          if (processed.has(accountsWithLocations[j].id)) continue;

          const account2 = accountsWithLocations[j];
          const normalizedName2 = normalizeName(account2.name);
          
          let similarity: number;
          if (normalizedName1 === normalizedName2 && normalizedName1.length > 0) {
            similarity = 1.0;
          } else {
            similarity = calculateSimilarity(normalizedName1, normalizedName2);
            if (similarity >= 0.999) {
              similarity = 0.99;
            }
          }

          if (similarity >= SIMILARITY_THRESHOLD) {
            group.push(account2);
            processed.add(account2.id);
            minSimilarity = Math.min(minSimilarity, similarity);
          }
        }

        if (group.length >= 2) {
          processed.add(account1.id);
          groups.push({
            name: account1.name,
            accounts: group,
            similarityScore: minSimilarity,
            matchType: 'name',
          });
        }
      }
    }

    // --- Address-based clustering ---
    if (mode === 'address' || mode === 'both') {
      // Build a map of normalized address -> accounts (only unprocessed accounts)
      const addressMap = new Map<string, typeof accountsWithLocations>();

      for (const acc of accountsWithLocations) {
        if (processed.has(acc.id)) continue;
        // Use the first location's address for clustering
        const loc = acc.locations[0];
        if (!loc) continue;

        const key = normalizeAddress({
          city: loc.city,
          state: loc.state,
          zip: loc.zip_code,
          address: loc.address_line1,
        });

        // Only cluster if we have at least city+state or zip
        if (!key || key === '|' || key.replace(/\|/g, '').length < 3) continue;

        const existing = addressMap.get(key) || [];
        existing.push(acc);
        addressMap.set(key, existing);
      }

      for (const [addressKey, accs] of addressMap) {
        if (accs.length < 2) continue;
        for (const acc of accs) processed.add(acc.id);
        // Display a readable label from the address parts
        const parts = addressKey.split('|').filter(Boolean);
        const label = parts.join(', ') || 'Same address';
        groups.push({
          name: `Address match: ${label}`,
          accounts: accs,
          similarityScore: 0.85, // Address-based matches get a fixed high score
          matchType: 'address',
        });
      }
    }

    // Sort groups by similarity score (probability) descending - highest probability first
    groups.sort((a, b) => {
      if (b.similarityScore !== a.similarityScore) {
        return b.similarityScore - a.similarityScore;
      }
      return b.accounts.length - a.accounts.length;
    });

    return NextResponse.json({ groups });
  } catch (error: any) {
    console.error('Error finding similar accounts:', error);
    const errorMessage = error?.message || error?.details || 'Failed to find similar accounts';
    const statusCode = error?.code === 'PGRST116' ? 400 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

