import { User } from '@supabase/supabase-js';

// Define the possible roles
export type AppRole = 'admin' | 'moderator' | 'user' | 'anonymous' | 'guest';

export function getUserRole(user: User | null): AppRole {
  if (!user) return 'guest'; // No user object -> logged out

  // --- MODIFIED CHECK FOR ANONYMOUS --- 
  if (user.is_anonymous) return 'anonymous'; // Use the direct flag

  // Check for specific roles stored in app_metadata first
  const assignedRole = user.app_metadata?.user_role;
  if (assignedRole === 'admin') return 'admin';
  if (assignedRole === 'moderator') return 'moderator';

  // If authenticated, not anonymous, and no specific role assigned, they are a standard 'user'
  return 'user'; 
}

// Updated canDeleteEvent to handle 'moderator' and 'user'
export function canDeleteEvent(user: User | null, eventUserId: string | undefined): boolean {
  if (!user || !eventUserId) return false; // Cannot delete if not logged in or event has no owner ID

  const role = getUserRole(user);

  switch (role) {
    case 'admin':
    case 'moderator':
      return true; // Admins and Moderators can delete any event
    case 'user':
      return user.id === eventUserId; // Regular users can delete only their own events
    case 'anonymous':
    case 'guest':
    default:
      return false; // Anonymous and guest users cannot delete events
  }
}

// Optional: Add a function for checking insert/update permissions if needed elsewhere
export function canCreateEvent(user: User | null): boolean {
  if (!user) return false;
  const role = getUserRole(user);
  // Allow standard users, moderators, and admins to create
  return role === 'user' || role === 'moderator' || role === 'admin';
}

// Function to check if a user can edit a specific event
export function canEditEvent(user: User | null, eventUserId: string | undefined): boolean {
  if (!user || !eventUserId) return false; // Cannot edit if not logged in or event has no owner

  const role = getUserRole(user);

  switch (role) {
    case 'admin':
    case 'moderator':
      return true; // Admins and Moderators can edit any event
    case 'user':
      return user.id === eventUserId; // Regular users can edit only their own events
    case 'anonymous':
    case 'guest':
    default:
      return false; // Anonymous and guest users cannot edit events
  }
} 