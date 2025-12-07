import { checkTrialStatus, isTrialExpired, startTrial } from '@/lib/supabase/subscriptions';

export interface TrialStatus {
  isActive: boolean;
  isExpired: boolean;
  expiresAt: string | null;
  daysRemaining: number | null;
}

/**
 * Check if user has an active trial
 */
export async function checkUserTrialStatus(userId: string): Promise<TrialStatus> {
  const isActive = await checkTrialStatus(userId);
  const expired = await isTrialExpired(userId);

  // Get expiration date
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: user } = await supabase
    .from('users')
    .select('trial_expires_at')
    .eq('id', userId)
    .single();

  const expiresAt = (user as any)?.trial_expires_at || null;
  let daysRemaining: number | null = null;

  if (expiresAt && isActive) {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    isActive,
    isExpired: expired,
    expiresAt,
    daysRemaining,
  };
}

/**
 * Initialize a 7-day free trial for a user
 */
export async function initializeTrial(userId: string): Promise<boolean> {
  return await startTrial(userId);
}

/**
 * Format days remaining for display
 */
export function formatDaysRemaining(days: number | null): string {
  if (days === null) return 'N/A';
  if (days <= 0) return 'Expired';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

