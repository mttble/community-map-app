export interface Event {
  id?: string;
  title: string;
  description: string;
  type: string;
  lat: number;
  lng: number;
  user_id?: string;
}

export type UserRole = 'guest' | 'anonymous' | 'authenticated';

export interface UserPermissions {
  canCreate: boolean;
  canDelete: boolean;
  canEdit: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  guest: {
    canCreate: false,
    canDelete: false,
    canEdit: false
  },
  anonymous: {
    canCreate: false,
    canDelete: false,
    canEdit: false
  },
  authenticated: {
    canCreate: true,
    canDelete: true,
    canEdit: true
  }
}; 