import { User } from '@supabase/supabase-js';

export function getUserRole(user: User | null): 'admin' | 'moderator' | 'authenticated' | 'anonymous' | 'guest' {
  if (!user) return 'guest';
  
  // Check for admin first (using app_metadata)
  if (user.app_metadata?.is_admin) return 'admin';
  
  // Check for moderator
  if (user.app_metadata?.is_moderator) return 'moderator';
  
  // Check for anonymous user
  if (user.app_metadata?.provider === 'anonymous' || user.is_anonymous) return 'anonymous';
  
  // If user is authenticated but not admin or anonymous
  return 'authenticated';
}

export function canDeleteEvent(user: User | null, eventUserId: string): boolean {
  const role = getUserRole(user);
  switch (role) {
    case 'admin':
    case 'moderator':
      return true;  // Admins and moderators can delete any event
    case 'authenticated':
      return user?.id === eventUserId;  // Regular users can delete their own events
    case 'anonymous':
    case 'guest':
      return false;  // Anonymous and guest users cannot delete events
    default:
      return false;
  }
}

export function canCreateEvent(user: User | null): boolean {
  const role = getUserRole(user);
  switch (role) {
    case 'admin':
    case 'moderator':
    case 'authenticated':
      return true;  // Admins, moderators and authenticated users can create events
    case 'anonymous':
    case 'guest':
      return false;  // Anonymous and guest users cannot create events
    default:
      return false;
  }
} 