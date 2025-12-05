import type { User, UserRole } from '@/lib/supabase/types';

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, 'admin');
}

/**
 * Check if user is BD team member
 */
export function isBDTeam(user: User | null): boolean {
  return hasRole(user, 'bd_team');
}

/**
 * Check if user can access admin features
 * (admin or bd_team roles)
 */
export function canAccessAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'bd_team';
}

