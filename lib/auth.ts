import { User } from '@supabase/supabase-js';

export function getUserRole(user: User | null): 'admin' | 'authenticated' | 'anonymous' | 'guest' {
  if (!user) return 'guest';
  if (user.app_metadata?.is_admin || user.app_metadata?.is_super_admin) return 'admin';
  if (user.app_metadata?.provider === 'anonymous') return 'anonymous';
  return 'authenticated';
}

export function canDeleteEvent(user: User | null, eventUserId: string): boolean {
  const role = getUserRole(user);
  switch (role) {
    case 'admin':
      return true;  // Admins can delete any event
    case 'authenticated':
      return user?.id === eventUserId;  // Regular users can delete their own events
    case 'anonymous':
    case 'guest':
      return false;  // Anonymous and guest users cannot delete events
    default:
      return false;
  }
} 